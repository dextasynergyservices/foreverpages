import PaymentSuccess from "@/components/payment/PaymentSuccess";

export const dynamic = "force-dynamic";

/**
 * Payment Success Page — marked dynamic to avoid CSR-bailout while
 * preserving the original runtime behavior of the page/component.
 */
export default function PaymentSuccessPage() {
  return <PaymentSuccess />;
}
