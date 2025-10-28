import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/hooks/useTranslations";
import Image from "next/image";

interface FuneralPage {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdBy: string;
}

interface MemorialGridProps {
  currentItems: FuneralPage[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const MemorialGrid: React.FC<MemorialGridProps> = ({
  currentItems,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const { t } = useTranslations();

  return (
    <div className="flex-1 bg-muted/20 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {currentItems.map((page) => (
            <Card
              key={page.id}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="aspect-video overflow-hidden">
                <Image
                  src={page.imageUrl}
                  alt={page.title}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-serif line-clamp-1">{page.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                  {page.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>
                    {t("allFuneralPage.by")} {page.createdBy}
                  </span>
                  <Button variant="ghost" size="sm">
                    {t("allFuneralPage.view")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Show empty state if no items */}
        {currentItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">{t("allFuneralPage.noMemorials")}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
              >
                {t("allFuneralPage.previous")}
              </Button>

              {/* Show limited pagination for better UX */}
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = idx + 1;
                } else {
                  // Show pages around current page
                  const start = Math.max(1, currentPage - 2);
                  pageNum = start + idx;
                  if (pageNum > totalPages) return null;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                {t("allFuneralPage.next")}
              </Button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};
