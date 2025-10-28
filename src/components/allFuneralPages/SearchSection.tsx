import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}) => {
  const { t } = useTranslations();

  return (
    <div className="bg-background py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={onSearchSubmit} className="flex gap-4">
          <Input
            type="text"
            className="flex-1"
            placeholder={t("allFuneralPage.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Button type="submit">{t("allFuneralPage.search")}</Button>
        </form>
      </div>
    </div>
  );
};
