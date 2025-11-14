import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

interface InvitationRecipient {
  name?: string;
  email?: string;
  phone?: string;
}

interface SendInvitationRequest {
  memorialId: string;
  role: string;
  customSubject?: string;
  message?: string;
  invitationCard?: string;
  recipients: InvitationRecipient[];
  sendViaEmail: boolean;
  sendViaWhatsApp: boolean;
}

interface UploadCardResponse {
  message: string;
  data: {
    url: string;
    publicId: string;
    thumbnailUrl: string;
  };
}

export function useSendInvitations() {
  const queryClient = useQueryClient();

  const uploadCard = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/invitations/upload-card", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload invitation card");
    }

    const data: UploadCardResponse = await response.json();
    return data.data.url;
  };

  const sendInvitations = async (data: SendInvitationRequest) => {
    // If recipients array exists, send individually
    if (data.recipients && Array.isArray(data.recipients)) {
      const results = [];
      const errors = [];

      for (const recipient of data.recipients) {
        try {
          const response = await fetch("/api/invitations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              memorialId: data.memorialId,
              role: data.role,
              email: recipient.email,
              phone: recipient.phone,
              name: recipient.name,
              message: data.message,
              customSubject: data.customSubject,
              invitationCard: data.invitationCard,
              sendViaEmail: data.sendViaEmail,
              sendViaWhatsApp: data.sendViaWhatsApp,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            errors.push(
              `${recipient.name || recipient.email || recipient.phone}: ${error.message}`
            );
          } else {
            const result = await response.json();
            results.push(result);
          }
        } catch (error) {
          errors.push(
            `${recipient.name || recipient.email || recipient.phone}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      if (errors.length > 0 && results.length === 0) {
        throw new Error(`Failed to send all invitations: ${errors.join(", ")}`);
      }

      return {
        message: `Successfully sent ${results.length} of ${data.recipients.length} invitations`,
        data: results,
        deliveryErrors: errors.length > 0 ? errors : undefined,
      };
    }

    // Single invitation (legacy)
    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send invitations");
    }

    return response.json();
  };

  return useMutation({
    mutationFn: async ({ data, cardFile }: { data: SendInvitationRequest; cardFile?: File }) => {
      let invitationCardUrl: string | undefined;

      // Upload card first if provided
      if (cardFile) {
        const uploadToast = toast.loading("Uploading invitation card...");
        try {
          invitationCardUrl = await uploadCard(cardFile);
          toast.success("Invitation card uploaded successfully", {
            id: uploadToast,
          });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to upload card", {
            id: uploadToast,
          });
          throw error;
        }
      }

      // Send invitations
      const sendToast = toast.loading("Sending invitations...");
      try {
        const result = await sendInvitations({
          ...data,
          invitationCard: invitationCardUrl,
        });

        // Check for partial delivery
        if (result.deliveryErrors && result.deliveryErrors.length > 0) {
          toast.success(result.message || "Invitations sent successfully", {
            id: sendToast,
          });

          // Show warning for partial delivery
          setTimeout(() => {
            toast(`⚠️ Some invitations had delivery issues:\n${result.deliveryErrors.join(", ")}`, {
              duration: 6000,
              icon: "⚠️",
            });
          }, 500);
        } else {
          toast.success(result.message || "Invitations sent successfully", {
            id: sendToast,
          });
        }

        return result;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to send invitations", {
          id: sendToast,
        });
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate invitations list to refetch
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

// Hook for sending to a single recipient
export function useSendSingleInvitation() {
  const sendMultiple = useSendInvitations();

  return useMutation({
    mutationFn: async ({
      memorialId,
      role,
      name,
      email,
      phone,
      customSubject,
      message,
      invitationCard,
      sendViaEmail,
      sendViaWhatsApp,
      cardFile,
    }: {
      memorialId: string;
      role: string;
      name?: string;
      email?: string;
      phone?: string;
      customSubject?: string;
      message?: string;
      invitationCard?: string;
      sendViaEmail: boolean;
      sendViaWhatsApp: boolean;
      cardFile?: File;
    }) => {
      return sendMultiple.mutateAsync({
        data: {
          memorialId,
          role,
          customSubject,
          message,
          invitationCard,
          recipients: [{ name, email, phone }],
          sendViaEmail,
          sendViaWhatsApp,
        },
        cardFile,
      });
    },
  });
}

// Hook for resending an invitation
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resend invitation");
      }

      return response.json();
    },
    onMutate: () => {
      const loadingToast = toast.loading("Resending invitation...");
      return { loadingToast };
    },
    onSuccess: (data, _, context) => {
      const channels = [];
      if (data.data?.sentViaEmail) channels.push("email");
      if (data.data?.sentViaWhatsApp) channels.push("WhatsApp");

      toast.success(
        `Invitation resent successfully${channels.length > 0 ? ` via ${channels.join(" and ")}` : ""}`,
        { id: context?.loadingToast }
      );

      // Invalidate and refetch invitations
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (error: Error, _, context) => {
      toast.error(error.message || "Failed to resend invitation", {
        id: context?.loadingToast,
      });
    },
  });
}

// Hook for deleting/revoking an invitation
export function useDeleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete invitation");
      }

      return response.json();
    },
    onMutate: () => {
      const loadingToast = toast.loading("Revoking invitation...");
      return { loadingToast };
    },
    onSuccess: (data, _, context) => {
      toast.success(data.message || "Invitation revoked successfully", {
        id: context?.loadingToast,
      });

      // Invalidate and refetch invitations
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (error: Error, _, context) => {
      toast.error(error.message || "Failed to revoke invitation", {
        id: context?.loadingToast,
      });
    },
  });
}
