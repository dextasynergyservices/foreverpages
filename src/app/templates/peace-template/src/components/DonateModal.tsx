import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
("use client");

import { useState } from "react";
import { Flower, Sparkles, Heart } from "lucide-react";

interface DonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const donationOptions = [
  {
    id: "flowers",
    title: "Flower Tribute",
    icon: Flower,
    emoji: "🌸",
    description: "Send beautiful flowers",
  },
  {
    id: "memorial",
    title: "Memorial Fund",
    icon: Sparkles,
    emoji: "💫",
    description: "Contribute to memorial expenses",
  },
  {
    id: "family",
    title: "Family Support",
    icon: Heart,
    emoji: "🤍",
    description: "Direct support to family",
  },
];

export const DonateModal = ({ open, onOpenChange }: DonateModalProps) => {
  const [selectedOption, setSelectedOption] = useState<string>("flowers");
  const [amount, setAmount] = useState([50]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-cream/20 bg-gradient-to-br from-burgundy/95 via-burgundy/90 to-deep-plum/95 backdrop-blur-lg sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center font-heading text-2xl font-bold text-cream md:text-3xl">
            Support the Family
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Donation Options */}
          <div className="grid grid-cols-1 gap-3">
            {donationOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`rounded-xl border-2 p-4 text-left backdrop-blur-sm transition-smooth ${
                  selectedOption === option.id
                    ? "border-soft-gold bg-soft-gold/20"
                    : "border-cream/30 bg-cream/10 hover:border-soft-gold/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <div>
                    <div className="font-semibold text-cream">{option.title}</div>
                    <div className="text-sm text-cream/80">{option.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Amount Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-cream">Amount</Label>
              <span className="text-2xl font-bold text-soft-gold">${amount[0]}</span>
            </div>
            <Slider
              value={amount}
              onValueChange={setAmount}
              min={10}
              max={500}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-cream/70">
              <span>$10</span>
              <span>$500</span>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className="text-cream">
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                className="mt-1 border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-cream">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="mt-1 border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
              />
            </div>
            <div>
              <Label htmlFor="card" className="text-cream">
                Card Number
              </Label>
              <Input
                id="card"
                placeholder="1234 5678 9012 3456"
                className="mt-1 border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="expiry" className="text-cream">
                  Expiry
                </Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  className="mt-1 border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
                />
              </div>
              <div>
                <Label htmlFor="cvv" className="text-cream">
                  CVV
                </Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  className="mt-1 border-cream/30 bg-cream/20 text-cream placeholder-cream/60 focus:border-soft-gold focus:ring-soft-gold/20"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button className="w-full transform rounded-full bg-soft-gold font-semibold text-burgundy transition-all duration-300 hover:scale-105 hover:bg-soft-gold/90">
            Complete Donation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
