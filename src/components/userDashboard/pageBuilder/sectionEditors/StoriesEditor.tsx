"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textArea";
import { Trash2, Plus, BookOpen } from "lucide-react";

export interface Story {
  id: string;
  title: string;
  content: string;
  author: string;
  date?: string;
  featured: boolean;
}

export interface StoriesData {
  stories: Story[];
  allowPublicSubmissions: boolean;
  requireApproval: boolean;
  showAuthor: boolean;
}

interface StoriesEditorProps {
  data: StoriesData;
  onChange: (data: StoriesData) => void;
}

export const StoriesEditor: React.FC<StoriesEditorProps> = ({ data, onChange }) => {
  const addStory = () => {
    const newStory: Story = {
      id: Date.now().toString(),
      title: "",
      content: "",
      author: "",
      featured: false,
    };
    onChange({
      ...data,
      stories: [...data.stories, newStory],
    });
  };

  const updateStory = (id: string, field: keyof Story, value: string | boolean) => {
    onChange({
      ...data,
      stories: data.stories.map((story) =>
        story.id === id ? { ...story, [field]: value } : story
      ),
    });
  };

  const removeStory = (id: string) => {
    onChange({
      ...data,
      stories: data.stories.filter((story) => story.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Stories</h3>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.allowPublicSubmissions}
              onChange={(e) => onChange({ ...data, allowPublicSubmissions: e.target.checked })}
              className="mr-2"
            />
            Allow public story submissions
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.requireApproval}
              onChange={(e) => onChange({ ...data, requireApproval: e.target.checked })}
              className="mr-2"
            />
            Require approval for submissions
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.showAuthor}
              onChange={(e) => onChange({ ...data, showAuthor: e.target.checked })}
              className="mr-2"
            />
            Show story authors
          </label>
        </div>
      </div>

      {/* Stories */}
      <div className="space-y-4">
        {data.stories.map((story) => (
          <Card key={story.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Story</CardTitle>
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={story.featured}
                    onChange={(e) => updateStory(story.id, "featured", e.target.checked)}
                    className="mr-1"
                  />
                  Featured
                </label>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeStory(story.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Story title"
                value={story.title}
                onChange={(e) => updateStory(story.id, "title", e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Author"
                  value={story.author}
                  onChange={(e) => updateStory(story.id, "author", e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="Story date"
                  value={story.date || ""}
                  onChange={(e) => updateStory(story.id, "date", e.target.value)}
                />
              </div>

              <Textarea
                placeholder="Write the story..."
                value={story.content}
                onChange={(e) => updateStory(story.id, "content", e.target.value)}
                rows={6}
              />
            </CardContent>
          </Card>
        ))}

        <Button onClick={addStory} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Story
        </Button>
      </div>
    </div>
  );
};
