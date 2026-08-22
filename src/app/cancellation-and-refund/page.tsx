import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy — ONN DA WAY",
  description: "Cancellation & Refund Policy for ONN DA WAY.",
};

export default function CancellationRefundPage() {
  return (
    <PolicyLayout
      title="Cancellation & Refund Policy"
      lastUpdated="August 13, 2026"
      sections={[
        {
          heading: "1. Cancellations",
          content: `Orders may only be cancelled before preparation begins. Once accepted by the kitchen, cancellations are not permitted.`,
        },
        {
          heading: "2. Refunds",
          content: `Eligible refunds (for missing items or merchant cancellations) will be processed to the original payment method within 5-7 business days.`,
        },
        {
          heading: "3. Support",
          content: `Direct all refund inquiries to nitikshpal@gmail.com with your corresponding Order ID.`,
        }
      ]}
    />
  );
}
