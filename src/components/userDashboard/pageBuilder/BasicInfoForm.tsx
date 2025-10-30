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

export const BasicInfoForm: React.FC = () => {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <Label htmlFor="full-name">Full Name *</Label>
        <Input id="full-name" placeholder="Enter the full name" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="birth-date">Birth Date</Label>
          <Input id="birth-date" type="date" />
        </div>
        <div>
          <Label htmlFor="passing-date">Date of Passing</Label>
          <Input id="passing-date" type="date" />
        </div>
      </div>
      <div>
        <Label htmlFor="relationship">Your Relationship</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select your relationship" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spouse">Spouse</SelectItem>
            <SelectItem value="child">Child</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
            <SelectItem value="sibling">Sibling</SelectItem>
            <SelectItem value="family">Other Family</SelectItem>
            <SelectItem value="friend">Friend</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="short-bio">Brief Biography</Label>
        <Textarea
          id="short-bio"
          placeholder="Share a few words about their life, personality, and what made them special..."
          rows={4}
        />
      </div>
    </div>
  );
};
