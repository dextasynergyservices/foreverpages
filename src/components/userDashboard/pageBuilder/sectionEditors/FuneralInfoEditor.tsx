"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { useTheme } from "@/hooks/useTheme";

export interface FuneralInfoData {
  serviceName?: string;
  date?: string;
  time?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  mapUrl?: string;
  livestreamUrl?: string;
  rsvpRequired?: boolean;
  dresscode?: string;
  specialInstructions?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

interface FuneralInfoEditorProps {
  data: FuneralInfoData;
  onChange: (data: FuneralInfoData) => void;
}

export const FuneralInfoEditor: React.FC<FuneralInfoEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const handleChange = (field: keyof FuneralInfoData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Funeral Service Information</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>Details about the funeral or memorial service</p>
      </div>

      {/* Service Name */}
      <div>
        <Label htmlFor="service-name">Service Name</Label>
        <Input
          id="service-name"
          placeholder="Memorial Service"
          value={data.serviceName || ""}
          onChange={(e) => handleChange("serviceName", e.target.value)}
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="service-date">Date</Label>
          <Input
            id="service-date"
            type="date"
            value={data.date || ""}
            onChange={(e) => handleChange("date", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="service-time">Time</Label>
          <Input
            id="service-time"
            type="time"
            value={data.time || ""}
            onChange={(e) => handleChange("time", e.target.value)}
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="service-location">Venue/Location Name</Label>
        <Input
          id="service-location"
          placeholder="St. Mary's Church"
          value={data.location || ""}
          onChange={(e) => handleChange("location", e.target.value)}
        />
      </div>

      {/* Address */}
      <div>
        <Label htmlFor="service-address">Street Address</Label>
        <Input
          id="service-address"
          placeholder="123 Main Street"
          value={data.address || ""}
          onChange={(e) => handleChange("address", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="col-span-2 md:col-span-1">
          <Label htmlFor="service-city">City</Label>
          <Input
            id="service-city"
            placeholder="City"
            value={data.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="service-state">State</Label>
          <Input
            id="service-state"
            placeholder="State"
            value={data.state || ""}
            onChange={(e) => handleChange("state", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="service-zip">Zip Code</Label>
          <Input
            id="service-zip"
            placeholder="12345"
            value={data.zipCode || ""}
            onChange={(e) => handleChange("zipCode", e.target.value)}
          />
        </div>
      </div>

      {/* Map URL */}
      <div>
        <Label htmlFor="map-url">Google Maps Link (Optional)</Label>
        <Input
          id="map-url"
          type="url"
          placeholder="https://maps.google.com/..."
          value={data.mapUrl || ""}
          onChange={(e) => handleChange("mapUrl", e.target.value)}
        />
      </div>

      {/* Livestream URL */}
      <div>
        <Label htmlFor="livestream-url">Livestream URL (Optional)</Label>
        <Input
          id="livestream-url"
          type="url"
          placeholder="https://..."
          value={data.livestreamUrl || ""}
          onChange={(e) => handleChange("livestreamUrl", e.target.value)}
        />
        <p className={`text-xs mt-1 ${textMuted}`}>
          Link for remote attendees to watch the service
        </p>
      </div>

      {/* RSVP Required Toggle */}
      <div
        className={`flex items-center justify-between p-4 rounded-lg border ${
          theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
        }`}
      >
        <div>
          <p className="font-medium">RSVP Required</p>
          <p className={`text-sm ${textMuted}`}>Require guests to confirm attendance</p>
        </div>
        <button
          onClick={() => handleChange("rsvpRequired", !data.rsvpRequired)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            data.rsvpRequired ? "bg-blue-600" : theme === "dark" ? "bg-white/20" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              data.rsvpRequired ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* Dress Code */}
      <div>
        <Label htmlFor="dress-code">Dress Code (Optional)</Label>
        <Input
          id="dress-code"
          placeholder="e.g., Formal, Casual, Traditional"
          value={data.dresscode || ""}
          onChange={(e) => handleChange("dresscode", e.target.value)}
        />
      </div>

      {/* Special Instructions */}
      <div>
        <Label htmlFor="special-instructions">Special Instructions (Optional)</Label>
        <Textarea
          id="special-instructions"
          placeholder="Any special instructions for attendees..."
          rows={3}
          value={data.specialInstructions || ""}
          onChange={(e) => handleChange("specialInstructions", e.target.value)}
        />
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h4 className="font-medium">Contact Person</h4>
        <div>
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            placeholder="Contact person name"
            value={data.contactName || ""}
            onChange={(e) => handleChange("contactName", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact-phone">Phone</Label>
            <Input
              id="contact-phone"
              type="tel"
              placeholder="(123) 456-7890"
              value={data.contactPhone || ""}
              onChange={(e) => handleChange("contactPhone", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="contact@example.com"
              value={data.contactEmail || ""}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
