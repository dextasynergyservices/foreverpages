"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MdTextFields, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { FaCheck } from "react-icons/fa";

interface LowerThirdEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamId: string;
}

interface LowerThirdConfig {
  name: string;
  title: string;
  position:
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "top-left"
    | "top-center"
    | "top-right";
  backgroundColor: string;
  textColor: string;
  opacity: number;
  fontSize: number;
  duration: number; // seconds (0 = permanent)
}

export default function LowerThirdEditor({ open, onOpenChange, streamId }: LowerThirdEditorProps) {
  const [config, setConfig] = useState<LowerThirdConfig>({
    name: "",
    title: "",
    position: "bottom-left",
    backgroundColor: "#000000",
    textColor: "#ffffff",
    opacity: 80,
    fontSize: 16,
    duration: 10,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    if (!config.name.trim()) return;

    setApplying(true);
    try {
      const response = await fetch(`/api/streams/${streamId}/lower-third`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, visible: true }),
      });

      if (!response.ok) throw new Error("Failed to apply lower third");

      setIsVisible(true);

      // Auto-hide after duration if not permanent
      if (config.duration > 0) {
        setTimeout(() => {
          setIsVisible(false);
        }, config.duration * 1000);
      }
    } catch (error) {
      console.error("Error applying lower third:", error);
    } finally {
      setApplying(false);
    }
  };

  const handleHide = async () => {
    try {
      await fetch(`/api/streams/${streamId}/lower-third`, {
        method: "DELETE",
      });
      setIsVisible(false);
    } catch (error) {
      console.error("Error hiding lower third:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 text-white border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MdTextFields className="h-5 w-5 text-purple-400" />
            Lower Third Graphics
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Add name plates and titles to your livestream
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Text Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Family Member"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Select
              value={config.position}
              onValueChange={(value) =>
                setConfig({ ...config, position: value as LowerThirdConfig["position"] })
              }
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-center">Bottom Center</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-center">Top Center</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bgColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="bgColor"
                  type="color"
                  value={config.backgroundColor}
                  onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                  className="w-16 h-10 bg-gray-800 border-gray-700 cursor-pointer"
                />
                <Input
                  value={config.backgroundColor}
                  onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={config.textColor}
                  onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                  className="w-16 h-10 bg-gray-800 border-gray-700 cursor-pointer"
                />
                <Input
                  value={config.textColor}
                  onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Opacity</Label>
              <span className="text-sm text-gray-400">{config.opacity}%</span>
            </div>
            <Slider
              value={[config.opacity]}
              onValueChange={(value) => setConfig({ ...config, opacity: value[0] })}
              min={0}
              max={100}
              step={5}
              className="[&>span]:bg-purple-500"
            />
          </div>

          {/* Font Size Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Font Size</Label>
              <span className="text-sm text-gray-400">{config.fontSize}px</span>
            </div>
            <Slider
              value={[config.fontSize]}
              onValueChange={(value) => setConfig({ ...config, fontSize: value[0] })}
              min={12}
              max={32}
              step={2}
              className="[&>span]:bg-purple-500"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Display Duration</Label>
              <span className="text-sm text-gray-400">
                {config.duration === 0 ? "Permanent" : `${config.duration}s`}
              </span>
            </div>
            <Slider
              value={[config.duration]}
              onValueChange={(value) => setConfig({ ...config, duration: value[0] })}
              min={0}
              max={60}
              step={5}
              className="[&>span]:bg-purple-500"
            />
            <p className="text-xs text-gray-400">Set to 0 for permanent display</p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative w-full h-32 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              {config.name && (
                <div
                  className={`absolute ${config.position.includes("top") ? "top-4" : "bottom-4"} ${
                    config.position.includes("left")
                      ? "left-4"
                      : config.position.includes("right")
                        ? "right-4"
                        : "left-1/2 -translate-x-1/2"
                  } px-4 py-2 rounded`}
                  style={{
                    backgroundColor: config.backgroundColor,
                    opacity: config.opacity / 100,
                    color: config.textColor,
                    fontSize: config.fontSize,
                  }}
                >
                  <div className="font-bold">{config.name}</div>
                  {config.title && <div className="text-sm opacity-90">{config.title}</div>}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          {isVisible && (
            <Button
              variant="outline"
              onClick={handleHide}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <MdVisibilityOff className="mr-2 h-4 w-4" />
              Hide
            </Button>
          )}
          <Button
            onClick={handleApply}
            disabled={!config.name.trim() || applying}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {applying ? (
              "Applying..."
            ) : isVisible ? (
              <>
                <FaCheck className="mr-2 h-3 w-3" />
                Update
              </>
            ) : (
              <>
                <MdVisibility className="mr-2 h-4 w-4" />
                Show
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
