/**
 * Loved Forever - Type Definitions
 * Auto-generated types for the loved-forever-template template
 */

export interface SectionProps {
  className?: string;
  isPreview?: boolean;
}

export interface MemorialInfo {
  name: string;
  birthYear: string;
  deathYear: string;
  tagline: string;
  portraitUrl: string;
  videoUrl?: string;
}

export interface SupportRecord {
  id: string;
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  createdAt: Date;
}

export interface AccountDetail {
  id: string;
  type: "BANK" | "MOBILE_MONEY" | "PAYPAL" | "STRIPE";
  accountName: string;
  accountNumber: string;
  bankName?: string;
  routingNumber?: string;
  currency: string;
  isDefault?: boolean;
  description?: string;
}
