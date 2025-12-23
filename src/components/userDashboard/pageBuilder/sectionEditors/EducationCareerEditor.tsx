"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textArea";
import { Trash2, Plus, GraduationCap } from "lucide-react";

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear?: string;
  honors?: string;
}

export interface Career {
  id: string;
  company: string;
  position: string;
  startYear?: string;
  endYear?: string;
  description?: string;
}

export interface EducationCareerData {
  education: Education[];
  career: Career[];
  showEducation: boolean;
  showCareer: boolean;
}

interface EducationCareerEditorProps {
  data: EducationCareerData;
  onChange: (data: EducationCareerData) => void;
}

export const EducationCareerEditor: React.FC<EducationCareerEditorProps> = ({ data, onChange }) => {
  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      fieldOfStudy: "",
    };
    onChange({
      ...data,
      education: [...data.education, newEducation],
    });
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    onChange({
      ...data,
      education: data.education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu)),
    });
  };

  const removeEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter((edu) => edu.id !== id),
    });
  };

  const addCareer = () => {
    const newCareer: Career = {
      id: Date.now().toString(),
      company: "",
      position: "",
    };
    onChange({
      ...data,
      career: [...data.career, newCareer],
    });
  };

  const updateCareer = (id: string, field: keyof Career, value: string) => {
    onChange({
      ...data,
      career: data.career.map((job) => (job.id === id ? { ...job, [field]: value } : job)),
    });
  };

  const removeCareer = (id: string) => {
    onChange({
      ...data,
      career: data.career.filter((job) => job.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Education & Career</h3>
      </div>

      {/* Display Settings */}
      <div className="flex gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.showEducation}
            onChange={(e) => onChange({ ...data, showEducation: e.target.checked })}
            className="mr-2"
          />
          Show Education
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.showCareer}
            onChange={(e) => onChange({ ...data, showCareer: e.target.checked })}
            className="mr-2"
          />
          Show Career
        </label>
      </div>

      {/* Education Section */}
      {data.showEducation && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold">Education</h4>
          {data.education.map((edu) => (
            <Card key={edu.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Education</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => removeEducation(edu.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Institution name"
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                  />
                  <Input
                    placeholder="Degree/Diploma"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Field of study"
                    value={edu.fieldOfStudy}
                    onChange={(e) => updateEducation(edu.id, "fieldOfStudy", e.target.value)}
                  />
                  <Input
                    placeholder="Graduation year"
                    value={edu.graduationYear || ""}
                    onChange={(e) => updateEducation(edu.id, "graduationYear", e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Honors/Awards (optional)"
                  value={edu.honors || ""}
                  onChange={(e) => updateEducation(edu.id, "honors", e.target.value)}
                />
              </CardContent>
            </Card>
          ))}
          <Button onClick={addEducation} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Education
          </Button>
        </div>
      )}

      {/* Career Section */}
      {data.showCareer && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold">Career</h4>
          {data.career.map((job) => (
            <Card key={job.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Position</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => removeCareer(job.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Company/Organization"
                    value={job.company}
                    onChange={(e) => updateCareer(job.id, "company", e.target.value)}
                  />
                  <Input
                    placeholder="Position/Title"
                    value={job.position}
                    onChange={(e) => updateCareer(job.id, "position", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Start year"
                    value={job.startYear || ""}
                    onChange={(e) => updateCareer(job.id, "startYear", e.target.value)}
                  />
                  <Input
                    placeholder="End year (or 'Present')"
                    value={job.endYear || ""}
                    onChange={(e) => updateCareer(job.id, "endYear", e.target.value)}
                  />
                </div>
                <Textarea
                  placeholder="Job description (optional)"
                  value={job.description || ""}
                  onChange={(e) => updateCareer(job.id, "description", e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          ))}
          <Button onClick={addCareer} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </div>
      )}
    </div>
  );
};
