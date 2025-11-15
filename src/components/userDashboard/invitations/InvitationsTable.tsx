"use client";

import React, { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MdMoreVert,
  MdSend,
  MdDelete,
  MdEmail,
  MdPhone,
  MdArrowUpward,
  MdArrowDownward,
  MdCheckCircle,
  MdCancel,
  MdHelp,
  MdPending,
} from "react-icons/md";
import { Invitation } from "./Invitations";
import { format } from "date-fns";

interface InvitationsTableProps {
  data: Invitation[];
  theme: string;
  onResend: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkResend: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const InvitationsTable: React.FC<InvitationsTableProps> = ({
  data,
  theme,
  onResend,
  onDelete,
  onBulkResend,
  onBulkDelete,
  t,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns: ColumnDef<Invitation>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: t("dashboard.invitations.manage.table.guestName"),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue("name") || t("dashboard.invitations.manage.table.anonymous")}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: t("dashboard.invitations.manage.table.email"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.sentViaEmail && <MdEmail className="h-4 w-4 text-blue-500" />}
          <span className="text-sm">{row.getValue("email") || "—"}</span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("dashboard.invitations.manage.table.phone"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.sentViaWhatsApp && <MdPhone className="h-4 w-4 text-green-500" />}
          <span className="text-sm">{row.getValue("phone") || "—"}</span>
        </div>
      ),
    },
    {
      accessorKey: "delivery",
      header: t("dashboard.invitations.manage.table.delivery"),
      cell: ({ row }) => {
        const invitation = row.original;
        const sentViaEmail = invitation.sentViaEmail;
        const sentViaWhatsApp = invitation.sentViaWhatsApp;

        const methods: string[] = [];
        if (sentViaEmail) methods.push("Email");
        if (sentViaWhatsApp) methods.push("WhatsApp");

        if (methods.length === 0) {
          return (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              {t("dashboard.invitations.manage.table.pending")}
            </Badge>
          );
        }

        return (
          <div className="flex flex-col gap-1">
            {methods.map((method) => (
              <Badge key={method} variant="default" className="bg-green-100 text-green-700">
                ✓ {method}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "rsvp",
      header: t("dashboard.invitations.manage.table.rsvp"),
      cell: ({ row }) => {
        const invitation = row.original;
        const rsvp = invitation.rsvp;
        const rsvpMessage = invitation.rsvpMessage;

        if (!rsvp) {
          return (
            <div className="flex items-center gap-2 text-gray-500">
              <MdPending className="h-4 w-4" />
              <span className="text-sm">{t("dashboard.invitations.manage.table.pending")}</span>
            </div>
          );
        }

        const rsvpConfig = {
          yes: {
            icon: MdCheckCircle,
            color: "text-green-600",
            label: t("dashboard.invitations.manage.table.attending"),
          },
          no: {
            icon: MdCancel,
            color: "text-red-600",
            label: t("dashboard.invitations.manage.table.declined"),
          },
          maybe: {
            icon: MdHelp,
            color: "text-yellow-600",
            label: t("dashboard.invitations.manage.table.maybe"),
          },
        };

        const config = rsvpConfig[rsvp];
        const Icon = config.icon;

        return (
          <div className="flex flex-col gap-1">
            <div className={`flex items-center gap-2 ${config.color}`}>
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{config.label}</span>
            </div>
            {rsvpMessage && (
              <div className="text-xs text-gray-600 italic line-clamp-2 max-w-[200px]">
                💬 &quot;{rsvpMessage}&quot;
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: t("dashboard.invitations.manage.table.sentDate"),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return date ? (
          <span className="text-sm">{format(new Date(date), "MMM d, yyyy")}</span>
        ) : (
          <span className="text-sm text-gray-500">—</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const invitation = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MdMoreVert className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onResend(invitation.id)}>
                <MdSend className="mr-2 h-4 w-4" />
                {t("dashboard.invitations.actions.resend")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(invitation.id)} className="text-red-600">
                <MdDelete className="mr-2 h-4 w-4" />
                {t("dashboard.invitations.actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  return (
    <div className="space-y-4">
      {/* Bulk Actions Toolbar */}
      {hasSelection && (
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-4 rounded-lg border ${
            theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <MdCheckCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium">
              {selectedRows.length}{" "}
              {selectedRows.length === 1
                ? t("dashboard.invitations.manage.table.rowSelected")
                : t("dashboard.invitations.manage.table.rowsSelected")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const ids = selectedRows.map((row) => row.original.id);
                onBulkResend(ids);
              }}
            >
              <MdSend className="mr-2 h-4 w-4" />
              {t("dashboard.invitations.manage.table.resendAll")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const ids = selectedRows.map((row) => row.original.id);
                onBulkDelete(ids);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <MdDelete className="mr-2 h-4 w-4" />
              {t("dashboard.invitations.manage.table.deleteAll")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => table.resetRowSelection()}>
              {t("dashboard.invitations.manage.table.clear")}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "flex items-center gap-2 cursor-pointer select-none"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <MdArrowUpward className="h-4 w-4" />,
                          desc: <MdArrowDownward className="h-4 w-4" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("dashboard.invitations.manage.table.noInvitations")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {t("dashboard.invitations.manage.table.rowsPerPage")}
          </span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {t("dashboard.invitations.manage.table.page")}{" "}
            {table.getState().pagination.pageIndex + 1} {t("dashboard.invitations.manage.table.of")}{" "}
            {table.getPageCount()}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {t("dashboard.invitations.manage.table.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {t("dashboard.invitations.manage.table.next")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
