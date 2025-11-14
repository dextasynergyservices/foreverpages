import PaymentSuccess from "@/components/payment/PaymentSuccess";

/**
 * Payment Success Page
 *
 * Displays payment verification and success message
 * Redirects to signup page with payment reference
 *
 * URL: /payment-success?reference=xxx
 */
export default function PaymentSuccessPage() {
  return <PaymentSuccess />;
}
