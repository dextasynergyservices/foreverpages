"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Mail,
  UserPlus,
  Trash2,
  Edit,
  Shield,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toastNotification from "@/lib/toastNotifications";
import { useSendInvitations } from "@/hooks/useInvitations";
import { useTranslations } from "@/hooks/useTranslations";
import { useCollaboratorTranslations } from "@/lib/utils/collaborator-translations";

interface Collaborator {
  id: string;
  email: string;
  role: string;
  status: "accepted" | "pending" | "declined";
  invitedAt: string;
  acceptedAt?: string;
}

interface CollaboratorsTabProps {
  memorialId: string;
  textMuted: string;
  cardBorder: string;
  cardBg: string;
  isOwner: boolean;
}

const CollaboratorsTab: React.FC<CollaboratorsTabProps> = ({
  memorialId,
  textMuted,
  cardBorder,
  cardBg,
  isOwner,
}) => {
  const queryClient = useQueryClient();
  const sendInvitationsMutation = useSendInvitations();
  const { t } = useTranslations();
  const ct = useCollaboratorTranslations();

  // UI State
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    id: string;
    newRole: string;
  } | null>(null);

  // Form validation errors
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Invite form state
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteRole, setInviteRole] = useState("CONTRIBUTOR"); // Default to CONTRIBUTOR for collaborators
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState("");

  // Fetch collaborators using TanStack Query
  const {
    data: collaborators = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Collaborator[]>({
    queryKey: ["collaborators", memorialId],
    queryFn: async () => {
      const response = await fetch(`/api/memorials/${memorialId}/collaborators`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to load collaborators");
      }
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!memorialId && isOwner,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Email validation helper
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendInvites = async () => {
    // Reset errors
    setEmailError("");
    setPhoneError("");

    // Validate emails
    if (!inviteEmails.trim()) {
      setEmailError("Please enter at least one email address");
      toastNotification.error("Please enter at least one email address");
      return;
    }

    const emails = inviteEmails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    const invalidEmails = emails.filter((email) => !validateEmail(email));
    if (invalidEmails.length > 0) {
      setEmailError(`Invalid email(s): ${invalidEmails.join(", ")}`);
      toastNotification.error("Please check email format");
      return;
    }

    // Validate phone numbers if WhatsApp is enabled
    let phones: string[] = [];
    if (sendViaWhatsApp) {
      if (!phoneNumbers.trim()) {
        setPhoneError("Please enter phone numbers for WhatsApp delivery");
        toastNotification.error("Please enter phone numbers for WhatsApp delivery");
        return;
      }

      phones = phoneNumbers
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const invalidPhones = phones.filter((phone) => !phoneRegex.test(phone));
      if (invalidPhones.length > 0) {
        setPhoneError("Invalid phone number format. Include country code (e.g., +1234567890)");
        toastNotification.error("Please check phone number format");
        return;
      }
    }

    // Prepare recipients array
    const recipients = emails.map((email, index) => ({
      email,
      phone: sendViaWhatsApp && phones[index] ? phones[index] : undefined,
    }));

    try {
      await sendInvitationsMutation.mutateAsync({
        data: {
          memorialId,
          role: inviteRole,
          message: inviteMessage,
          recipients,
          sendViaEmail: true,
          sendViaWhatsApp,
        },
      });

      // Success - reset form
      setShowInviteForm(false);
      setInviteEmails("");
      setPhoneNumbers("");
      setInviteMessage("");
      setEmailError("");
      setPhoneError("");
      setSendViaWhatsApp(false);
      setInviteRole("CONTRIBUTOR");

      // Invalidate collaborators cache to refetch
      queryClient.invalidateQueries({ queryKey: ["collaborators", memorialId] });
    } catch (error) {
      // Error is already handled by the hook with toast
      console.error("Failed to send invitations:", error);
    }
  };

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const response = await fetch(`/api/memorials/${memorialId}/collaborators/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update role");
      }
      return response.json();
    },
    onSuccess: () => {
      toastNotification.success("Role updated successfully");
      setEditingRole(null);
      setShowRoleChangeDialog(false);
      setPendingRoleChange(null);
      queryClient.invalidateQueries({ queryKey: ["collaborators", memorialId] });
    },
    onError: (error: Error) => {
      toastNotification.error(error.message || "Failed to update role");
    },
  });

  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation({
    mutationFn: async (collaboratorId: string) => {
      const response = await fetch(`/api/memorials/${memorialId}/collaborators/${collaboratorId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to remove collaborator");
      }
      return response.json();
    },
    onSuccess: () => {
      toastNotification.success("Collaborator removed successfully");
      setShowDeleteDialog(false);
      setSelectedCollaborator(null);
      queryClient.invalidateQueries({ queryKey: ["collaborators", memorialId] });
    },
    onError: (error: Error) => {
      toastNotification.error(error.message || "Failed to remove collaborator");
    },
  });

  const handleRoleChangeClick = (collaboratorId: string, newRole: string) => {
    setPendingRoleChange({ id: collaboratorId, newRole });
    setShowRoleChangeDialog(true);
  };

  const confirmRoleChange = () => {
    if (!pendingRoleChange) return;
    updateRoleMutation.mutate({
      id: pendingRoleChange.id,
      role: pendingRoleChange.newRole,
    });
  };

  const handleRemoveCollaborator = () => {
    if (!selectedCollaborator) return;
    removeCollaboratorMutation.mutate(selectedCollaborator.id);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "EDITOR":
        return "default";
      case "CONTRIBUTOR":
        return "secondary";
      default:
        return "outline";
    }
  };
  const getStatusBadge = (status: string) => {
    const statusText = ct.getStatusText(status);
    switch (status) {
      case "accepted":
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">{statusText}</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
            {statusText}
          </Badge>
        );
      case "declined":
        return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">{statusText}</Badge>;
      default:
        return <Badge variant="outline">{statusText}</Badge>;
    }
  };

  if (!isOwner) {
    return (
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardContent className="py-8">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {t("collaborators.accessRestricted.title")}
            </h3>
            <p className={textMuted}>{t("collaborators.accessRestricted.description")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 flex-shrink-0" />
                <span>{t("collaborators.title")}</span>
              </CardTitle>
              <CardDescription className={`${textMuted} mt-1.5`}>
                {t("collaborators.subtitle")}
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowInviteForm(!showInviteForm)}
              variant="memorial"
              className="w-full sm:w-auto flex-shrink-0"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t("collaborators.invite")}</span>
              <span className="sm:hidden">{t("collaborators.invite")}</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Invite Form */}
      {showInviteForm && (
        <Card className={`border ${cardBorder} ${cardBg}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t("collaborators.sendInvitation")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="invite-emails">
                {t("collaborators.form.emails.label")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invite-emails"
                placeholder={t("collaborators.form.emails.placeholder")}
                value={inviteEmails}
                onChange={(e) => {
                  setInviteEmails(e.target.value);
                  if (emailError) setEmailError("");
                }}
                className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError ? (
                <p id="email-error" className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {emailError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("collaborators.form.emails.hint")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="invite-role">
                {t("collaborators.form.role.label")} <span className="text-red-500">*</span>
              </Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{ct.getRoleName("ADMIN")}</span>
                      <span className="text-xs text-gray-500">
                        {ct.getRoleDescription("ADMIN")}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="EDITOR">
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{ct.getRoleName("EDITOR")}</span>
                      <span className="text-xs text-gray-500">
                        {ct.getRoleDescription("EDITOR")}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CONTRIBUTOR">
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{ct.getRoleName("CONTRIBUTOR")}</span>
                      <span className="text-xs text-gray-500">
                        {ct.getRoleDescription("CONTRIBUTOR")}
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Note: To invite guests to view or attend memorial services, use the Invitations tab
                instead.
              </p>
            </div>

            <div>
              <Label htmlFor="invite-message">{t("collaborators.form.message.label")}</Label>
              <Textarea
                id="invite-message"
                placeholder={t("collaborators.form.message.placeholder")}
                rows={3}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="whatsapp-toggle">{t("collaborators.form.whatsapp.label")}</Label>
                <p className="text-xs text-muted-foreground">Requires phone numbers</p>
              </div>
              <Switch
                id="whatsapp-toggle"
                checked={sendViaWhatsApp}
                onCheckedChange={setSendViaWhatsApp}
              />
            </div>

            {sendViaWhatsApp && (
              <div>
                <Label htmlFor="phone-numbers">
                  {t("collaborators.form.whatsapp.phones.label")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone-numbers"
                  placeholder={t("collaborators.form.whatsapp.phones.placeholder")}
                  value={phoneNumbers}
                  onChange={(e) => {
                    setPhoneNumbers(e.target.value);
                    if (phoneError) setPhoneError("");
                  }}
                  className={phoneError ? "border-red-500 focus-visible:ring-red-500" : ""}
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? "phone-error" : undefined}
                />
                {phoneError ? (
                  <p id="phone-error" className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {phoneError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("collaborators.form.whatsapp.phones.hint")}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInviteForm(false);
                  setEmailError("");
                  setPhoneError("");
                }}
                className="w-full sm:w-auto"
              >
                {t("collaborators.form.cancel")}
              </Button>
              <Button
                onClick={handleSendInvites}
                disabled={sendInvitationsMutation.isPending}
                variant="memorial"
                className="w-full sm:w-auto"
              >
                {sendInvitationsMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t("collaborators.form.sending")}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    {t("collaborators.form.send")}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collaborators List */}
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardHeader>
          <CardTitle>Current Collaborators ({collaborators.length})</CardTitle>
          <CardDescription className={textMuted}>
            Manage roles and access for memorial collaborators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {/* Skeleton loader */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-70" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Collaborators</h3>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Collaborators Yet</h3>
              <p className="text-muted-foreground mb-4">
                Invite someone to help manage this memorial
              </p>
              <Button onClick={() => setShowInviteForm(true)} variant="memorial" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Send First Invitation
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("collaborators.table.email")}</TableHead>
                      <TableHead>{t("collaborators.table.role")}</TableHead>
                      <TableHead>{t("collaborators.table.status")}</TableHead>
                      <TableHead>{t("collaborators.table.invitedAt")}</TableHead>
                      <TableHead className="text-right">
                        {t("collaborators.table.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collaborators.map((collaborator) => (
                      <TableRow key={collaborator.id}>
                        <TableCell className="font-medium">{collaborator.email}</TableCell>
                        <TableCell>
                          {editingRole === collaborator.id ? (
                            <div className="flex items-center gap-2">
                              <Select
                                defaultValue={collaborator.role}
                                onValueChange={(newRole) => {
                                  handleRoleChangeClick(collaborator.id, newRole);
                                }}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                  <SelectItem value="EDITOR">Editor</SelectItem>
                                  <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                                  <SelectItem value="VIEWER">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingRole(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Badge variant={getRoleBadgeVariant(collaborator.role)}>
                              {collaborator.role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(collaborator.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(collaborator.invitedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {collaborator.status === "accepted" &&
                              editingRole !== collaborator.id && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingRole(collaborator.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedCollaborator(collaborator);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {collaborators.map((collaborator) => (
                  <Card key={collaborator.id} className="border">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{collaborator.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={getRoleBadgeVariant(collaborator.role)}>
                              {collaborator.role}
                            </Badge>
                            {getStatusBadge(collaborator.status)}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {collaborator.status === "accepted" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingRole(collaborator.id)}
                              aria-label="Edit role"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedCollaborator(collaborator);
                              setShowDeleteDialog(true);
                            }}
                            aria-label="Remove collaborator"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {editingRole === collaborator.id && (
                        <div className="pt-2 border-t">
                          <Label className="text-sm mb-2 block">
                            {t("collaborators.actions.changeRole")}
                          </Label>
                          <div className="flex gap-2">
                            <Select
                              defaultValue={collaborator.role}
                              onValueChange={(newRole) => {
                                handleRoleChangeClick(collaborator.id, newRole);
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">{ct.getRoleName("ADMIN")}</SelectItem>
                                <SelectItem value="EDITOR">{ct.getRoleName("EDITOR")}</SelectItem>
                                <SelectItem value="CONTRIBUTOR">
                                  {ct.getRoleName("CONTRIBUTOR")}
                                </SelectItem>
                                <SelectItem value="VIEWER">{ct.getRoleName("VIEWER")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRole(null)}
                            >
                              {t("collaborators.form.cancel")}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Invited {new Date(collaborator.invitedAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("collaborators.dialogs.remove.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("collaborators.dialogs.remove.description", {
                email: selectedCollaborator?.email || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0">
              {t("collaborators.dialogs.remove.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveCollaborator}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("collaborators.dialogs.remove.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={showRoleChangeDialog} onOpenChange={setShowRoleChangeDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("collaborators.dialogs.changeRole.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRoleChange &&
                t("collaborators.dialogs.changeRole.description", {
                  email: collaborators.find((c) => c.id === pendingRoleChange.id)?.email || "",
                  currentRole:
                    ct.getRoleName(
                      collaborators.find((c) => c.id === pendingRoleChange.id)?.role || ""
                    ) || "",
                  newRole: ct.getRoleName(pendingRoleChange.newRole),
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              className="mt-0"
              onClick={() => {
                setShowRoleChangeDialog(false);
                setPendingRoleChange(null);
                setEditingRole(null);
              }}
            >
              {t("collaborators.dialogs.changeRole.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending
                ? t("collaborators.form.sending")
                : t("collaborators.dialogs.changeRole.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CollaboratorsTab;
