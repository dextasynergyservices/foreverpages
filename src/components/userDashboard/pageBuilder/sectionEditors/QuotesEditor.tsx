"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Quote } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export interface QuoteItem {
  id: string;
  text: string;
  author?: string;
}

export interface QuotesData {
  quotes: QuoteItem[];
}

interface QuotesEditorProps {
  data: QuotesData;
  onChange: (data: QuotesData) => void;
}

export const QuotesEditor: React.FC<QuotesEditorProps> = ({ data, onChange }) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const addQuote = () => {
    const newQuote: QuoteItem = {
      id: `quote-${Date.now()}`,
      text: "",
      author: "",
    };
    onChange({ quotes: [...data.quotes, newQuote] });
  };

  const updateQuote = (quoteId: string, field: keyof QuoteItem, value: string) => {
    const updatedQuotes = data.quotes.map((quote) =>
      quote.id === quoteId ? { ...quote, [field]: value } : quote
    );
    onChange({ quotes: updatedQuotes });
  };

  const removeQuote = (quoteId: string) => {
    const updatedQuotes = data.quotes.filter((quote) => quote.id !== quoteId);
    onChange({ quotes: updatedQuotes });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Memorable Quotes</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>Favorite sayings, wisdom, or memorable words</p>
      </div>

      <Button onClick={addQuote} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Quote
      </Button>

      <div className="space-y-4">
        {data.quotes.length === 0 ? (
          <div
            className={`text-center py-12 border-2 border-dashed rounded-lg ${
              theme === "dark" ? "border-white/10" : "border-gray-200"
            }`}
          >
            <Quote className={`h-12 w-12 mx-auto mb-3 ${textMuted}`} />
            <p className={textMuted}>No quotes added yet</p>
          </div>
        ) : (
          data.quotes.map((quote) => (
            <div
              key={quote.id}
              className={`p-6 rounded-lg border ${
                theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <Quote className="h-5 w-5 text-blue-500" />
                <button
                  onClick={() => removeQuote(quote.id)}
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
                  <Label htmlFor={`quote-text-${quote.id}`}>Quote Text *</Label>
                  <Textarea
                    id={`quote-text-${quote.id}`}
                    placeholder="Enter the quote..."
                    rows={3}
                    value={quote.text}
                    onChange={(e) => updateQuote(quote.id, "text", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`quote-author-${quote.id}`}>Author/Attribution (Optional)</Label>
                  <input
                    id={`quote-author-${quote.id}`}
                    type="text"
                    placeholder="Who said this or where it's from"
                    value={quote.author || ""}
                    onChange={(e) => updateQuote(quote.id, "author", e.target.value)}
                    className={`w-full mt-1 px-3 py-2 rounded-md border ${
                      theme === "dark"
                        ? "bg-black border-white/10 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
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
