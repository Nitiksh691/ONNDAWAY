import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy — ONN DA WAY",
  description: "Understand ONN DA WAY's cancellation and refund policy for food and beverage orders.",
};

export default function CancellationRefundPage() {
  return (
    <PolicyLayout
      title="Cancellation & Refund Policy"
      lastUpdated="August 13, 2026"
      sections={[
        {
          heading: "1. Order Cancellation by the Customer",
          content: `Customers may request cancellation as soon as possible after placing an order.

If preparation has not started, we may be able to cancel the order and process an eligible refund.

Once preparation has started, cancellation may no longer be possible because the food or beverage may have already been prepared specifically for the customer.`,
        },
        {
          heading: "2. Cancellation by ONN DA WAY",
          content: `We may cancel an order in circumstances including:
• Product unavailability.
• Inability to deliver to the requested location.
• Incorrect pricing or technical errors.
• Suspected fraudulent activity.
• Operational or safety issues.
• Circumstances outside our reasonable control.

If we cancel an order for a reason attributable to ONN DA WAY after receiving payment, an eligible refund will be processed.`,
        },
        {
          heading: "3. Refunds for Missing or Incorrect Items",
          content: `If your order contains a missing or incorrect item, please contact us promptly after delivery.

After reviewing the issue, we may provide:
• Replacement of the affected item;
• Refund of the affected item; or
• Another appropriate resolution.

The resolution may depend on the circumstances and information available.`,
        },
        {
          heading: "4. Refunds for Spilled or Damaged Products",
          content: `If an order arrives significantly spilled or damaged, please contact us promptly.

Where possible, provide photographs of the affected product and packaging.

After verification, we may offer a replacement, refund or another appropriate resolution.`,
        },
        {
          heading: "5. Quality Issues",
          content: `If you believe that a product has a significant quality issue, contact us as soon as reasonably possible after receiving the order.

We may request relevant information, photographs or other evidence to help us investigate the complaint.

We will review the complaint and provide an appropriate resolution where the issue is verified.`,
        },
        {
          heading: "6. Incorrect Customer Information",
          content: `ONN DA WAY may not be responsible for delivery failures resulting from incorrect information supplied by the customer, including:
• Incorrect phone number.
• Incorrect delivery address.
• Incorrect location pin.
• Missing delivery instructions.
• Customer being unavailable to receive the order.

Refund eligibility in these circumstances will depend on the circumstances of the order.`,
        },
        {
          heading: "7. Failed or Pending Payments",
          content: `Sometimes a payment may appear to have been deducted from a customer's bank account while our system has not yet received final confirmation of the payment.

In such cases, the payment status may need to be verified with the payment provider.

If the payment ultimately fails or is not successfully captured and the customer was charged, any applicable reversal or refund will be handled according to the payment provider's processing and settlement procedures.

Customers should not repeatedly place the same order while a payment is still being verified unless instructed to do so.`,
        },
        {
          heading: "8. Refund Processing",
          content: `Approved refunds will generally be processed back through the applicable payment method or according to the payment provider's available refund mechanism.

The time taken for the refunded amount to appear in the customer's bank account or payment instrument may depend on the payment provider, bank or card network.

ONN DA WAY does not control the exact time required by third-party financial institutions to complete a refund.`,
        },
        {
          heading: "9. Duplicate Payments",
          content: `If you believe you have been charged more than once for the same order, please contact us with:
• Order ID
• Payment/transaction reference
• Amount charged
• Date and time of the transactions

We will investigate the duplicate transaction and process an appropriate refund where applicable.`,
        },
        {
          heading: "10. Refund Requests",
          content: `For refund or cancellation requests, please contact:

**ONN DA WAY**
Email: nitikshpal@gmail.com
Phone: +91 8130939274

Please include your Order ID and a clear description of the issue.`,
        },
        {
          heading: "11. Policy Changes",
          content: `We may update this Cancellation & Refund Policy from time to time.

The latest version will be published on this page.`,
        },
      ]}
    />
  );
}
