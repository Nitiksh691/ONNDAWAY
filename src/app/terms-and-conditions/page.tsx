import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Terms & Conditions — ONN DA WAY",
  description: "Terms & Conditions for ONN DA WAY.",
};

export default function TermsPage() {
  return (
    <PolicyLayout
      title="Terms & Conditions"
      lastUpdated="August 13, 2026"
      sections={[
        {
          heading: "1. About ONN DA WAY",
          content: `ONN DA WAY is a food delivery service for the Rohini, Delhi area. By placing an order, you agree to these terms.`,
        },
        {
          heading: "2. Orders & Availability",
          content: `All orders are subject to product availability. We reserve the right to cancel orders due to unavailability, pricing errors, or delivery constraints.`,
        },
        {
          heading: "3. Payments",
          content: `Prices are in INR. Payments are securely processed via Razorpay. We do not store your payment credentials.`,
        },
        {
          heading: "4. Misuse & Liability",
          content: `Fraudulent activity will result in account suspension. We are not liable for indirect losses or delivery delays caused by external factors.`,
        }
      ]}
    />
  );
}
