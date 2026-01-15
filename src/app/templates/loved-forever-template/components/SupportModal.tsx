"use client";

/**
 * SupportModal for Loved Forever
 * Re-exports the shared SupportModal component for the loved-forever-template template
 *
 * The shared SupportModal provides:
 * - Multi-currency support (USD, EUR, GBP, NGN)
 * - Multiple payment methods (Bank, Mobile Money, PayPal, Stripe)
 * - Donor information collection
 * - Copy-to-clipboard for payment details
 * - Responsive design with dark mode support
 */

export { default } from "@/components/modals/SupportModal";
export { default as SupportModal } from "@/components/modals/SupportModal";

// SupportModal props interface for reference
export interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  memorialOwnerName?: string;
  memorialTitle?: string;
  memorialOwnerId?: string;
  memorialId?: string;
}
