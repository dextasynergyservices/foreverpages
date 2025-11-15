import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useMemorials } from "@/hooks/useMemorials";
import { NoMemorialsEmpty } from "./EmptyStates";
import { InvitationWizard } from "./InvitationWizard";

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
}

interface CreateInvitationTabProps {
  theme: string;
  themeClasses: ThemeClasses;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const CreateInvitationTab: React.FC<CreateInvitationTabProps> = ({
  theme,
  themeClasses,
  t,
}) => {
  const { cardBorder, cardBg } = themeClasses;
  const { data: memorialsData, isLoading: loadingMemorials } = useMemorials();

  const memorials = memorialsData?.data?.memorials || [];
  const hasNoMemorials = !loadingMemorials && memorials.length === 0;

  if (hasNoMemorials) {
    return (
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardContent className="pt-6">
          <NoMemorialsEmpty
            t={t}
            onAction={() => {
              // Navigate to create memorial page
              window.location.href = "/memorial-pages/create";
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return <InvitationWizard theme={theme} themeClasses={themeClasses} t={t} />;
};
