"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Video,
  Download,
  Trash2,
  Clock,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

interface Recording {
  id: string;
  title: string;
  memorialId: string;
  memorialName: string;
  memorialSlug: string;
  ownerName: string;
  ownerEmail: string;
  recordingUrl: string;
  recordingSize: number | null;
  recordingDuration: number | null;
  recordedAt: string | null;
  expiresAt: string | null;
  warningAt: string | null;
  status: "active" | "expiring" | "expired";
}

interface Statistics {
  totalRecordings: number;
  expiringWithin30Days: number;
  expired: number;
  totalStorageBytes: number;
  warningsSent: number;
  oldestRecordingDate: string | null;
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "expiring" | "expired">("all");
  const [sortBy, setSortBy] = useState<"expiryDate" | "createdAt" | "memorialName">("expiryDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/recordings?filter=${filter}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recordings");
      }

      const data = await response.json();
      setRecordings(data.recordings);
      setStatistics(data.statistics);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      alert("Failed to load recordings");
    } finally {
      setLoading(false);
    }
  }, [filter, sortBy, sortOrder]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(recordings.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = async (action: "extend" | "delete") => {
    if (selectedIds.size === 0) {
      alert("Please select at least one recording");
      return;
    }

    const confirmMessage =
      action === "extend"
        ? `Extend ${selectedIds.size} recording(s) by 6 months?`
        : `Delete ${selectedIds.size} recording(s)? This cannot be undone!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch("/api/admin/recordings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          recordingIds: Array.from(selectedIds),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to perform action");
      }

      const data = await response.json();
      alert(data.message);
      setSelectedIds(new Set());
      fetchRecordings();
    } catch (error) {
      console.error("Error performing bulk action:", error);
      alert("Failed to perform action");
    } finally {
      setActionLoading(false);
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb < 1) {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(2)} MB`;
    }
    return `${gb.toFixed(2)} GB`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "Unknown";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "expiring":
        return (
          <Badge variant="default" className="bg-yellow-500">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Expiring
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recording Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage livestream recordings, extend retention, and monitor storage usage
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Recordings
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {statistics.totalRecordings}
                </p>
              </div>
              <Video className="h-12 w-12 text-gray-900 dark:text-gray-100" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Expiring Soon
                </p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">
                  {statistics.expiringWithin30Days}
                </p>
              </div>
              <Clock className="h-12 w-12 text-yellow-600" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Already Expired
                </p>
                <p className="mt-2 text-3xl font-bold text-red-600">{statistics.expired}</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Storage
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {formatBytes(statistics.totalStorageBytes)}
                </p>
              </div>
              <HardDrive className="h-12 w-12 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as "all" | "expiring" | "expired")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Recordings</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as "expiryDate" | "createdAt" | "memorialName")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expiryDate">Expiry Date</SelectItem>
              <SelectItem value="createdAt">Recording Date</SelectItem>
              <SelectItem value="memorialName">Memorial Name</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </Button>

          <Button variant="outline" size="sm" onClick={fetchRecordings} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleBulkAction("extend")}
              disabled={actionLoading}
            >
              <Clock className="mr-2 h-4 w-4" />
              Extend ({selectedIds.size})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction("delete")}
              disabled={actionLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {/* Recordings Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={recordings.length > 0 && selectedIds.size === recordings.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Memorial</TableHead>
              <TableHead>Stream Title</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Recorded</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
                  <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                  <p className="mt-2 text-gray-500">Loading recordings...</p>
                </TableCell>
              </TableRow>
            ) : recordings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
                  <Video className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No recordings found</p>
                </TableCell>
              </TableRow>
            ) : (
              recordings.map((recording) => (
                <TableRow key={recording.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(recording.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(recording.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/${recording.memorialSlug}`}
                      target="_blank"
                      className="font-medium text-gray-900 dark:text-gray-100 hover:underline dark:text-gray-300"
                    >
                      {recording.memorialName}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{recording.title}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{recording.ownerName}</p>
                      <p className="text-gray-500">{recording.ownerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(recording.recordingDuration)}</TableCell>
                  <TableCell>{formatBytes(recording.recordingSize)}</TableCell>
                  <TableCell>
                    {recording.recordedAt
                      ? format(new Date(recording.recordedAt), "MMM d, yyyy")
                      : "Unknown"}
                  </TableCell>
                  <TableCell>
                    {recording.expiresAt ? (
                      <div>
                        <p>{format(new Date(recording.expiresAt), "MMM d, yyyy")}</p>
                        {recording.warningAt && (
                          <p className="text-xs text-gray-500">
                            Warned: {format(new Date(recording.warningAt), "MMM d")}
                          </p>
                        )}
                      </div>
                    ) : (
                      "Never"
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(recording.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={recording.recordingUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
