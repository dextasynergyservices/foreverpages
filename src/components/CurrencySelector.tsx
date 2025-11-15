"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Currency = "NGN" | "USD" | "GBP" | "EUR";

interface CurrencyOption {
  code: Currency;
  symbol: string;
  name: string;
  flag: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", flag: "🇳🇬" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
];

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  className?: string;
}

export function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  className = "",
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = CURRENCIES.find((c) => c.code === selectedCurrency) || CURRENCIES[0];

  const handleSelect = (currency: Currency) => {
    onCurrencyChange(currency);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select currency"
          className={`w-[200px] justify-between ${className}`}
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">{selectedOption.flag}</span>
            <span className="font-medium">
              {selectedOption.symbol} {selectedOption.code}
            </span>
            <span className="hidden sm:inline text-muted-foreground">{selectedOption.name}</span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        {CURRENCIES.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onSelect={() => handleSelect(currency.code)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="text-lg">{currency.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {currency.symbol} {currency.code}
                  </span>
                  <span className="text-xs text-muted-foreground">{currency.name}</span>
                </div>
              </div>
              {selectedCurrency === currency.code && <Check className="h-4 w-4 text-primary" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { CURRENCIES };
export type { CurrencyOption };
