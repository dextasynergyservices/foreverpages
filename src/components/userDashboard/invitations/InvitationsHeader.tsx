import React from "react";

interface InvitationsHeaderProps {
  theme: string;
  t: (key: string, params?: unknown, fallback?: string) => string;
  textMuted: string;
}

export const InvitationsHeader: React.FC<InvitationsHeaderProps> = ({ t, textMuted }) => {
  return (
    <div className="mb-6 md:mb-8">
      <h1 className="text-2xl md:text-3xl font-serif font-bold">
        {t("dashboard.invitations.title")}
      </h1>
      <p className={`mt-2 ${textMuted}`}>{t("dashboard.invitations.subtitle")}</p>
    </div>
  );
};
