import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/hooks/useTheme";

export const MemorialDetailsForm: React.FC = () => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <Label htmlFor="profile-photo">Profile Photo</Label>
        <Input id="profile-photo" type="file" accept="image/*" />
        <p className={`text-sm mt-1 ${textMuted}`}>Upload a beautiful photo that represents them</p>
      </div>
      <div>
        <Label htmlFor="background-image">Background Image (Optional)</Label>
        <Input id="background-image" type="file" accept="image/*" />
        <p className={`text-sm mt-1 ${textMuted}`}>A meaningful place or memory</p>
      </div>
      <div>
        <Label htmlFor="memorial-message">Memorial Message</Label>
        <Textarea
          id="memorial-message"
          placeholder="A special message or quote that captures their spirit..."
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="privacy-setting">Privacy Setting</Label>
        <Select defaultValue="public">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public - Anyone can view</SelectItem>
            <SelectItem value="unlisted">Unlisted - Only with link</SelectItem>
            <SelectItem value="private">Private - Invited only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
