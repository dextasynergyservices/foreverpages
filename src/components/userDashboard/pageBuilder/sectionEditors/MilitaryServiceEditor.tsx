"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textArea";
import { Trash2, Plus, Award } from "lucide-react";

export interface MilitaryService {
  branch: string;
  rank: string;
  yearsOfService: string;
  unitDivision?: string;
  deployments?: string[];
  awards?: string[];
  description?: string;
}

export interface MilitaryServiceData {
  service: MilitaryService;
  showOnMemorial: boolean;
  displayFormat: "detailed" | "summary" | "awards-only";
}

interface MilitaryServiceEditorProps {
  data: MilitaryServiceData;
  onChange: (data: MilitaryServiceData) => void;
  onOpenMediaPicker?: () => void;
}

export const MilitaryServiceEditor: React.FC<MilitaryServiceEditorProps> = ({
  data,
  onChange,
  onOpenMediaPicker,
}) => {
  const updateService = (field: keyof MilitaryService, value: string | string[]) => {
    onChange({
      ...data,
      service: { ...data.service, [field]: value },
    });
  };

  const addDeployment = () => {
    const deployments = data.service.deployments || [];
    updateService("deployments", [...deployments, ""]);
  };

  const updateDeployment = (index: number, value: string) => {
    const deployments = data.service.deployments || [];
    deployments[index] = value;
    updateService("deployments", deployments);
  };

  const removeDeployment = (index: number) => {
    const deployments = data.service.deployments || [];
    deployments.splice(index, 1);
    updateService("deployments", deployments);
  };

  const addAward = () => {
    const awards = data.service.awards || [];
    updateService("awards", [...awards, ""]);
  };

  const updateAward = (index: number, value: string) => {
    const awards = data.service.awards || [];
    awards[index] = value;
    updateService("awards", awards);
  };

  const removeAward = (index: number) => {
    const awards = data.service.awards || [];
    awards.splice(index, 1);
    updateService("awards", awards);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Military Service</h3>
      </div>

      {/* Display Settings */}
      <div className="space-y-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.showOnMemorial}
            onChange={(e) => onChange({ ...data, showOnMemorial: e.target.checked })}
            className="mr-2"
          />
          Display military service on memorial
        </label>

        <div>
          <label className="block text-sm font-medium mb-2">Display Format</label>
          <select
            value={data.displayFormat}
            onChange={(e) =>
              onChange({
                ...data,
                displayFormat: e.target.value as MilitaryServiceData["displayFormat"],
              })
            }
            className="w-full p-2 border rounded-md"
          >
            <option value="detailed">Detailed Information</option>
            <option value="summary">Summary Only</option>
            <option value="awards-only">Awards Only</option>
          </select>
        </div>
      </div>

      {/* Military Service Information */}
      <Card>
        <CardHeader>
          <CardTitle>Service Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Branch of service"
              value={data.service.branch || ""}
              onChange={(e) => updateService("branch", e.target.value)}
            />
            <Input
              placeholder="Rank achieved"
              value={data.service.rank || ""}
              onChange={(e) => updateService("rank", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Years of service (e.g., 1990-1995)"
              value={data.service.yearsOfService || ""}
              onChange={(e) => updateService("yearsOfService", e.target.value)}
            />
            <Input
              placeholder="Unit/Division"
              value={data.service.unitDivision || ""}
              onChange={(e) => updateService("unitDivision", e.target.value)}
            />
          </div>

          <Textarea
            placeholder="Description of service..."
            value={data.service.description || ""}
            onChange={(e) => updateService("description", e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Deployments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deployments</CardTitle>
          <Button variant="outline" size="sm" onClick={addDeployment}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data.service.deployments || []).map((deployment, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Deployment location/operation"
                value={deployment}
                onChange={(e) => updateDeployment(index, e.target.value)}
              />
              <Button variant="ghost" size="sm" onClick={() => removeDeployment(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Awards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Awards & Honors</CardTitle>
          <Button variant="outline" size="sm" onClick={addAward}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data.service.awards || []).map((award, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Award or medal name"
                value={award}
                onChange={(e) => updateAward(index, e.target.value)}
              />
              <Button variant="ghost" size="sm" onClick={() => removeAward(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {onOpenMediaPicker && (
        <Button variant="outline" onClick={onOpenMediaPicker} className="w-full">
          Add Military Photos
        </Button>
      )}
    </div>
  );
};
