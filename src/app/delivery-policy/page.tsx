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
          content: `Delivery services are currently limited to designated zones within Rohini, Delhi.`,
        },
        {
          heading: "2. Timelines",
          content: `Delivery times are estimates. Actual times may vary based on traffic, weather, or operational volume.`,
        },
        {
          heading: "3. Order Issues",
          content: `For missing or damaged items, please contact support immediately with your Order ID for prompt resolution.`,
        }
      ]}
    />
  );
}
