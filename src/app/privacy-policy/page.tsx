import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — ONN DA WAY",
  description: "Privacy Policy for ONN DA WAY.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      lastUpdated="August 13, 2026"
      sections={[
        {
          heading: "1. Information Collection",
          content: `We collect essential information (name, contact, location) to fulfill your delivery requests.`,
        },
        {
          heading: "2. Data Usage",
          content: `Your data is strictly used for order processing, delivery logistics, and service improvements.`,
        },
        {
          heading: "3. Data Sharing",
          content: `We only share necessary information with trusted payment and delivery partners. We never sell your personal data.`,
        },
        {
          heading: "4. Security",
          content: `We employ industry-standard protocols to safeguard your information against unauthorized access.`,
        }
      ]}
    />
  );
}
