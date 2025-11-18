"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AuditEntry = {
  when: number;
  action: string;
  jti: string;
  actor?: string;
  ttlSeconds?: number;
};

export default function AuditPage() {
  const [start, setStart] = useState(0);
  const [limit] = useState(50);
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [actorFilter, setActorFilter] = useState<string | null>(null);
  const [fromFilter, setFromFilter] = useState<string | null>(null);
  const [toFilter, setToFilter] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ data: AuditEntry[]; total: number }>({
    queryKey: ["adminAudit", start, limit, actionFilter],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("start", String(start));
      q.set("limit", String(limit));
      if (actionFilter) q.set("action", actionFilter);
      if (actorFilter) q.set("actor", actorFilter);
      if (fromFilter) q.set("from", fromFilter);
      if (toFilter) q.set("to", toFilter);
      const res = await fetch(`/api/admin/audit?${q.toString()}`);
      if (!res.ok) throw new Error("Failed to load audit");
      return res.json();
    },
    staleTime: 60_000,
  });

  const entries: AuditEntry[] = (data?.data as AuditEntry[]) || [];
  const total: number = Number(data?.total || 0);

  // server-side export used via Export button

  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Revocation Audit</h1>

      <div className="flex items-center gap-4 mb-4">
        <Select onValueChange={(v) => setActionFilter(v || null)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="revoke">revoke</SelectItem>
            <SelectItem value="unrevoke">unrevoke</SelectItem>
          </SelectContent>
        </Select>

        <input
          placeholder="actor (email)"
          value={actorFilter ?? ""}
          onChange={(e) => setActorFilter(e.target.value || null)}
          className="border border-border rounded-md p-1"
        />

        <input
          type="date"
          value={fromFilter ?? ""}
          onChange={(e) => setFromFilter(e.target.value || null)}
          className="border border-border rounded-md p-1"
        />

        <input
          type="date"
          value={toFilter ?? ""}
          onChange={(e) => setToFilter(e.target.value || null)}
          className="border border-border rounded-md p-1"
        />

        <Button
          onClick={async () => {
            const q = new URLSearchParams();
            if (actionFilter) q.set("action", actionFilter);
            if (actorFilter) q.set("actor", actorFilter);
            if (fromFilter) q.set("from", fromFilter);
            if (toFilter) q.set("to", toFilter);
            const res = await fetch(`/api/admin/audit/export?${q.toString()}`);
            if (!res.ok) {
              alert("Export failed");
              return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `revocation_audit_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
        >
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2">When</th>
                <th className="text-left p-2">Action</th>
                <th className="text-left p-2">JTI</th>
                <th className="text-left p-2">Actor</th>
                <th className="text-left p-2">TTL(s)</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={`${e.when}-${e.jti}`} className="border-t border-border">
                  <td className="p-2">{new Date(e.when).toLocaleString()}</td>
                  <td className="p-2">{e.action}</td>
                  <td className="p-2 font-mono break-all">{e.jti}</td>
                  <td className="p-2">{e.actor}</td>
                  <td className="p-2">{e.ttlSeconds ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4">
            <div>
              Page {Math.floor(start / limit) + 1} of {pageCount}
            </div>
            <div className="space-x-2">
              <Button
                onClick={() => setStart((s) => Math.max(0, s - limit))}
                disabled={start === 0}
              >
                Prev
              </Button>
              <Button onClick={() => setStart((s) => s + limit)} disabled={start + limit >= total}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
