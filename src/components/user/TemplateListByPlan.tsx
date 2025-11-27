"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TemplateItem = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  previewImage?: string | null;
  thumbnailImage?: string | null;
};

export default function TemplateListByPlan({ planId }: { planId: string }) {
  const { data: templates = [], isLoading } = useQuery<TemplateItem[]>({
    queryKey: ["user-templates-by-plan", planId],
    queryFn: async () => {
      const res = await fetch(`/api/user/templates?planId=${encodeURIComponent(planId)}`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      const json = await res.json();
      const templatesArray = json?.data?.templates ?? json?.templates ?? json;
      return templatesArray as TemplateItem[];
    },
    enabled: !!planId,
  });

  if (!planId) return <div>No plan selected</div>;
  if (isLoading) return <div>Loading templates...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {templates.map((t) => (
        <Card key={t.id}>
          <CardHeader>
            <CardTitle>{t.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{t.description}</p>
            <div className="mt-2 flex gap-2">
              <a href={`/templates/${t.slug}`} className="btn">
                Use Template
              </a>
              <Button variant="ghost">Preview</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
