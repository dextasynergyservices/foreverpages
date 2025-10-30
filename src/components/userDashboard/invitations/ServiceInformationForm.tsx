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

interface ServiceInformationFormProps {
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const ServiceInformationForm: React.FC<ServiceInformationFormProps> = ({ t }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="service-date-time">{t("dashboard.invitations.create.dateTime")}</Label>
        <Input id="service-date-time" type="datetime-local" />
      </div>
      <div>
        <Label htmlFor="service-venue">{t("dashboard.invitations.create.venue")}</Label>
        <Input id="service-venue" placeholder="Church, funeral home, or venue name" />
      </div>
      <div>
        <Label htmlFor="service-address">{t("dashboard.invitations.create.address")}</Label>
        <Textarea
          id="service-address"
          placeholder="Full address with parking instructions"
          rows={2}
        />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="rsvp-required">{t("dashboard.invitations.create.rsvpRequired")}</Label>
        <Select defaultValue="yes">
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
