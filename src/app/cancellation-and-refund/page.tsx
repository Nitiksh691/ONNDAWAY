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
          content: `You can cancel your order before preparation begins. Once preparation starts, cancellations are not permitted.`,
        },
        {
          heading: "2. Refunds",
          content: `Refunds are issued for missing items, damaged orders, or ONN DA WAY cancellations. Refunds may take 5-7 days to reflect in your account.`,
        },
        {
          heading: "3. Contact",
          content: `For refund queries, email nitikshpal@gmail.com with your Order ID.`,
        }
      ]}
    />
  );
}
