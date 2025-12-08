"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Award } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export interface Achievement {
  id: string;
  title: string;
  description?: string;
  year?: string;
  category?: string;
}

export interface AchievementsData {
  achievements: Achievement[];
}

interface AchievementsEditorProps {
  data: AchievementsData;
  onChange: (data: AchievementsData) => void;
}

export const AchievementsEditor: React.FC<AchievementsEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const addAchievement = () => {
    const newAchievement: Achievement = {
      id: `achievement-${Date.now()}`,
      title: "",
      description: "",
      year: "",
      category: "",
    };
    onChange({ achievements: [...data.achievements, newAchievement] });
  };

  const updateAchievement = (achievementId: string, field: keyof Achievement, value: string) => {
    const updatedAchievements = data.achievements.map((achievement) =>
      achievement.id === achievementId ? { ...achievement, [field]: value } : achievement
    );
    onChange({ achievements: updatedAchievements });
  };

  const removeAchievement = (achievementId: string) => {
    const updatedAchievements = data.achievements.filter(
      (achievement) => achievement.id !== achievementId
    );
    onChange({ achievements: updatedAchievements });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Achievements & Awards</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>
          Recognize their accomplishments and contributions
        </p>
      </div>

      <Button onClick={addAchievement} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Achievement
      </Button>

      <div className="space-y-4">
        {data.achievements.length === 0 ? (
          <div
            className={`text-center py-12 border-2 border-dashed rounded-lg ${
              theme === "dark" ? "border-white/10" : "border-gray-200"
            }`}
          >
            <Award className={`h-12 w-12 mx-auto mb-3 ${textMuted}`} />
            <p className={textMuted}>No achievements added yet</p>
          </div>
        ) : (
          data.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-6 rounded-lg border ${
                theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <Award className="h-5 w-5 text-yellow-500" />
                <button
                  onClick={() => removeAchievement(achievement.id)}
                  className={`p-2 rounded-md transition-colors ${
                    theme === "dark"
                      ? "hover:bg-red-500/20 text-red-400"
                      : "hover:bg-red-100 text-red-600"
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor={`achievement-title-${achievement.id}`}>Title *</Label>
                  <Input
                    id={`achievement-title-${achievement.id}`}
                    placeholder="e.g., PhD in Physics"
                    value={achievement.title}
                    onChange={(e) => updateAchievement(achievement.id, "title", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`achievement-year-${achievement.id}`}>Year (Optional)</Label>
                    <Input
                      id={`achievement-year-${achievement.id}`}
                      placeholder="2020"
                      value={achievement.year || ""}
                      onChange={(e) => updateAchievement(achievement.id, "year", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`achievement-category-${achievement.id}`}>
                      Category (Optional)
                    </Label>
                    <Input
                      id={`achievement-category-${achievement.id}`}
                      placeholder="e.g., Academic, Professional"
                      value={achievement.category || ""}
                      onChange={(e) =>
                        updateAchievement(achievement.id, "category", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`achievement-description-${achievement.id}`}>
                    Description (Optional)
                  </Label>
                  <Textarea
                    id={`achievement-description-${achievement.id}`}
                    placeholder="Details about this achievement..."
                    rows={3}
                    value={achievement.description || ""}
                    onChange={(e) =>
                      updateAchievement(achievement.id, "description", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
