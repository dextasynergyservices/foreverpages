"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Download, Search, Crown, Eye } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { useTranslations } from "@/hooks/useTranslations";
import toast from "react-hot-toast";
import { OptimizedTemplateImage } from "./OptimizedTemplateImage";
import { sanitizeInput, validateSearchQuery } from "@/utils/templateSecurity";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  thumbnailImage: string;
  rating: number;
  reviewCount: number;
  downloadCount: number;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar?: string;
  };
  isPremium: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export const TemplateMarketplace = () => {
  const { t } = useTranslations();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const {
    data: marketplaceTemplates = [],
    isLoading,
    error,
  } = useQuery<MarketplaceTemplate[]>({
    queryKey: ["marketplace-templates", searchQuery, selectedCategory, sortBy],
    queryFn: async (): Promise<MarketplaceTemplate[]> => {
      const params = new URLSearchParams({
        search: searchQuery,
        category: selectedCategory,
        sort: sortBy,
      });
      const response = await fetch(`/api/templates/marketplace?${params}`);
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized — user session might have expired
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch marketplace templates");
      }
      const data = await response.json();
      return data.data.templates;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const isUnauthorized = (() => {
    try {
      if (!error) return false;
      return (error as Error).message === "Unauthorized";
    } catch {
      return false;
    }
  })();

  const downloadMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`/api/templates/marketplace/${templateId}/download`, {
        method: "POST",
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || "Failed to download template");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success(t("dashboard.templates.marketplace.download.success"));
      queryClient.invalidateQueries({ queryKey: ["marketplace-templates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("dashboard.templates.marketplace.download.error"));
    },
  });

  const categories = [
    { value: "all", label: t("dashboard.templates.marketplace.filters.all") },
    {
      value: "traditional",
      label: t("dashboard.templates.marketplace.filters.categories.traditional"),
    },
    {
      value: "modern",
      label: t("dashboard.templates.marketplace.filters.categories.modern"),
    },
    {
      value: "nature",
      label: t("dashboard.templates.marketplace.filters.categories.nature"),
    },
    {
      value: "religious",
      label: t("dashboard.templates.marketplace.filters.categories.religious"),
    },
    {
      value: "military",
      label: t("dashboard.templates.marketplace.filters.categories.military"),
    },
    {
      value: "sports",
      label: t("dashboard.templates.marketplace.filters.categories.sports"),
    },
    {
      value: "music",
      label: t("dashboard.templates.marketplace.filters.categories.music"),
    },
    {
      value: "artistic",
      label: t("dashboard.templates.marketplace.filters.categories.artistic"),
    },
  ];

  const sortOptions = [
    { value: "popular", label: t("dashboard.templates.marketplace.filters.sort.popular") },
    { value: "newest", label: t("dashboard.templates.marketplace.filters.sort.newest") },
    { value: "rating", label: t("dashboard.templates.marketplace.filters.sort.rating") },
  ];

  const handleDownload = (template: MarketplaceTemplate) => {
    downloadMutation.mutate(template.id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t("dashboard.templates.marketplace.title")}
          </CardTitle>
          <CardDescription>{t("dashboard.templates.marketplace.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("dashboard.templates.marketplace.search.placeholder")}
                value={searchQuery}
                onChange={(e) => {
                  const validation = validateSearchQuery(e.target.value);
                  if (validation.isValid) {
                    setSearchQuery(sanitizeInput(e.target.value));
                  } else {
                    const key = validation.error || "unknown";
                    toast.error(t(`dashboard.templates.validation.${key}`) ?? key);
                  }
                }}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isUnauthorized ? (
            <div className="p-6 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                {t("dashboard.templates.marketplace.errors.unauthorized") ||
                  "Please sign in to view available templates."}
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={() =>
                    signIn(undefined, {
                      callbackUrl:
                        typeof window !== "undefined"
                          ? window.location.href
                          : "/user-dashboard?section=templates",
                    })
                  }
                >
                  {t("auth.signIn") || "Sign in"}
                </Button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-48 w-full mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketplaceTemplates.map((template, index) => (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative">
                      <OptimizedTemplateImage
                        src={template.thumbnailImage}
                        alt={template.name}
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover rounded-t-lg"
                        priority={index < 6}
                        quality={85}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
                      />
                      {template.isPremium && (
                        <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500">
                          <Crown className="h-3 w-3 mr-1" />
                          {t("dashboard.templates.marketplace.filters.premium")}
                        </Badge>
                      )}
                      {template.isFeatured && (
                        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowPreview(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t("dashboard.templates.marketplace.template.preview")}
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{template.rating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({template.reviewCount})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Download className="h-4 w-4" />
                          {template.downloadCount}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {t("dashboard.templates.marketplace.filters.free")}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(template)}
                          disabled={
                            downloadMutation.isPending ||
                            !(
                              session?.user?.role === "ADMIN" ||
                              session?.user?.role === "SUPER_ADMIN"
                            )
                          }
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {t("dashboard.templates.marketplace.template.download")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate?.isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-6">
              <OptimizedTemplateImage
                src={selectedTemplate.previewImage}
                alt={selectedTemplate.name}
                width={800}
                height={400}
                className="w-full rounded-lg"
                quality={90}
                priority
                sizes="(max-width: 1200px) 100vw, 800px"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Author:</span>
                      <span>{selectedTemplate.author.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {selectedTemplate.rating} ({selectedTemplate.reviewCount} reviews)
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Downloads:</span>
                      <span>{selectedTemplate.downloadCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span>{selectedTemplate.category}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => selectedTemplate && handleDownload(selectedTemplate)}
                  disabled={
                    downloadMutation.isPending ||
                    !(session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN")
                  }
                >
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
