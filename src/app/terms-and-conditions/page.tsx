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
          heading: "1. About Us",
          content: `ONN DA WAY provides food delivery services in Rohini, Delhi. Using our service constitutes acceptance of these terms.`,
        },
        {
          heading: "2. Orders & Availability",
          content: `All orders are subject to availability. We reserve the right to modify or cancel orders due to stock, pricing errors, or operational constraints.`,
        },
        {
          heading: "3. Payments",
          content: `All prices are in INR. Payments are securely processed via Razorpay. We do not store your financial data.`,
        },
        {
          heading: "4. Liability",
          content: `Fraudulent use will lead to immediate account termination. We are not liable for delays or indirect losses caused by circumstances beyond our control.`,
        }
      ]}
    />
  );
}
