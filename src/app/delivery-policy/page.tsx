import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Delivery Policy — ONN DA WAY",
  description: "Delivery Policy for ONN DA WAY.",
};

export default function DeliveryPolicyPage() {
  return (
    <PolicyLayout
      title="Delivery Policy"
      lastUpdated="August 13, 2026"
      sections={[
        {
          heading: "1. Service Area",
          content: `We currently deliver within specific areas in Rohini, Delhi.`,
        },
        {
          heading: "2. Delivery Estimates",
          content: `Delivery times are estimated and may vary due to traffic, weather, or order volume.`,
        },
        {
          heading: "3. Issues",
          content: `If your order is damaged or incorrect, contact us immediately with your Order ID for a resolution.`,
        }
      ]}
    />
  );
}
