"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, MapPin } from "lucide-react";

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  category: "birthplace" | "residence" | "workplace" | "favorite" | "memorial" | "other";
}

export interface MapLocationsData {
  locations: Location[];
  centerLat?: number;
  centerLng?: number;
  zoomLevel: number;
  showDirections: boolean;
}

interface MapLocationsEditorProps {
  data: MapLocationsData;
  onChange: (data: MapLocationsData) => void;
}

export const MapLocationsEditor: React.FC<MapLocationsEditorProps> = ({ data, onChange }) => {
  const addLocation = () => {
    const newLocation: Location = {
      id: Date.now().toString(),
      name: "",
      address: "",
      description: "",
      category: "other",
    };
    onChange({
      ...data,
      locations: [...data.locations, newLocation],
    });
  };

  const updateLocation = (
    id: string,
    field: keyof Location,
    value: string | number | undefined
  ) => {
    onChange({
      ...data,
      locations: data.locations.map((location) =>
        location.id === id ? { ...location, [field]: value } : location
      ),
    });
  };

  const removeLocation = (id: string) => {
    onChange({
      ...data,
      locations: data.locations.filter((location) => location.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Map Locations</h3>
      </div>

      {/* Map Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Map Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              step="0.000001"
              placeholder="Center Latitude"
              value={data.centerLat || ""}
              onChange={(e) =>
                onChange({ ...data, centerLat: parseFloat(e.target.value) || undefined })
              }
            />
            <Input
              type="number"
              step="0.000001"
              placeholder="Center Longitude"
              value={data.centerLng || ""}
              onChange={(e) =>
                onChange({ ...data, centerLng: parseFloat(e.target.value) || undefined })
              }
            />
            <Input
              type="number"
              min="1"
              max="20"
              placeholder="Zoom Level"
              value={data.zoomLevel || 10}
              onChange={(e) => onChange({ ...data, zoomLevel: parseInt(e.target.value) || 10 })}
            />
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.showDirections}
              onChange={(e) => onChange({ ...data, showDirections: e.target.checked })}
              className="mr-2"
            />
            Show directions to locations
          </label>
        </CardContent>
      </Card>

      {/* Locations */}
      <div className="space-y-4">
        {data.locations.map((location) => (
          <Card key={location.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Location</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => removeLocation(location.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Location name"
                  value={location.name}
                  onChange={(e) => updateLocation(location.id, "name", e.target.value)}
                />
                <Select
                  value={location.category}
                  onValueChange={(value: Location["category"]) =>
                    updateLocation(location.id, "category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthplace">Birthplace</SelectItem>
                    <SelectItem value="residence">Residence</SelectItem>
                    <SelectItem value="workplace">Workplace</SelectItem>
                    <SelectItem value="favorite">Favorite Place</SelectItem>
                    <SelectItem value="memorial">Memorial Site</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder="Full address"
                value={location.address}
                onChange={(e) => updateLocation(location.id, "address", e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="Latitude (optional)"
                  value={location.latitude || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateLocation(location.id, "latitude", val ? parseFloat(val) : undefined);
                  }}
                />
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="Longitude (optional)"
                  value={location.longitude || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateLocation(location.id, "longitude", val ? parseFloat(val) : undefined);
                  }}
                />
              </div>

              <Input
                placeholder="Description (optional)"
                value={location.description || ""}
                onChange={(e) => updateLocation(location.id, "description", e.target.value)}
              />
            </CardContent>
          </Card>
        ))}

        <Button onClick={addLocation} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>
    </div>
  );
};
