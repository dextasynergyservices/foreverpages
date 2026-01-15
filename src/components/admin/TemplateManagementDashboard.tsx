"use client";
import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UploadTemplateDialog from "@/components/admin/UploadTemplateDialog";
import TemplateConfigWizard from "@/components/admin/TemplateConfigWizard";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Edit, Upload, Loader2, Wand2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { getOptimizedImageUrl, extractPublicId } from "@/lib/cloudinary-client";
import { LoadingSpinner } from "@/components/ui/skeleton";
import toastNotification from "@/lib/toastNotifications";

type TemplateCategoryBrief = { categoryId: string; category: { id: string; name: string } };
type TemplateBrief = {
  id: string;
  name: string;
  description?: string | null;
  thumbnailImage?: string | null;
  previewImage?: string | null;
  processingStatus?: string | null;
  templateCategories?: TemplateCategoryBrief[];
  slug?: string;
  prNumber?: string | null;
  type?: string | null;
  previewMode?: string | null;
  prUrl?: string | null;
};

type TemplateVersionBrief = {
  id: string;
  name: string;
  version?: string | null;
  packageUrl?: string | null;
  createdAt: string;
  createdById?: string | null;
};

export default function TemplateManagementDashboard() {
  // Helper to safely parse JSON responses that may be empty or invalid
  async function parseJsonOrNull(res: Response) {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  // Extract a human-friendly error message from parsed responses
  function getErrorMessage(parsed: unknown): string | null {
    if (!parsed) return null;
    if (typeof parsed === "string") return parsed;
    if (typeof parsed === "object" && parsed !== null) {
      const p = parsed as Record<string, unknown>;
      if (typeof p.error === "string") return p.error;
      if (typeof p.message === "string") return p.message;
      if (p.data && typeof p.data === "object" && p.data !== null) {
        const d = p.data as Record<string, unknown>;
        if (typeof d.message === "string") return d.message;
      }
    }
    return null;
  }
  const queryClient = useQueryClient();
  type ErrorResponse = { message?: string } | null;
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [reuploadFor, setReuploadFor] = useState<string | null>(null);
  const [showVersionsFor, setShowVersionsFor] = useState<string | null>(null);
  const [versions, setVersions] = useState<TemplateVersionBrief[]>([]);
  const [logsModalFor, setLogsModalFor] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [previewFor, setPreviewFor] = useState<string | null>(null);
  const [previewModeOverride, setPreviewModeOverride] = useState<"iframe" | "static" | null>(null);
  const [mergeConfirmFor, setMergeConfirmFor] = useState<string | null>(null);
  const [mergeResult, setMergeResult] = useState<string | null>(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const POLL_MS = 3000;
  type LogsStatusShape = {
    processingLogs?: string | null;
    processingLogsUrl?: string | null;
  } | null;

  const { data: logsStatus } = useQuery({
    queryKey: ["template-logs", logsModalFor],
    queryFn: async () => {
      if (!logsModalFor) return null;
      const res = await fetch(`/api/admin/templates/${logsModalFor}/status`);
      if (!res.ok) return null;
      return (await parseJsonOrNull(res)) as unknown;
    },
    enabled: !!logsModalFor,
    refetchInterval: logsModalFor ? POLL_MS : false,
  });

  const logsStatusTyped = logsStatus as unknown as LogsStatusShape;
  const logsContent = logsStatusTyped
    ? logsStatusTyped.processingLogs || logsStatusTyped.processingLogsUrl || ""
    : null;

  const { data: templates = [], isLoading } = useQuery<TemplateBrief[]>({
    queryKey: ["admin-templates-dashboard", selectedStatus],
    queryFn: async () => {
      const q = selectedStatus ? `?status=${encodeURIComponent(selectedStatus)}` : "";
      const res = await fetch(`/api/admin/templates/templates${q}`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      const parsed = await parseJsonOrNull(res);
      return (parsed as TemplateBrief[]) || [];
    },
  });

  const mergeTpl = mergeConfirmFor ? templates.find((x) => x.id === mergeConfirmFor) : null;

  const { data: plans = [] } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const response = await fetch("/api/plans?all=true");
      if (!response.ok) throw new Error("Failed to fetch plans");
      const result = (await parseJsonOrNull(response)) as { data?: unknown } | null;
      if (result?.data && Array.isArray(result.data)) return result.data as TemplateBrief[];
      return [];
    },
  });

  const { data: categories = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["admin-categories-dashboard"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/templates/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const parsed = await parseJsonOrNull(res);
      return (parsed as { id: string; name: string }[]) || [];
    },
  });

  const toggleCategoryMutation = useMutation({
    mutationFn: async ({
      templateId,
      categoryId,
      assign,
    }: {
      templateId: string;
      categoryId: string;
      assign: boolean;
    }) => {
      const res = await fetch(`/api/admin/templates/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, assign }),
      });
      const parsed = (await parseJsonOrNull(res)) as ErrorResponse;
      if (!res.ok)
        throw new Error((parsed && parsed.message) || "Failed to update template category");
      return parsed;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-templates-dashboard"] }),
  });

  const previewModeMutation = useMutation({
    mutationFn: async ({
      templateId,
      previewMode,
    }: {
      templateId: string;
      previewMode: "AUTO" | "IFRAME" | "STATIC" | null;
    }) => {
      const res = await fetch(`/api/admin/templates/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewMode }),
      });
      const parsed = (await parseJsonOrNull(res)) as ErrorResponse;
      if (!res.ok) throw new Error((parsed && parsed.message) || "Failed to update preview mode");
      return parsed;
    },
    onSuccess: () => {
      toastNotification.success("Preview mode updated");
      queryClient.invalidateQueries({ queryKey: ["admin-templates-dashboard"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to update preview mode";
      toastNotification.error(message);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/templates/${id}/publish`, { method: "POST" });
      const parsed = (await parseJsonOrNull(res)) as ErrorResponse;
      if (!res.ok) throw new Error((parsed && parsed.message) || "Failed to publish template");
      return parsed;
    },
    onSuccess: () => {
      toastNotification.success("Template published successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-templates-dashboard"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to publish template";
      toastNotification.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/templates/templates/${id}`, { method: "DELETE" });
      const parsed = (await parseJsonOrNull(res)) as ErrorResponse;
      if (!res.ok) throw new Error((parsed && parsed.message) || "Delete failed");
      return parsed;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-templates-dashboard"] }),
  });

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchVersions = async (templateId: string): Promise<TemplateVersionBrief[]> => {
    const res = await fetch(`/api/admin/templates/${templateId}/versions`);
    if (!res.ok) throw new Error("Failed to fetch versions");
    const j = await res.json();
    return (j.data?.versions as TemplateVersionBrief[]) || [];
  };

  const rollbackMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await fetch(`/api/admin/templates/versions/${versionId}/rollback`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Rollback failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-templates-dashboard"] }),
  });

  const loadingToastRef = useRef<string | null>(null);

  const exportMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch(`/api/admin/templates/${templateId}/package`);
      if (!res.ok) throw new Error("Export failed");
      return res.json();
    },
    onMutate: () => {
      const id = toastNotification.loading("Preparing package...");
      loadingToastRef.current = id as unknown as string;
    },
    onSuccess: (data) => {
      const url = data?.data?.packageUrl;
      if (loadingToastRef.current) toastNotification.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
      if (url) {
        toastNotification.success("Package ready — opening...");
        window.open(url, "_blank");
      } else {
        toastNotification.error("No package available for this template");
      }
    },
    onError: (err: unknown) => {
      if (loadingToastRef.current) toastNotification.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
      const message = err instanceof Error ? err.message : "Export failed";
      toastNotification.error(message);
    },
  });

  const mergeMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const id = toastNotification.loading("Merging PR...");
      loadingToastRef.current = id as unknown as string;
      const res = await fetch(`/api/admin/templates/${templateId}/merge`, { method: "POST" });
      const parsed = await parseJsonOrNull(res);
      if (!res.ok) {
        const msg = getErrorMessage(parsed) || "Merge failed";
        throw new Error(msg);
      }
      return parsed;
    },
    onSuccess: () => {
      if (loadingToastRef.current) toastNotification.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
      toastNotification.success("Merge succeeded");
      queryClient.invalidateQueries({ queryKey: ["admin-templates-dashboard"] });
    },
    onError: (err: unknown) => {
      if (loadingToastRef.current) toastNotification.dismiss(loadingToastRef.current);
      loadingToastRef.current = null;
      const message = err instanceof Error ? err.message : "Merge failed";
      toastNotification.error(message);
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Template Management</h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus ?? ""}
            onChange={(e) => setSelectedStatus(e.target.value || null)}
            className="border p-1"
          >
            <option value="">All statuses</option>
            <option value="PROCESSING">Processing</option>
            <option value="VALIDATED">Valid</option>
            <option value="ERROR">Error</option>
            <option value="SECURITY_REVIEW">Security Review</option>
          </select>
          <Button variant="outline" onClick={() => setShowWizard(true)}>
            <Wand2 className="w-4 h-4 mr-2" /> Config Wizard
          </Button>
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4 mr-2" /> Upload Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {templates.map((t) => (
          <div key={t.id} className="p-3 border rounded flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.thumbnailImage || "/placeholder-template.png"}
              alt={t.name}
              className="w-20 h-12 object-cover rounded"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                const target = e.currentTarget as HTMLImageElement | null;
                if (target) target.src = "/placeholder-template.png";
              }}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.description}</div>
                </div>
                <div className="text-sm flex items-center gap-2">
                  <Badge
                    variant={
                      t.processingStatus === "PUBLISHED"
                        ? "default"
                        : t.processingStatus === "VALIDATED"
                          ? "secondary"
                          : t.processingStatus === "ERROR"
                            ? "destructive"
                            : "outline"
                    }
                  >
                    {t.processingStatus ?? "UNKNOWN"}
                  </Badge>
                  {t.processingStatus === "ERROR" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLogsModalFor(t.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      View Error
                    </Button>
                  )}
                  {/* Template type badge (modular/single) - manifest may include `type` */}
                  <Badge variant="secondary">{t.type ?? "modular"}</Badge>
                  {/* Preview mode badge (iframe/static) */}
                  <Badge variant="outline">{t.previewMode ?? "AUTO"}</Badge>
                  <select
                    value={(t.previewMode || "AUTO").toUpperCase()}
                    onChange={(e) => {
                      const val = (e.target.value || "AUTO") as "AUTO" | "IFRAME" | "STATIC";
                      previewModeMutation.mutate({ templateId: t.id, previewMode: val });
                    }}
                    className="border rounded px-1 py-0 text-sm"
                  >
                    <option value="AUTO">Auto</option>
                    <option value="IFRAME">Iframe</option>
                    <option value="STATIC">Static</option>
                  </select>
                  {/* Audit metadata (if present) */}
                  {(() => {
                    const audit = t as unknown as {
                      previewModeUpdatedAt?: string;
                      previewModeUpdatedBy?: string;
                    };
                    if (!audit.previewModeUpdatedAt && !audit.previewModeUpdatedBy) return null;
                    return (
                      <div className="text-xs text-muted-foreground ml-2">
                        {audit.previewModeUpdatedAt
                          ? `Updated ${new Date(audit.previewModeUpdatedAt).toLocaleString()}`
                          : null}
                        {audit.previewModeUpdatedBy ? ` by ${audit.previewModeUpdatedBy}` : null}
                      </div>
                    );
                  })()}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      previewModeMutation.mutate({ templateId: t.id, previewMode: null })
                    }
                  >
                    Clear override
                  </Button>
                  {/* PR status: show PR number if available */}
                  {t.prNumber ? <Badge variant="destructive">PR #{t.prNumber}</Badge> : null}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {categories.map((cat) => {
                  const assigned = t.templateCategories?.some((tc) => tc.categoryId === cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() =>
                        toggleCategoryMutation.mutate({
                          templateId: t.id,
                          categoryId: cat.id,
                          assign: !assigned,
                        })
                      }
                      className={`px-2 py-1 text-sm rounded ${assigned ? "bg-blue-600 text-white" : "bg-slate-100"}`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {t.processingStatus === "VALIDATED" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => publishMutation.mutate(t.id)}
                  disabled={publishMutation.isPending}
                >
                  Publish
                </Button>
              )}
              <Button variant="ghost" onClick={() => alert("Edit opens existing edit dialog")}>
                <Edit />
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setReuploadFor(t.id);
                  setShowUpload(true);
                }}
              >
                Re-upload
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  setShowVersionsFor(t.id);
                  try {
                    const vers = await fetchVersions(t.id);
                    setVersions(vers);
                  } catch {
                    alert("Failed to load versions");
                  }
                }}
              >
                Versions
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const pub = extractPublicId(t.previewImage || "") || t.previewImage;
                  const url = pub
                    ? getOptimizedImageUrl(pub, { width: 800, height: 450 })
                    : t.previewImage || "/placeholder-template.png";
                  window.open(url, "_blank");
                }}
              >
                View
              </Button>
              <Button
                variant="ghost"
                onClick={() => exportMutation.mutate(t.id)}
                disabled={exportMutation.status === "pending"}
              >
                {exportMutation.status === "pending" ? "Exporting..." : "Export"}
              </Button>
              <Button variant="ghost" onClick={() => setPreviewFor(t.id)}>
                Preview
              </Button>
              <Button variant="outline" onClick={() => setLogsModalFor(t.id)}>
                Show logs
              </Button>
              {t.prNumber && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setMergeConfirmFor(t.id);
                    setMergeResult(null);
                  }}
                  disabled={mergeMutation.isPending}
                >
                  {mergeMutation.isPending ? "Merging..." : "Merge"}
                </Button>
              )}
              {/** If PR URL exists on the template, show a link button */}
              {t.prUrl && (
                <a className="btn-ghost text-sm" href={t.prUrl} target="_blank" rel="noreferrer">
                  View PR
                </a>
              )}
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteTargetId(t.id);
                  setDeleteError(null);
                  setDeleteDialogOpen(true);
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <UploadTemplateDialog
        plans={plans}
        categories={categories}
        templateIdToReplace={reuploadFor}
        open={showUpload}
        onOpenChange={(v) => setShowUpload(v)}
        hideTrigger
      />

      {/* Template Configuration Wizard - Advanced scaffold generation with quality checks */}
      <TemplateConfigWizard
        open={showWizard}
        onOpenChange={(open) => {
          setShowWizard(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ["admin-templates-dashboard"] });
          }
        }}
        onComplete={() => {
          setShowWizard(false);
          queryClient.invalidateQueries({ queryKey: ["admin-templates-dashboard"] });
          toastNotification.success("Template scaffold generated successfully");
        }}
      />

      <Dialog open={!!showVersionsFor} onOpenChange={() => setShowVersionsFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Versions</DialogTitle>
          <div className="mt-3 space-y-2">
            {versions.length === 0 && <div>No versions found</div>}
            {versions.map((v) => (
              <div key={v.id} className="p-2 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {v.name} — {new Date(v.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">v{v.version}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (!confirm("Rollback to this version?")) return;
                      rollbackMutation.mutate(v.id);
                    }}
                  >
                    Rollback
                  </Button>
                  <Button
                    onClick={() => {
                      if (v.packageUrl) window.open(v.packageUrl, "_blank");
                      else alert("No package URL available for this version");
                    }}
                  >
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!logsModalFor} onOpenChange={() => setLogsModalFor(null)}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-between">
            <DialogTitle>Template Logs</DialogTitle>
            <div>
              <Button
                onClick={async () => {
                  if (!logsModalFor) return;
                  try {
                    setLogsLoading(true);
                    const res = await fetch(`/api/admin/templates/${logsModalFor}/reprocess`, {
                      method: "POST",
                    });
                    if (!res.ok) throw new Error("Failed to reprocess");
                    toastNotification.success("Reprocess queued");
                    queryClient.invalidateQueries({ queryKey: ["admin-templates-dashboard"] });
                  } catch (e) {
                    toastNotification.error(String((e as Error).message || e));
                  } finally {
                    setLogsLoading(false);
                  }
                }}
                disabled={logsLoading}
              >
                Reprocess
              </Button>
            </div>
          </div>

          <div className="mt-3">
            {logsLoading && <div>Queueing...</div>}
            {!logsLoading && (
              <div>
                {/* Show error prominently if status is ERROR */}
                {(() => {
                  const tpl = templates.find((x) => x.id === logsModalFor);
                  if (tpl?.processingStatus === "ERROR") {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded p-4 mb-3">
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 text-2xl">⚠️</span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-red-800 mb-2">
                              Template Processing Failed
                            </h3>
                            <p className="text-red-700 text-sm">
                              {logsContent?.includes("section")
                                ? "Failed to create template sections. Check if config.json is valid."
                                : "An error occurred during template processing."}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <pre className="bg-slate-100 p-3 rounded max-h-80 overflow-auto text-xs">
                  {logsContent || "No logs yet"}
                </pre>

                {/* Show helpful debugging info */}
                {logsContent && logsContent.includes("[process-sections]") && (
                  <div className="mt-3 text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                    <strong>💡 Tip:</strong> Look for lines starting with{" "}
                    <code className="bg-blue-100 px-1 rounded">[process-sections]</code> to see
                    section creation details
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewFor} onOpenChange={() => setPreviewFor(null)}>
        <DialogContent className="max-w-4xl w-[90vw]">
          <DialogTitle>Template Preview</DialogTitle>
          <div className="mt-3">
            {/* Use processingLogsUrl first (could be run URL or artifact URL), fallback to packageUrl via export API */}
            {previewFor ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm">Preview mode:</div>
                  <select
                    value={previewModeOverride ?? ""}
                    onChange={(e) =>
                      setPreviewModeOverride(
                        e.target.value ? (e.target.value as "iframe" | "static") : null
                      )
                    }
                    className="border p-1"
                  >
                    <option value="">Default</option>
                    <option value="iframe">Iframe</option>
                    <option value="static">Static</option>
                  </select>
                </div>
                <div className="h-[60vh] w-full">
                  <iframe
                    src={`/api/admin/templates/${previewFor}/preview${previewModeOverride ? `?mode=${previewModeOverride}` : ""}`}
                    className="w-full h-full border"
                    title="Template Preview"
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={() => {
                      if (!previewFor) return;
                      let val: "AUTO" | "IFRAME" | "STATIC" | null = null;
                      if (previewModeOverride === null) val = null;
                      else if (previewModeOverride === "iframe") val = "IFRAME";
                      else val = "STATIC";
                      previewModeMutation.mutate({ templateId: previewFor, previewMode: val });
                    }}
                  >
                    Save override
                  </Button>
                </div>
              </div>
            ) : (
              <div>No preview available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mergeConfirmFor} onOpenChange={() => setMergeConfirmFor(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>Confirm Merge</DialogTitle>
          <div className="mt-3">
            <p>
              Confirm merging the pull request for this template into <strong>develop</strong>.
            </p>
            {mergeResult && <pre className="bg-slate-100 p-2 rounded mt-3">{mergeResult}</pre>}
            {/* Show PR link if available for the template being merged */}
            {mergeTpl?.prUrl ? (
              <div className="mt-2">
                <a
                  className="text-sm text-blue-600"
                  href={mergeTpl.prUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View PR
                </a>
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={async () => {
                if (!mergeConfirmFor) return;
                try {
                  setMergeLoading(true);
                  const res = await mergeMutation.mutateAsync(mergeConfirmFor);
                  setMergeResult(JSON.stringify(res || { ok: true }));
                } catch (e) {
                  setMergeResult(String(e));
                } finally {
                  setMergeLoading(false);
                  queryClient.invalidateQueries({ queryKey: ["admin-templates-dashboard"] });
                }
              }}
              disabled={mergeLoading || mergeMutation.isPending}
            >
              {mergeLoading || mergeMutation.isPending ? "Merging..." : "Confirm Merge"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setMergeConfirmFor(null)}
              disabled={mergeLoading}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open: boolean) => !open && setDeleteDialogOpen(false)}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && <div className="text-sm text-destructive p-2">{deleteError}</div>}

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTargetId) return;
                setDeleteLoading(true);
                setDeleteError(null);
                try {
                  await deleteMutation.mutateAsync(deleteTargetId);
                  setDeleteDialogOpen(false);
                  setDeleteTargetId(null);
                } catch (err) {
                  setDeleteError(err instanceof Error ? err.message : String(err));
                } finally {
                  setDeleteLoading(false);
                }
              }}
              disabled={deleteLoading}
            >
              {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
