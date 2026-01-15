"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

interface BlessingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BlessingModal = ({ open, onOpenChange }: BlessingModalProps) => {
  const [selectedBlessing, setSelectedBlessing] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");

  const blessings = [
    {
      id: "candle",
      icon: "🕊️",
      title: "Prayer Candle",
      description: "Light a virtual candle with a prayer",
      suggestedAmount: "10",
    },
    {
      id: "rose",
      icon: "🌹",
      title: "Memorial Rose",
      description: "Send virtual roses with a message",
      suggestedAmount: "25",
    },
    {
      id: "support",
      icon: "🤲",
      title: "Family Comfort",
      description: "Financial support for the family",
      suggestedAmount: "50",
    },
  ];

  const handleSendBlessing = () => {
    if (!selectedBlessing || !amount || !name) {
      toast.error("Please fill in all fields");
      return;
    }

    // Here you would integrate with payment processing
    toast.success("Your blessing has been sent to heaven ✨", {
      description: "Thank you for your kindness and support",
    });

    // Reset form
    setSelectedBlessing(null);
    setAmount("");
    setMessage("");
    setName("");
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[500px] bg-gradient-to-b from-[#3a4b2f] via-[#2e3a25] to-[#1f2615] border border-amber-300/20 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 text-amber-200 hover:text-amber-100 hover:bg-amber-300/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-2 text-center">
          <h2 className="font-heading text-3xl text-amber-100 mb-2">Send a Blessing</h2>
          <p className="font-body text-amber-200/70 text-sm">
            Your blessing brings comfort to those who mourn
          </p>
        </div>

        <div className="p-6 pt-4 space-y-6">
          {/* Blessing Options */}
          <div className="space-y-3">
            <label className="font-body font-semibold text-amber-100">Choose Your Blessing</label>
            <div className="grid gap-3">
              {blessings.map((blessing) => (
                <button
                  key={blessing.id}
                  onClick={() => {
                    setSelectedBlessing(blessing.id);
                    setAmount(blessing.suggestedAmount);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedBlessing === blessing.id
                      ? "border-amber-400 bg-amber-500/20 shadow-lg"
                      : "border-amber-300/20 hover:border-amber-300/40 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{blessing.icon}</span>
                    <div className="flex-1">
                      <div className="font-body font-semibold text-amber-100">{blessing.title}</div>
                      <div className="text-sm text-amber-200/70">{blessing.description}</div>
                    </div>
                    <div className="font-body text-sm text-amber-300 font-semibold">
                      ${blessing.suggestedAmount}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedBlessing && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="font-body text-amber-200/80 text-sm block">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-white/5 border border-white/20 text-amber-100 placeholder-amber-100/50 rounded-md px-3 py-2 font-body"
                />
              </div>

              {/* Blessing Amount */}
              <div className="space-y-2">
                <label htmlFor="amount" className="font-body text-amber-200/80 text-sm block">
                  Blessing Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-white/5 border border-white/20 text-amber-100 placeholder-amber-100/50 rounded-md px-3 py-2 font-body"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor="message" className="font-body text-amber-200/80 text-sm block">
                  Your Message (Optional)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your prayers and memories..."
                  className="w-full bg-white/5 border border-white/20 text-amber-100 placeholder-amber-100/50 rounded-md px-3 py-2 font-body min-h-[100px]"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendBlessing}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-100 shadow-lg font-body font-semibold py-4 text-lg rounded-md transition-all duration-300 hover:scale-[1.02]"
              >
                Send Your Blessing ✨
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlessingModal;
