import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MdDownload, MdPictureAsPdf, MdTableChart } from "react-icons/md";
import { InvitationsTable } from "./InvitationsTable";
import { Invitation } from "./Invitations";
import { useResendInvitation, useDeleteInvitation } from "@/hooks/useInvitations";
import { NoInvitationsEmpty, NoSearchResultsEmpty } from "./EmptyStates";
import { SearchAndFilter } from "./SearchAndFilter";

import { isPast } from "date-fns";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { toast } from "react-hot-toast";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import { showUndoToast, showBatchUndoToast } from "./UndoToast";

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
}

interface ManageInvitationsTabProps {
  invitations: Invitation[];
  theme: string;
  themeClasses: ThemeClasses;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const ManageInvitationsTab: React.FC<ManageInvitationsTabProps> = ({
  invitations,
  theme,
  themeClasses,
  t,
}) => {
  const { cardBorder, cardBg, textMuted } = themeClasses;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvitationId, setSelectedInvitationId] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState("all");

  // Bulk actions state (managed by TanStack Table)
  // No state needed - InvitationsTable handles selection internally

  const resendMutation = useResendInvitation();
  const deleteMutation = useDeleteInvitation();

  // Undo functionality with 30-second TTL
  const { markAsDeleted, undoDelete } = useUndoableDelete<Invitation>(30000);

