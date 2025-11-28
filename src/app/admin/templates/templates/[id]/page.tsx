"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type TemplateDetail = {
  id: string;
  name?: string | null;
  slug?: string | null;
  createdAt?: string;
  [k: string]: unknown;
} | null;

type TemplateStatusResponse = {
  status?: string | null;
  logs?: string | null;
  processingLogs?: string | null;
  packageUrl?: string | null;
  logsUrl?: string | null;
  prUrl?: string | null;
  prNumber?: string | null;
  [k: string]: unknown;
} | null;

export default function TemplateDetailPage() {
  const { id } = useParams();
  const [template, setTemplate] = useState<TemplateDetail>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [logs, setLogs] = useState<string | null>(null);
  const [packageUrl, setPackageUrl] = useState<string | null>(null);
  const [logsUrl, setLogsUrl] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [prNumber, setPrNumber] = useState<string | null>(null);

  const fetchDetail = React.useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/templates/templates/${id}`);
      if (!res.ok) return;
      const j = (await res.json()) as TemplateDetail;
      setTemplate(j);
    } catch {
      // ignore
    }
  }, [id]);

  const fetchStatus = React.useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/templates/${id}/status`);
      if (!res.ok) return;
      const j = (await res.json()) as TemplateStatusResponse;
      setStatus((j && j.status) || null);
      setLogs(
        (j && (j.logs || j.processingLogs) ? String(j.logs || j.processingLogs) : null) || null
      );
      setPackageUrl((j && j.packageUrl) || null);
      setLogsUrl((j && j.logsUrl) || null);
      setPrUrl((j && j.prUrl) || null);
      setPrNumber((j && j.prNumber) || null);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
    fetchStatus();
    const iv = setInterval(() => fetchStatus(), 3000);
    return () => clearInterval(iv);
  }, [fetchDetail, fetchStatus]);

  if (!id) return <div className="p-6">Missing template id</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Template {template?.name || id}</h1>
        <div className="flex items-center gap-2">
          {status && <Badge>{status}</Badge>}
          {prNumber && (
            <a
              className="text-sm text-blue-600"
              href={prUrl || "#"}
              target="_blank"
              rel="noreferrer"
            >
              PR #{prNumber}
            </a>
          )}
          {prUrl && !prNumber && (
            <a className="text-sm text-blue-600" href={prUrl} target="_blank" rel="noreferrer">
              View PR
            </a>
          )}
          {packageUrl && (
            <a className="btn" href={packageUrl} target="_blank" rel="noreferrer">
              Download package
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="mb-4">
            <h2 className="font-medium">Processing Timeline</h2>
            <div className="mt-2 flex gap-2">
              <div className="px-3 py-1 rounded bg-slate-100">Extract</div>
              <div className="px-3 py-1 rounded bg-slate-100">Validate</div>
              <div className="px-3 py-1 rounded bg-slate-100">Process</div>
              <div className="px-3 py-1 rounded bg-slate-100">Publish</div>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Current status: {status || "unknown"}
            </div>
          </div>

          <div>
            <h2 className="font-medium">Processing Logs</h2>
            <div className="mt-2 bg-slate-50 p-3 rounded max-h-96 overflow-auto whitespace-pre-wrap text-sm">
              {logs || "No logs yet"}
            </div>
            {logsUrl && (
              <div className="mt-2">
                <a
                  className="text-sm text-blue-600"
                  href={logsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View full logs
                </a>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-medium">Actions</h2>
          <div className="mt-2 flex flex-col gap-2">
            <Button onClick={() => fetchStatus()}>Refresh Status</Button>
            {prUrl && (
              <a className="btn" href={prUrl} target="_blank" rel="noreferrer">
                Open PR
              </a>
            )}
            <Button
              variant="secondary"
              onClick={async () => {
                if (!id) return;
                try {
                  const res = await fetch(`/api/admin/templates/${id}/create-pr`, {
                    method: "POST",
                  });
                  const j = await res.json();
                  if (res.ok && j.prUrl) {
                    setPrUrl(j.prUrl as string);
                    // attempt to parse pr number from url if present
                    const match = (j.prUrl as string).match(/\/pull\/(\d+)/);
                    if (match) setPrNumber(match[1]);
                    fetchStatus();
                  } else {
                    console.error("Create PR failed", j);
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              Create PR
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  await fetch(`/api/admin/templates/${id}/reprocess`, { method: "POST" });
                  fetchStatus();
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              Reprocess
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/admin/templates/${id}/rebuild`, { method: "POST" });
                  if (!res.ok) throw new Error("Failed to trigger rebuild");
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              Re-run CI
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
