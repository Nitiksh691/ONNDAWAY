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
          heading: "1. Data Collection",
          content: `We collect your name, phone number, location, and order details to provide delivery services.`,
        },
        {
          heading: "2. Data Usage",
          content: `Your data is used to process orders, contact you for delivery, and improve our services.`,
        },
        {
          heading: "3. Third Parties",
          content: `We share necessary data with payment processors (e.g., Razorpay) and delivery partners. We do not sell your data.`,
        },
        {
          heading: "4. Security",
          content: `We use standard security measures to protect your data, but no system is 100% secure.`,
        }
      ]}
    />
  );
}