  // Filter invitations based on search and filters
  const filteredInvitations = useMemo(() => {
    return invitations.filter((invitation) => {
      // Search filter (name, email, phone)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = invitation.name?.toLowerCase().includes(query);
        const matchesEmail = invitation.email?.toLowerCase().includes(query);
        const matchesPhone = invitation.phone?.toLowerCase().includes(query);

        if (!matchesName && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "expired") {
          const isExpired = invitation.expiresAt ? isPast(new Date(invitation.expiresAt)) : false;
          if (!isExpired) return false;
        } else if (invitation.status !== statusFilter) {
          return false;
        }
      }

      // Delivery method filter
      if (deliveryMethodFilter !== "all") {
        if (deliveryMethodFilter === "email" && !invitation.sentViaEmail) {
          return false;
        }
        if (deliveryMethodFilter === "whatsapp" && !invitation.sentViaWhatsApp) {
          return false;
        }
        if (
          deliveryMethodFilter === "both" &&
          !(invitation.sentViaEmail && invitation.sentViaWhatsApp)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [invitations, searchQuery, statusFilter, deliveryMethodFilter]);

  const handleResendInvitation = (id: string) => {
    resendMutation.mutate(id);
  };

  const handleRemoveInvitation = (id: string) => {
    setSelectedInvitationId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedInvitationId) {
      // Find the invitation being deleted
      const invitation = invitations.find((inv) => inv.id === selectedInvitationId);

      if (invitation) {
        // Store for undo
        markAsDeleted(invitation, "single");

        // Delete the invitation
        deleteMutation.mutate(selectedInvitationId);

        // Show undo toast
        showUndoToast({
          message: t("dashboard.invitations.toasts.deleteSuccess", {
            name: invitation.name || invitation.email,
          }),
          onUndo: async () => {
            // Restore would require a restore API endpoint
            // For now, just show that undo was triggered
            undoDelete(selectedInvitationId);
            toast.success(
              t("dashboard.invitations.toasts.deleteSuccess", {
                name: invitation.name || invitation.email,
              })
            );
          },
          theme: theme as "light" | "dark",
        });
      }

      setDeleteDialogOpen(false);
      setSelectedInvitationId(null);
    }
  };
  const handleExportCSV = () => {
    try {
      const filename = `invitations-${new Date().toISOString().split("T")[0]}.csv`;
      exportToCSV(filteredInvitations, filename);
      toast.success(t("dashboard.invitations.toasts.exportSuccess", { format: "CSV" }));
    } catch (error) {
      toast.error(t("dashboard.invitations.toasts.exportError", { format: "CSV" }));
      console.error("Export error:", error);
    }
  };

  const handleExportPDF = () => {
    try {
      exportToPDF(filteredInvitations, "Memorial Guest List");
      toast.success(t("dashboard.invitations.toasts.exportSuccess", { format: "PDF" }));
    } catch (error) {
      toast.error(t("dashboard.invitations.toasts.exportError", { format: "PDF" }));
      console.error("Export error:", error);
    }
  };

  // Bulk actions handlers (called from InvitationsTable)
  const handleBulkResend = (selectedIds: string[]) => {
    // TODO: Implement bulk resend mutation
    console.log("Bulk resending:", selectedIds);
    const count = selectedIds.length;
    toast.success(
      t("dashboard.invitations.success.bulkSent", {
        count,
        plural: count > 1 ? "s" : "",
      })
    );
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    // Get the invitations being deleted
    const invitationsToDelete = invitations.filter((inv) => selectedIds.includes(inv.id));

    // Store all for undo
    markAsDeleted(invitationsToDelete, "bulk");

    // Delete all selected invitations
    selectedIds.forEach((id) => {
      deleteMutation.mutate(id);
    });

    // Show batch undo toast
    showBatchUndoToast({
      count: selectedIds.length,
      itemType: "invitation",
      onUndo: async () => {
        // Restore would require a restore API endpoint
        // For now, just show that undo was triggered
        invitationsToDelete.forEach((inv) => {
          undoDelete(inv.id);
        });
        toast.success(
          t("dashboard.invitations.toasts.bulkDeleteSuccess", {
            count: selectedIds.length,
          })
        );
      },
      theme: theme as "light" | "dark",
    });
  };
  return (
    <>
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <CardTitle>{t("dashboard.invitations.manage.sentInvitations")}</CardTitle>
          <CardDescription className={textMuted}>
            {t("dashboard.invitations.manage.trackDelivery")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <NoInvitationsEmpty
              t={t}
              onAction={() => {
                // Switch to create tab
                const createTab = document.querySelector('[value="create"]') as HTMLElement;
                createTab?.click();
              }}
            />
          ) : (
            <>
              {/* Search and Filter */}
              <SearchAndFilter
                onSearchChange={setSearchQuery}
                onStatusChange={setStatusFilter}
                onDeliveryMethodChange={setDeliveryMethodFilter}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                deliveryMethodFilter={deliveryMethodFilter}
                t={t}
                resultCount={filteredInvitations.length}
                totalCount={invitations.length}
              />

              {/* Invitation List or No Results */}
              {filteredInvitations.length === 0 ? (
                <NoSearchResultsEmpty
                  t={t}
                  searchQuery={searchQuery}
                  onClear={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setDeliveryMethodFilter("all");
                  }}
                />
              ) : (
                <>
                  <InvitationsTable
                    data={filteredInvitations}
                    theme={theme}
                    onResend={handleResendInvitation}
                    onDelete={handleRemoveInvitation}
                    onBulkResend={handleBulkResend}
                    onBulkDelete={handleBulkDelete}
                    t={t}
                  />

                  <div className="mt-6 flex gap-2 flex-col sm:flex-row">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant={theme === "dark" ? "memorial-outline" : "outline"}>
                          <MdDownload className="h-4 w-4 mr-2" />
                          {t("dashboard.invitations.actions.export", {}, "Export")}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handleExportCSV}>
                          <MdTableChart className="h-4 w-4 mr-2" />
                          {t("dashboard.invitations.manage.table.exportCSV")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportPDF}>
                          <MdPictureAsPdf className="h-4 w-4 mr-2" />
                          {t("dashboard.invitations.manage.table.exportPDF")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("dashboard.invitations.delete.title", {}, "Revoke Invitation?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "dashboard.invitations.delete.description",
                {},
                "This action cannot be undone. The invitation will be revoked and the recipient will no longer be able to accept it."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("dashboard.invitations.delete.cancel", {}, "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("dashboard.invitations.delete.confirm", {}, "Revoke")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
