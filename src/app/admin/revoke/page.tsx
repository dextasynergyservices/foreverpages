"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Trash, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type RevokedEntry = { jti: string; ttl: number };
type AuditEntry = {
  when: number;
  action: string;
  jti: string;
  actor?: string;
  ttlSeconds?: number;
};

type Target = { type: "revoke" | "unrevoke"; jti: string; ttl?: number } | null;

export default function RevokePage() {
  const queryClient = useQueryClient();
  const [jti, setJti] = useState("");
  const [ttlSeconds, setTtlSeconds] = useState<number>(60 * 60 * 24);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [target, setTarget] = useState<Target>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: pageData, isLoading: listLoading } = useQuery<{
    items: RevokedEntry[];
    total: number;
  }>({
    queryKey: ["revokedJtis", page, pageSize],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/revoked?start=${(page - 1) * pageSize}&limit=${pageSize}`
      );
      if (!res.ok) throw new Error("Failed to load revoked jtis");
      const data = await res.json();
      return { items: (data.data as RevokedEntry[]) || [], total: Number(data.total || 0) };
    },
    staleTime: 60_000,
  });

  const list = pageData?.items || [];
  const total = pageData?.total || 0;

  const { data: audit = [] } = useQuery<AuditEntry[]>({
    queryKey: ["revocationAudit"],
    queryFn: async () => {
      const res = await fetch("/api/admin/audit");
      if (!res.ok) return [];
      const d = await res.json();
      return (d.data as AuditEntry[]) || [];
    },
    staleTime: 60_000,
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ jti, ttl }: { jti: string; ttl: number }) => {
      const res = await fetch("/api/admin/revoke-jti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jti, ttlSeconds: ttl }),
      });
      if (!res.ok) throw new Error("Failed to revoke");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revokedJtis", page, pageSize] });
      queryClient.invalidateQueries({ queryKey: ["revocationAudit"] });
      toast.success("Revoked");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to revoke");
    },
  });

  const unrevokeMutation = useMutation({
    mutationFn: async ({ jti }: { jti: string }) => {
      const res = await fetch("/api/admin/unrevoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jti }),
      });
      if (!res.ok) throw new Error("Failed to unrevoke");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revokedJtis", page, pageSize] });
      queryClient.invalidateQueries({ queryKey: ["revocationAudit"] });
      toast.success("Unrevoked");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to unrevoke");
    },
  });

  const isBusy =
    (revokeMutation as unknown as { status?: string }).status === "loading" ||
    (unrevokeMutation as unknown as { status?: string }).status === "loading";

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);
  const pageItems = list; // already paged by server

  function openRevokeConfirm(j: string, ttl?: number) {
    setTarget({ type: "revoke", jti: j, ttl });
    setConfirmOpen(true);
  }

  function openUnrevokeConfirm(j: string) {
    setTarget({ type: "unrevoke", jti: j });
    setConfirmOpen(true);
  }

  async function performConfirm() {
    if (!target) return;
    try {
      if (target.type === "revoke") {
        await revokeMutation.mutateAsync({ jti: target.jti, ttl: target.ttl ?? ttlSeconds });
        setJti("");
      } else {
        await unrevokeMutation.mutateAsync({ jti: target.jti });
      }
    } catch (err) {
      // mutations show errors via thrown exceptions; show UI toast
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setTarget(null);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Revoke access token (jti)</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          openRevokeConfirm(jti, ttlSeconds);
        }}
        className="space-y-3 mb-6"
      >
        <div>
          <label className="block text-sm font-medium text-muted-foreground">JTI</label>
          <input
            value={jti}
            onChange={(e) => setJti(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground">
            Expires (seconds)
          </label>
          <input
            type="number"
            value={ttlSeconds}
            onChange={(e) => setTtlSeconds(Number(e.target.value))}
            className="mt-1 block w-48 rounded-md border border-border p-2"
          />
        </div>

        <div>
          <Button type="submit">Revoke</Button>
        </div>
      </form>

      <h2 className="text-lg font-semibold mb-3">Revoked JTIs</h2>
      {listLoading ? (
        <div>Loading...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-muted-foreground">No revoked JTIs found.</div>
      ) : (
        <>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2">JTI</th>
                <th className="text-left p-2">TTL (s)</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((entry) => (
                <tr key={entry.jti} className="border-t border-border">
                  <td className="p-2 font-mono text-sm break-all">{entry.jti}</td>
                  <td className="p-2">{entry.ttl}</td>
                  <td className="p-2">
                    <Button
                      variant="secondary"
                      className="mr-2"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(entry.jti);
                          toast.success("Copied JTI to clipboard");
                        } catch (err) {
                          toast.error("Failed to copy");
                          console.error(err);
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="destructive" onClick={() => openUnrevokeConfirm(entry.jti)}>
                      <Trash className="h-4 w-4 mr-2" />
                      Unrevoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4">
            <div>
              Page {page} of {pageCount}
            </div>
            <div className="space-x-2">
              <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Prev
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <h2 className="text-lg font-semibold mt-8 mb-3">Recent Audit</h2>
      <div className="space-y-2">
        {(audit || []).slice(0, 10).map((a) => (
          <div key={`${a.when}-${a.jti}`} className="text-sm text-muted-foreground">
            {new Date(a.when).toLocaleString()} — {a.action} — {a.jti} — {a.actor || "system"}
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {target?.type} JTI:
              <span className="font-mono"> {target?.jti}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={performConfirm} disabled={isBusy}>
              {isBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
