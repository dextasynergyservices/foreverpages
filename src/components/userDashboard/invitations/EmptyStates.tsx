import React from "react";
import { Button } from "@/components/ui/button";
import { MdMailOutline, MdPeopleOutline, MdInbox, MdAddCircleOutline } from "react-icons/md";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="memorial">
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

// Specific empty state components
interface EmptyStatesProps {
  t: (key: string, params?: unknown, fallback?: string) => string;
  onAction?: () => void;
}

export const NoMemorialsEmpty: React.FC<EmptyStatesProps> = ({ t, onAction }) => {
  return (
    <EmptyState
      icon={<MdInbox className="h-16 w-16" />}
      title={t("dashboard.invitations.empty.noMemorials.title", {}, "No Memorial Pages Yet")}
      description={t(
        "dashboard.invitations.empty.noMemorials.description",
        {},
        "You need to create a memorial page before you can send invitations. Memorial pages honor and celebrate the life of your loved ones."
      )}
      actionLabel={t("dashboard.invitations.empty.noMemorials.action", {}, "Create Memorial Page")}
      onAction={onAction}
    />
  );
};

export const NoInvitationsEmpty: React.FC<EmptyStatesProps> = ({ t, onAction }) => {
  return (
    <EmptyState
      icon={<MdMailOutline className="h-16 w-16" />}
      title={t("dashboard.invitations.empty.noInvitations.title", {}, "No Invitations Sent Yet")}
      description={t(
        "dashboard.invitations.empty.noInvitations.description",
        {},
        "Start inviting family and friends to view and contribute to your memorial pages. You can send invitations via email or WhatsApp."
      )}
      actionLabel={t(
        "dashboard.invitations.empty.noInvitations.action",
        {},
        "Send Your First Invitation"
      )}
      onAction={onAction}
    />
  );
};

export const NoRecipientsEmpty: React.FC<{
  t: (key: string, params?: unknown, fallback?: string) => string;
}> = ({ t }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed rounded-lg">
      <MdPeopleOutline className="h-12 w-12 text-muted-foreground mb-3" />
      <h4 className="text-base font-medium mb-2">
        {t("dashboard.invitations.empty.noRecipients.title", {}, "No Recipients Added")}
      </h4>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {t(
          "dashboard.invitations.empty.noRecipients.description",
          {},
          "Add at least one recipient to send invitations. You can add their email, phone number, or both."
        )}
      </p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MdAddCircleOutline className="h-4 w-4" />
        <span>
          {t(
            "dashboard.invitations.empty.noRecipients.hint",
            {},
            "Click 'Add Recipient' button above to get started"
          )}
        </span>
      </div>
    </div>
  );
};

export const NoSearchResultsEmpty: React.FC<{
  t: (key: string, params?: unknown, fallback?: string) => string;
  searchQuery: string;
  onClear: () => void;
}> = ({ t, searchQuery, onClear }) => {
  return (
    <EmptyState
      icon={<MdInbox className="h-12 w-12" />}
      title={t("dashboard.invitations.empty.noResults.title", {}, "No Results Found")}
      description={t(
        "dashboard.invitations.empty.noResults.description",
        { query: searchQuery },
        `No invitations match "${searchQuery}". Try adjusting your search or filters.`
      )}
      actionLabel={t("dashboard.invitations.empty.noResults.action", {}, "Clear Search")}
      onAction={onClear}
    />
  );
};
