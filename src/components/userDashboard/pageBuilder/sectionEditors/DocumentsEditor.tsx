"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textArea";
import { Trash2, Plus, FileText } from "lucide-react";

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  uploadDate?: string;
  category: "legal" | "medical" | "personal" | "work" | "photos" | "other";
  isPublic: boolean;
}

export interface DocumentsData {
  documents: Document[];
  allowPublicUploads: boolean;
  requireApproval: boolean;
  maxFileSize: number; // in MB
  allowedFileTypes: string[];
}

interface DocumentsEditorProps {
  data: DocumentsData;
  onChange: (data: DocumentsData) => void;
  onOpenMediaPicker?: () => void;
}

export const DocumentsEditor: React.FC<DocumentsEditorProps> = ({
  data,
  onChange,
  onOpenMediaPicker,
}) => {
  const addDocument = () => {
    const newDocument: Document = {
      id: Date.now().toString(),
      title: "",
      description: "",
      category: "other",
      isPublic: false,
      uploadDate: new Date().toISOString().split("T")[0],
    };
    onChange({
      ...data,
      documents: [...data.documents, newDocument],
    });
  };

  const updateDocument = (id: string, field: keyof Document, value: string | boolean) => {
    onChange({
      ...data,
      documents: data.documents.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc)),
    });
  };

  const removeDocument = (id: string) => {
    onChange({
      ...data,
      documents: data.documents.filter((doc) => doc.id !== id),
    });
  };

  const updateAllowedFileTypes = (types: string) => {
    onChange({
      ...data,
      allowedFileTypes: types
        .split(",")
        .map((type) => type.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Documents</h3>
      </div>

      {/* Document Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Document Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.allowPublicUploads}
                onChange={(e) => onChange({ ...data, allowPublicUploads: e.target.checked })}
                className="mr-2"
              />
              Allow public document uploads
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.requireApproval}
                onChange={(e) => onChange({ ...data, requireApproval: e.target.checked })}
                className="mr-2"
              />
              Require approval for uploads
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max File Size (MB)</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={data.maxFileSize}
                onChange={(e) => onChange({ ...data, maxFileSize: parseInt(e.target.value) || 10 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Allowed File Types</label>
              <Input
                placeholder="pdf,doc,docx,jpg,png"
                value={data.allowedFileTypes.join(", ")}
                onChange={(e) => updateAllowedFileTypes(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <div className="space-y-4">
        {data.documents.map((document) => (
          <Card key={document.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Document</CardTitle>
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={document.isPublic}
                    onChange={(e) => updateDocument(document.id, "isPublic", e.target.checked)}
                    className="mr-1"
                  />
                  Public
                </label>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeDocument(document.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Document title"
                  value={document.title}
                  onChange={(e) => updateDocument(document.id, "title", e.target.value)}
                />
                <select
                  value={document.category}
                  onChange={(e) =>
                    updateDocument(document.id, "category", e.target.value as Document["category"])
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="legal">Legal</option>
                  <option value="medical">Medical</option>
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="photos">Photos</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <Textarea
                placeholder="Document description"
                value={document.description || ""}
                onChange={(e) => updateDocument(document.id, "description", e.target.value)}
                rows={2}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="File name"
                  value={document.fileName || ""}
                  onChange={(e) => updateDocument(document.id, "fileName", e.target.value)}
                  readOnly
                />
                <Input
                  type="date"
                  value={document.uploadDate || ""}
                  onChange={(e) => updateDocument(document.id, "uploadDate", e.target.value)}
                />
              </div>

              {onOpenMediaPicker && (
                <Button variant="outline" onClick={onOpenMediaPicker} className="w-full">
                  {document.fileName ? "Change Document" : "Upload Document"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        <Button onClick={addDocument} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>
    </div>
  );
};
