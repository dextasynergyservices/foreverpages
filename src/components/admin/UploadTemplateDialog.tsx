"use client";
import React, { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import JSZip from "jszip";
import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";

type Plan = { id: string; name: string };
type Category = { id: string; name: string };
type StepStatus = "idle" | "running" | "done" | "error";
type PreviewManifest = Record<string, unknown> | null;
type UploadResponse = {
  message?: string;
  data?: {
    templateId?: string;
    manifest?: Record<string, unknown>;
    generatedManifest?: Record<string, unknown>;
    generatedNotes?: string[];
    uploaded?: Record<string, unknown>;
  };
} | null;

function usePollingStatus(templateId: string | null) {
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => {
    if (!templateId) return;
    let mounted = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/templates/${templateId}/status`);
        if (!res.ok) return;
        const j = (await parseJsonOrNull(res)) as Record<string, unknown> | null;
        if (!mounted || !j) return;
        setStatus((j.status as string) || null);
        if ((j.status as string) === "PROCESSING") setTimeout(poll, 2000);
      } catch {
        // ignore transient errors
        setTimeout(poll, 3000);
      }
    };
    poll();
    return () => {
      mounted = false;
    };
  }, [templateId]);
  return status;
}

// Safe JSON parse helper for this module
async function parseJsonOrNull(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function UploadTemplateDialog({
  plans = [],
  categories = [],
  templateIdToReplace = null,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  plans?: Plan[];
  categories?: Category[];
  templateIdToReplace?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string | null>(null);
  const [planQuery, setPlanQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [uploadedTemplateId, setUploadedTemplateId] = useState<string | null>(null);
  // Persist last uploaded template id in session so admin can see status across navigation
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("lastUploadedTemplateId");
      if (saved) setUploadedTemplateId(saved);
    } catch {
      // ignore
    }
  }, []);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [prNumber, setPrNumber] = useState<string | null>(null);
  const [publishUrl, setPublishUrl] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [previewManifest, setPreviewManifest] = useState<PreviewManifest>(null);
  const [preValidationErrors, setPreValidationErrors] = useState<string[]>([]);
  const [preValidationWarnings, setPreValidationWarnings] = useState<string[]>([]);
  const [detectedTemplateType, setDetectedTemplateType] = useState<"nextjs" | "react-spa" | null>(
    null
  );
  type Steps = { extract: StepStatus; validate: StepStatus };
  const initialPreSteps: Steps = { extract: "idle", validate: "idle" };
  const [preSteps, setPreSteps] = useState<Steps>(initialPreSteps);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [processStep, setProcessStep] = useState<StepStatus>("idle");
  const [uploadStep, setUploadStep] = useState<StepStatus>("idle");
  // 🔥 Enhanced: Scaffold generation info
  const [scaffoldInfo, setScaffoldInfo] = useState<{
    generated: number;
    files: string[];
    warnings: string[];
  } | null>(null);

  const getManifestString = (m: PreviewManifest, key: string): string | undefined => {
    if (!m) return undefined;
    const val = m[key];
    return typeof val === "string" ? val : undefined;
  };

  const mutation = useMutation<UploadResponse, Error, File>({
    mutationFn: (file: File) =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = "/api/admin/templates/upload";
        const form = new FormData();
        form.append("file", file);
        if (templateIdToReplace) form.append("replaceTemplateId", templateIdToReplace);
        form.append("planIds", JSON.stringify(selectedPlanIds));
        form.append("categoryIds", JSON.stringify(selectedCategoryIds));
        if (primaryCategoryId) form.append("primaryCategoryId", primaryCategoryId);
        // Debug: log form contents and start
        try {
          const entries = Array.from(form.entries()).map((e) => [String(e[0]), e[1]]);
          console.debug("Upload: preparing XHR", {
            url,
            fileName: file.name,
            fileSize: file.size,
            entries,
          });
        } catch (e) {
          console.debug("Upload: failed to enumerate form entries", e);
        }

        xhr.open("POST", url);
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e: ProgressEvent<EventTarget>) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
          const text = xhr.responseText || "";
          let parsed: UploadResponse = null;
          try {
            parsed = text ? (JSON.parse(text) as UploadResponse) : null;
          } catch {
            setUploadStep("error");
            console.error("Upload: failed to parse server response", { status: xhr.status, text });
            reject(new Error("Failed to parse upload response"));
            return;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadStep("done");
            setUploadProgress(100);
            resolve(parsed);
          } else {
            setUploadStep("error");
            // Collect response headers for diagnostics
            const headers: Record<string, string> = {};
            try {
              xhr
                .getAllResponseHeaders()
                .split("\r\n")
                .filter(Boolean)
                .forEach((h) => {
                  const idx = h.indexOf(":");
                  if (idx > 0) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
                });
            } catch {}

            console.error("Upload failed", {
              status: xhr.status,
              statusText: xhr.statusText,
              headers,
              // include parsed object when available for easier debugging
              parsed: parsed || null,
              text: text || null,
            });

            try {
              if (parsed && typeof parsed === "object") {
                console.error("Upload response (full):", JSON.stringify(parsed, null, 2));
              } else if (text) {
                console.error("Upload response (text):", text);
              }
            } catch (ee) {
              console.error("Failed to stringify server response", ee);
            }

            // Attach helpful hint to rejected error
            const errToReject =
              parsed || new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`);
            reject(errToReject);
          }
        };

        xhr.onabort = () => {
          setUploadStep("idle");
          setUploadProgress(null);
          reject(new Error("Upload aborted"));
        };

        xhr.onerror = () => {
          const raw = xhr.responseText;
          let parsed: unknown = undefined;
          try {
            parsed = raw ? JSON.parse(raw) : undefined;
          } catch {
            /* ignore parse errors */
          }

          const headers: Record<string, string> = {};
          try {
            xhr
              .getAllResponseHeaders()
              .split("\r\n")
              .filter(Boolean)
              .forEach((h) => {
                const idx = h.indexOf(":");
                if (idx > 0) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
              });
          } catch {
            /* ignore */
          }

          console.error("Upload failed (network/error)", {
            status: xhr.status,
            statusText: xhr.statusText,
            headers,
            responseText: raw,
            parsedBody: parsed,
            xhr,
          });

          setUploadStep("error");
          const maybeMsg =
            parsed && typeof parsed === "object"
              ? (parsed as Record<string, unknown>)["message"]
              : undefined;
          const parsedMessage = typeof maybeMsg === "string" ? maybeMsg : undefined;
          setApiError(parsedMessage || `Upload failed: ${xhr.status} ${xhr.statusText}`);
          reject(parsed || new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        };

        xhr.send(form);
      }),
  });

  // Derive boolean flags from `mutation.status` for type-safe checks.
  // `@tanstack/react-query` uses 'loading' | 'success' | 'error' etc.
  const isLoading = mutation.status === "pending";
  const isSuccess = mutation.status === "success";
  const isError = mutation.status === "error";

  const [planError, setPlanError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const status = usePollingStatus(uploadedTemplateId);
  const [logs, setLogs] = useState<string | null>(null);
  const [packageUrl, setPackageUrl] = useState<string | null>(null);
  const [logsUrl, setLogsUrl] = useState<string | null>(null);
  const [generatedManifest, setGeneratedManifest] = useState<Record<string, unknown> | null>(null);
  const [generatedNotes, setGeneratedNotes] = useState<string[] | null>(null);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [sseError, setSseError] = useState<string | null>(null);

  const isControlled = typeof controlledOpen === "boolean";
  const openState = isControlled ? controlledOpen! : internalOpen;
  const setOpenState = React.useCallback(
    (v: boolean) => {
      if (isControlled) onOpenChange?.(v);
      else setInternalOpen(v);
    },
    [isControlled, onOpenChange]
  );

  useEffect(() => {
    if (status && status !== "PROCESSING") {
      // processing finished (VALIDATED, ERROR, PUBLISHED)
      if (status === "VALIDATED" || status === "PUBLISHED") {
        toast.success(`Template ${status.toLowerCase()}`);
        // close dialog after a short delay so admin can see success briefly
        setTimeout(() => setOpenState(false), 1200);
      } else if (status === "ERROR") {
        toast.error("Template processing failed. Check logs for details.");
      } else {
        toast(`Template status: ${status}`);
      }
    }
  }, [status, setOpenState]);

  useEffect(() => {
    if (openState && fileInputRef.current) {
      // focus the file input when dialog opens for keyboard users
      fileInputRef.current.focus();
    }
  }, [openState]);

  // Simple focus trap for dialog (keeps focus inside while open)
  useEffect(() => {
    if (!openState || !dialogRef.current) return;
    const root = dialogRef.current;
    const focusable = root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function onKey(e: Event) {
      const ke = e as KeyboardEvent;
      if (ke.key !== "Tab") return;
      if (ke.shiftKey) {
        if (document.activeElement === first) {
          ke.preventDefault();
          (last as HTMLElement).focus();
        }
      } else {
        if (document.activeElement === last) {
          ke.preventDefault();
          (first as HTMLElement).focus();
        }
      }
    }
    root.addEventListener("keydown", onKey as EventListener);
    return () => root.removeEventListener("keydown", onKey as EventListener);
  }, [openState]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setSelectedFile(f);
    setApiError(null);
    setPreviewManifest(null);
    setPreValidationErrors([]);
    setPreValidationWarnings([]);
    setPreSteps({ extract: "idle", validate: "idle" });
    setUploadProgress(null);
    // clear previous validation hints when file changes
    setPlanError(null);
    setCategoryError(null);

    if (!f) return;

    // Client-side preview and lightweight validation
    (async () => {
      try {
        setPreSteps({ extract: "running", validate: "idle" });
        const zip = await JSZip.loadAsync(f as Blob);
        setPreSteps({ extract: "done", validate: "running" });

        const names = Object.keys(zip.files || {});
        const errors: string[] = [];
        const warnings: string[] = [];

        // Detect template type
        const hasPageTsx = names.some((n) => n.endsWith("page.tsx"));
        const hasManifestJson = names.some((n) => n.endsWith("manifest.json"));
        const hasMemorialTemplate = names.some((n) => n.endsWith("MemorialTemplate.tsx"));
        const hasConfigJson = names.some((n) => n.endsWith("config.json"));

        if (hasPageTsx && hasManifestJson) {
          // Next.js template validation
          const required = ["page.tsx", "manifest.json"];
          for (const r of required) {
            if (!names.some((n) => n.endsWith(r))) errors.push(`Missing required file: ${r}`);
          }

          // Recommended files
          if (!names.some((n) => n.endsWith("layout.tsx"))) {
            warnings.push("Recommended file missing: layout.tsx");
          }
          if (!names.some((n) => n.endsWith("config.ts"))) {
            warnings.push("Recommended file missing: config.ts");
          }

          // Try to read manifest.json
          const manifestEntry = names.find((n) => n.toLowerCase().endsWith("manifest.json"));
          if (manifestEntry) {
            try {
              const txt = await zip.files[manifestEntry].async("text");
              const parsed = JSON.parse(txt);
              setPreviewManifest(parsed);
              if (!parsed.name) errors.push("manifest.json missing required field: name");
              if (!parsed.slug) errors.push("manifest.json missing required field: slug");
              if (!parsed.version) warnings.push("manifest.json missing version field");

              // Check slug format
              if (parsed.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parsed.slug)) {
                errors.push("manifest.json: slug must be lowercase alphanumeric with hyphens only");
              }
            } catch {
              errors.push("Failed to parse manifest.json");
            }
          }

          // Check for public directory with preview images
          const hasPublic = names.some((n) => n.includes("public/"));
          if (!hasPublic) {
            warnings.push("No public directory found for preview images");
          } else {
            if (!names.some((n) => n.includes("public/preview.png"))) {
              warnings.push("No preview.png found in public directory");
            }
            if (!names.some((n) => n.includes("public/thumbnail.png"))) {
              warnings.push("No thumbnail.png found in public directory");
            }
          }

          if (!errors.length) {
            warnings.unshift("✅ Next.js template detected");
            setDetectedTemplateType("nextjs");
          }
        } else if (hasMemorialTemplate && hasConfigJson) {
          setDetectedTemplateType("react-spa");
          // React SPA template validation (legacy)
          const required = ["config.json", "MemorialTemplate.tsx", "preview.png", "thumbnail.png"];
          for (const r of required) {
            if (!names.some((n) => n.endsWith(r))) errors.push(`Missing ${r}`);
          }

          // Try to read config.json
          const cfgEntry = names.find((n) => n.toLowerCase().endsWith("config.json"));
          if (cfgEntry) {
            try {
              const txt = await zip.files[cfgEntry].async("text");
              const parsed = JSON.parse(txt);
              setPreviewManifest(parsed);
              if (!parsed.name) warnings.push("Manifest missing `name`");
              if (!parsed.slug) warnings.push("Manifest missing `slug`");
            } catch {
              errors.push("Failed to parse config.json");
            }
          }

          if (!errors.length) {
            warnings.unshift("ℹ️ React SPA template detected (legacy)");
          }
        } else {
          errors.push(
            "Unable to detect template type. Templates must have either (page.tsx + manifest.json) for Next.js or (MemorialTemplate.tsx + config.json) for React SPA"
          );
        }

        setPreValidationErrors(errors);
        setPreValidationWarnings(warnings);
        setPreSteps((s) => ({ ...s, validate: errors.length ? "error" : "done" }));
      } catch {
        setPreSteps({ extract: "error", validate: "idle" });
        setPreValidationErrors(["Failed to extract ZIP"]);
      }
    })();
  }
  function handleUpload() {
    if (!selectedFile) {
      setApiError("Please choose a template ZIP file to upload.");
      return;
    }
    setApiError(null);
    if (!selectedPlanIds.length) {
      setPlanError("Please select at least one plan.");
    }
    if (!selectedCategoryIds.length) {
      setCategoryError("Please select at least one category.");
    }
    if (!selectedPlanIds.length || !selectedCategoryIds.length) return;

    setPlanError(null);
    setCategoryError(null);

    mutation.mutate(selectedFile as File, {
      onSuccess(data) {
        const tid =
          data && data.data && typeof data.data === "object"
            ? ((data.data as { template?: { id?: string } }).template?.id as string | undefined) ||
              (data.data.templateId as string | undefined)
            : undefined;
        setUploadedTemplateId(tid ?? null);
        try {
          if (tid) sessionStorage.setItem("lastUploadedTemplateId", tid);
        } catch {}
        setUploadStep("done");

        // Check if it's a Next.js template response
        const isNextJsTemplate =
          data && typeof data === "object" && "templateType" in data
            ? (data as { templateType?: string }).templateType === "nextjs"
            : false;

        // Get PR info for Next.js templates
        if (isNextJsTemplate && data?.data && typeof data.data === "object") {
          const dataObj = data.data as { pr?: { url?: string; number?: number } };
          if (dataObj.pr?.url && dataObj.pr.number) {
            setPrUrl(dataObj.pr.url);
            setPrNumber(dataObj.pr.number.toString());
            toast.success(
              `✅ Next.js template uploaded! Pull Request #${dataObj.pr.number} created for review.`,
              { duration: 10000 }
            );
            // Open PR in new tab
            window.open(dataObj.pr.url, "_blank");
          }
        }

        // capture generated manifest from server response if present (defensive)
        const gm =
          data && data.data && typeof data.data === "object"
            ? (data.data.generatedManifest as Record<string, unknown> | undefined)
            : undefined;
        const gn =
          data && data.data && typeof data.data === "object"
            ? (data.data.generatedNotes as string[] | undefined)
            : undefined;
        if (gm && typeof gm === "object") setGeneratedManifest(gm);
        else setGeneratedManifest(null);
        if (Array.isArray(gn)) setGeneratedNotes(gn);
        else setGeneratedNotes(null);

        // 🔥 Enhanced: Capture scaffold generation info
        const scaffoldData =
          data?.data && typeof data.data === "object"
            ? (
                data.data as {
                  scaffold?: { generated?: number; files?: string[]; warnings?: string[] };
                }
              ).scaffold
            : undefined;
        if (scaffoldData) {
          setScaffoldInfo({
            generated: scaffoldData.generated || 0,
            files: scaffoldData.files || [],
            warnings: scaffoldData.warnings || [],
          });
          if ((scaffoldData.generated ?? 0) > 0) {
            toast.success(
              `🚀 ${scaffoldData.generated} files auto-generated including MemorialTemplate bridge`,
              { duration: 6000 }
            );
          }
        } else {
          setScaffoldInfo(null);
        }

        // For Next.js templates, set process step to done immediately (PR created)
        // For React SPA templates, start processing step
        if (isNextJsTemplate) {
          setProcessStep("done");
        } else {
          setProcessStep("running");
        }
      },
      onError(err: unknown) {
        if (err && typeof err === "object") {
          const obj = err as Record<string, unknown>;
          const missingPlanIds = obj["missingPlanIds"] as string[] | undefined;
          const missingCategoryIds = obj["missingCategoryIds"] as string[] | undefined;
          if (missingPlanIds || missingCategoryIds) {
            const parts: string[] = [];
            if (missingPlanIds) parts.push(`Missing plans: ${missingPlanIds.join(", ")}`);
            if (missingCategoryIds)
              parts.push(`Missing categories: ${missingCategoryIds.join(", ")}`);
            setApiError(parts.join("; "));
            return;
          }
          const message = obj["message"] as string | undefined;
          if (message) setApiError(message);
          else setApiError(JSON.stringify(obj));
        } else if (err && typeof err === "string") {
          setApiError(err as string);
        } else {
          setApiError("Upload failed");
        }
        setUploadStep("error");
      },
    });
  }

  function cancelUpload() {
    if (xhrRef.current) {
      try {
        xhrRef.current.abort();
      } catch {}
    }
    setApiError("Upload cancelled");
    setUploadProgress(null);
    setUploadStep("idle");
    try {
      mutation.reset();
    } catch {}
  }

  const fetchStatusAndLogs = React.useCallback(async () => {
    if (!uploadedTemplateId) return;
    try {
      const res = await fetch(`/api/admin/templates/${uploadedTemplateId}/status`);
      if (!res.ok) return;
      const j = (await parseJsonOrNull(res)) as Record<string, unknown> | null;
      setLogs((j && (j.logs as string)) || null);
      setPackageUrl((j && (j.packageUrl as string)) || null);
      setLogsUrl((j && (j.logsUrl as string)) || null);
      // capture PR/publish links if backend returns them
      const maybePr = j ? (j.prUrl as string) || null : null;
      const maybePrNumber = j ? (j.prNumber as string) || null : null;
      const maybePublish = j
        ? (j.publishUrl as string) || (j.publishedUrl as string) || null
        : null;
      setPrUrl(maybePr || null);
      setPrNumber(maybePrNumber || null);
      setPublishUrl(maybePublish || null);
      // Map server processing status to UI steps
      const s = j?.status as string | undefined;
      if (s === "PROCESSING") {
        setProcessStep("running");
      } else if (s === "VALIDATED") {
        setProcessStep("done");
      } else if (s === "ERROR") {
        setProcessStep("error");
      } else if (s === "PUBLISHED") {
        setProcessStep("done");
      }
      // Inspect logs for obvious errors
      const logsText = ((j && (j.logs as string)) || "").toString().toLowerCase();
      if (logsText.includes("error") || logsText.includes("failed")) setProcessStep("error");
    } catch {
      setLogs("Failed to fetch logs");
    }
  }, [uploadedTemplateId]);

  // When there's a persisted uploadedTemplateId, poll for status/logs and links periodically
  useEffect(() => {
    if (!uploadedTemplateId) return;
    // fetch immediately and then poll
    fetchStatusAndLogs();

    // Also wire Server-Sent Events for real-time updates
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/admin/templates/${uploadedTemplateId}/events`);
      es.addEventListener("message", (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data?.type === "update" && data.payload) {
            const p = data.payload as Record<string, unknown>;
            setLogs((p.logs as string) || null);
            setPackageUrl((p.packageUrl as string) || null);
            setLogsUrl((p.logsUrl as string) || null);
            setPrUrl((p.prUrl as string) || null);
            // try to update prNumber if present
            const pn = (p.prNumber as string) || null;
            if (pn) setPrNumber(pn);
            // map status to process step
            const s = p.status as string | undefined;
            if (s === "PROCESSING") setProcessStep("running");
            else if (s === "VALIDATED" || s === "PUBLISHED") setProcessStep("done");
            else if (s === "ERROR") setProcessStep("error");
          } else if (data?.type === "error") {
            setSseError(data.message || "SSE error");
          }
        } catch {
          // ignore broken events
        }
      });
    } catch {
      // fallback to polling only
    }

    const iv = setInterval(() => {
      fetchStatusAndLogs();
    }, 3000);

    return () => {
      clearInterval(iv);
      try {
        es?.close();
      } catch {}
    };
  }, [uploadedTemplateId, fetchStatusAndLogs]);

  return (
    <Dialog.Root open={openState} onOpenChange={setOpenState}>
      {!hideTrigger && (
        <div className="flex items-center gap-2">
          <Dialog.Trigger className="btn">Upload Template</Dialog.Trigger>
          {uploadedTemplateId && (
            <a
              className="inline-flex items-center gap-2 rounded px-2 py-1 text-sm bg-slate-100"
              href={`/admin/templates/${uploadedTemplateId}`}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                {status === "PROCESSING" ? "Processing" : prNumber ? `PR #${prNumber}` : "Uploaded"}
              </span>
              {prUrl && <span className="text-xs text-blue-600">PR</span>}
            </a>
          )}
        </div>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          className="fixed left-1/2 top-1/2 w-[90vw] max-w-2xl max-h-[85vh] overflow-auto -translate-x-1/2 -translate-y-1/2 rounded bg-white p-6 shadow-lg dark:bg-gray-800"
        >
          <Dialog.Title className="text-lg font-semibold">Upload Template ZIP</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            Upload a Next.js template (page.tsx + manifest.json) or React SPA template (config.json
            + MemorialTemplate.tsx). A Pull Request will be created for code review before merging.
          </Dialog.Description>
          {detectedTemplateType && (
            <div className="mt-2 px-3 py-2 rounded bg-blue-50 dark:bg-blue-900/20 text-sm">
              {detectedTemplateType === "nextjs" ? (
                <span className="text-green-700 dark:text-green-400 font-medium">
                  ✅ Next.js Template - PR will be created with files for src/app/templates/
                </span>
              ) : (
                <span className="text-blue-700 dark:text-blue-400 font-medium">
                  ℹ️ React SPA Template (Legacy) - Will be built and processed
                </span>
              )}
            </div>
          )}

          <div className="mt-4">
            <label className="block mb-2">Plans</label>
            <input
              placeholder="Search plans..."
              value={planQuery}
              onChange={(e) => setPlanQuery(e.target.value)}
              className="w-full border p-2 mb-2"
            />
            <div className="max-h-44 overflow-auto rounded border bg-white">
              {plans
                .filter((p) => p.name.toLowerCase().includes(planQuery.toLowerCase()))
                .map((p: Plan) => {
                  const checked = selectedPlanIds.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPlanIds((s) => [...s, p.id]);
                          else setSelectedPlanIds((s) => s.filter((id) => id !== p.id));
                        }}
                      />
                      <span>{p.name}</span>
                    </label>
                  );
                })}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedPlanIds.map((id) => {
                const p = plans.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-2 rounded bg-slate-100 px-2 py-1 text-sm"
                  >
                    {p.name}
                    <button
                      aria-label={`Remove plan ${p.name}`}
                      onClick={() => setSelectedPlanIds((s) => s.filter((x) => x !== id))}
                      className="ml-1 text-xs"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
            {planError && <div className="text-red-600 mt-2">{planError}</div>}
          </div>

          <div className="mt-4">
            <label className="block mb-2">Categories</label>
            <input
              placeholder="Search categories..."
              value={categoryQuery}
              onChange={(e) => setCategoryQuery(e.target.value)}
              className="w-full border p-2 mb-2"
            />
            <div className="max-h-44 overflow-auto rounded border bg-white">
              {categories
                .filter((c) => c.name.toLowerCase().includes(categoryQuery.toLowerCase()))
                .map((c: Category) => {
                  const checked = selectedCategoryIds.includes(c.id);
                  const isPrimary = primaryCategoryId === c.id;
                  return (
                    <label key={c.id} className="flex items-center gap-2 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategoryIds((s) => {
                              const next = [...s, c.id];
                              if (!primaryCategoryId) setPrimaryCategoryId(c.id);
                              return next;
                            });
                          } else {
                            setSelectedCategoryIds((s) => s.filter((id) => id !== c.id));
                            if (primaryCategoryId === c.id) setPrimaryCategoryId(null);
                          }
                        }}
                      />
                      <span className="flex-1">{c.name}</span>
                      <label className="ml-2 flex items-center gap-1 text-xs">
                        <input
                          type="radio"
                          name="primaryCategory"
                          checked={isPrimary}
                          onChange={() => setPrimaryCategoryId(c.id)}
                          disabled={!checked}
                        />
                        <span className="text-muted-foreground">Primary</span>
                      </label>
                    </label>
                  );
                })}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedCategoryIds.map((id) => {
                const c = categories.find((x) => x.id === id);
                if (!c) return null;
                const isPrimary = primaryCategoryId === id;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-2 rounded bg-slate-100 px-2 py-1 text-sm"
                  >
                    <strong className={isPrimary ? "text-blue-600" : ""}>{c.name}</strong>
                    <button
                      aria-label={`Remove category ${c.name}`}
                      onClick={() => {
                        setSelectedCategoryIds((s) => s.filter((x) => x !== id));
                        if (primaryCategoryId === id) setPrimaryCategoryId(null);
                      }}
                      className="ml-1 text-xs"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
            {categoryError && <div className="text-red-600 mt-2">{categoryError}</div>}
          </div>

          <div className="mt-4">
            <label htmlFor="template-zip" className="block mb-2">
              Template ZIP
            </label>
            <input
              id="template-zip"
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              aria-describedby="template-zip-help"
              aria-label="Template ZIP file"
              disabled={isLoading}
              className="border p-1"
            />
            <div id="template-zip-help" className="text-xs text-muted-foreground mt-1">
              Upload a ZIP containing a `config.json` manifest and assets.
            </div>
            {/* Preview / validation feedback */}
            <div className="mt-3">
              <div className="text-sm font-medium">Preview</div>
              {preSteps.extract === "running" && <div className="text-xs">Extracting ZIP...</div>}
              {preSteps.validate === "running" && (
                <div className="text-xs">Running quick validation...</div>
              )}
              {preValidationErrors.length > 0 && (
                <ul className="text-red-600 text-xs mt-2 list-disc list-inside">
                  {preValidationErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
              {preValidationWarnings.length > 0 && (
                <ul className="text-yellow-700 text-xs mt-2 list-disc list-inside">
                  {preValidationWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
              {previewManifest && (
                <div className="mt-2 rounded border p-2 text-sm bg-slate-50">
                  <div>
                    <strong>
                      {getManifestString(previewManifest, "name") ||
                        getManifestString(previewManifest, "slug") ||
                        "Unnamed"}
                    </strong>
                  </div>
                  {getManifestString(previewManifest, "description") && (
                    <div>{getManifestString(previewManifest, "description")}</div>
                  )}
                  <div className="text-xs mt-1">
                    Version: {getManifestString(previewManifest, "version") || "1.0.0"}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="btn" onClick={() => setOpenState(false)}>
              Close
            </button>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  className="btn"
                  onClick={() => handleUpload()}
                  disabled={
                    !(
                      selectedFile &&
                      selectedPlanIds.length > 0 &&
                      selectedCategoryIds.length > 0
                    ) || isLoading
                  }
                  aria-disabled={isLoading}
                  aria-label="Upload template"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    "Upload"
                  )}
                </button>
                {isLoading && (
                  <button className="btn-ghost text-sm" onClick={() => cancelUpload()}>
                    Cancel
                  </button>
                )}
                {isError && <span className="text-red-600">Upload failed</span>}
              </div>
            </div>
          </div>

          {/* Multi-step progress */}
          <div className="mt-3">
            <div className="text-sm font-medium">Processing Steps</div>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              <div>1. Extract: {preSteps.extract}</div>
              <div>2. Validate: {preSteps.validate}</div>
              <div>3. Process: {processStep}</div>
              {(() => {
                const uploadDisplay =
                  uploadStep === "running" || isLoading
                    ? uploadProgress !== null
                      ? `${uploadProgress}%`
                      : "starting"
                    : uploadStep;
                return <div>4. Upload: {uploadDisplay}</div>;
              })()}
              <div>
                5. Complete: {status === "PUBLISHED" || processStep === "done" ? "done" : "pending"}
              </div>
            </div>
            {uploadProgress !== null && (
              <div className="w-full bg-slate-200 rounded h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>

          {apiError && <div className="mt-3 text-sm text-red-600">{apiError}</div>}

          {/* Live region for status updates to assistive tech */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {isLoading && "Uploading template..."}
            {isSuccess && "Upload complete, processing started."}
            {isError && (apiError || "Upload failed")}
            {status && status !== "PROCESSING" && `Processing status: ${status}`}
          </div>

          {uploadedTemplateId && (
            <div className="mt-4">
              <div>Template ID: {uploadedTemplateId}</div>
              <div>Status: {status || "Unknown"}</div>
              <div className="mt-2 flex gap-2">
                {status === "ERROR" && (
                  <>
                    <button className="btn-outline" onClick={() => fetchStatusAndLogs()}>
                      Show logs
                    </button>
                    {logsUrl && (
                      <a className="btn-outline" href={logsUrl} target="_blank" rel="noreferrer">
                        View full logs
                      </a>
                    )}
                  </>
                )}
                {packageUrl && (
                  <a className="btn" href={packageUrl} target="_blank" rel="noreferrer">
                    Download package
                  </a>
                )}
                {prUrl && (
                  <a
                    className="btn bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    href={prUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    🔗 View Pull Request {prNumber && `#${prNumber}`}
                  </a>
                )}
                {publishUrl && (
                  <a className="btn" href={publishUrl} target="_blank" rel="noreferrer">
                    View Published
                  </a>
                )}
              </div>
              {/* 🔥 Enhanced: Display scaffold generation info */}
              {scaffoldInfo && scaffoldInfo.generated > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                    <span>🚀</span>
                    <span>
                      {scaffoldInfo.generated} file{scaffoldInfo.generated !== 1 ? "s" : ""}{" "}
                      auto-generated
                    </span>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-green-600 dark:text-green-500 hover:underline">
                      View generated files
                    </summary>
                    <ul className="mt-2 text-xs space-y-1 max-h-40 overflow-auto font-mono">
                      {scaffoldInfo.files.map((file, i) => (
                        <li key={i} className="text-gray-700 dark:text-gray-300">
                          {file.includes("MemorialTemplate") ? (
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              ⭐ {file}
                            </span>
                          ) : file.includes("SupportModal") ? (
                            <span className="font-semibold text-gray-900 dark:text-gray-100 dark:text-purple-400">
                              💜 {file}
                            </span>
                          ) : (
                            <span>📄 {file}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                  {scaffoldInfo.warnings.length > 0 && (
                    <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
                      <strong>Warnings:</strong>
                      <ul className="list-disc list-inside">
                        {scaffoldInfo.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {/* Rebuild button */}
              {uploadedTemplateId && (
                <div className="mt-2">
                  <button
                    className="btn-ghost"
                    onClick={async () => {
                      try {
                        setRebuildLoading(true);
                        const res = await fetch(
                          `/api/admin/templates/${uploadedTemplateId}/rebuild`,
                          {
                            method: "POST",
                          }
                        );
                        if (!res.ok) throw new Error("Failed to trigger rebuild");
                        toast.success("Rebuild dispatched");
                      } catch (e) {
                        console.error(e);
                        toast.error("Failed to dispatch rebuild");
                      } finally {
                        setRebuildLoading(false);
                      }
                    }}
                  >
                    {rebuildLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                        Rebuilding...
                      </span>
                    ) : (
                      "Re-run CI"
                    )}
                  </button>
                </div>
              )}
              {logs && (
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap bg-slate-50 p-3 text-sm">
                  {logs}
                </pre>
              )}
              {sseError && (
                <div className="mt-2 text-sm text-red-600">
                  <strong>SSE error:</strong>
                  <div className="whitespace-pre-wrap">{sseError}</div>
                </div>
              )}
              {/* Prominent processing / open button */}
              <div className="mt-3">
                {uploadedTemplateId && (
                  <div className="flex items-center gap-2">
                    {status === "PROCESSING" || processStep === "running" ? (
                      <button className="btn btn-primary inline-flex items-center gap-2" disabled>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                        Processing...
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <a
                          className="btn"
                          href={`/admin/templates/${uploadedTemplateId}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Template
                        </a>
                        {prUrl && (
                          <a className="btn-outline" href={prUrl} target="_blank" rel="noreferrer">
                            Open PR
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Generated manifest preview and apply */}
              {generatedManifest && (
                <div className="mt-4 rounded border p-3 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <strong>Generated config.json (candidate)</strong>
                    <small className="text-xs text-muted-foreground">
                      {Array.isArray(generatedNotes) ? generatedNotes.join("; ") : ""}
                    </small>
                  </div>
                  <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-sm">
                    {JSON.stringify(generatedManifest, null, 2)}
                  </pre>
                  <div className="mt-2 flex gap-2">
                    <button
                      className="btn"
                      onClick={async () => {
                        if (!uploadedTemplateId) return;
                        setApplyError(null);
                        try {
                          const res = await fetch(`/api/admin/templates/${uploadedTemplateId}`, {
                            method: "PATCH",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ manifest: generatedManifest }),
                          });
                          const text = await res.text();
                          if (!res.ok) {
                            const msg = text || `${res.status} ${res.statusText}`;
                            setApplyError(msg);
                            toast.error(`Failed to apply generated manifest`);
                            return;
                          }
                          toast.success("Applied generated manifest");
                        } catch (e) {
                          console.error(e);
                          const text = e instanceof Error ? e.message : String(e);
                          setApplyError(text);
                          toast.error(`Failed to apply generated manifest: ${text}`);
                        }
                      }}
                    >
                      Apply generated config
                    </button>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        setGeneratedManifest(null);
                        setGeneratedNotes(null);
                      }}
                    >
                      Dismiss
                    </button>
                    {applyError && (
                      <div className="mt-2 text-sm text-red-600">
                        <strong>Apply failed:</strong>
                        <div className="whitespace-pre-wrap">{applyError}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
