import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Delivery Policy — ONN DA WAY",
  description: "Learn about ONN DA WAY's delivery area, timings, charges, and handling of delivery issues.",
};

export default function DeliveryPolicyPage() {
  return (
    <PolicyLayout
      title="Delivery Policy"
      lastUpdated="August 13, 2026"
      sections={[
        {
          heading: "1. Delivery Area",
          content: `ONN DA WAY currently provides delivery only within our available service area.

Before placing an order, customers should confirm that their delivery location is within the available service area.

We may expand or change our delivery area from time to time.`,
        },
        {
          heading: "2. Delivery Address",
          content: `Customers are responsible for providing an accurate and complete delivery location.

Please provide:
• Correct address/location
• Building or establishment name, where applicable
• Floor/unit information, where applicable
• Contact number
• Any useful delivery instructions

If the information provided is incorrect or incomplete, delivery may be delayed or may not be possible.`,
        },
        {
          heading: "3. Delivery Time",
          content: `We provide estimated delivery times based on the circumstances at the time of ordering.

Delivery time may be affected by:
• Preparation time
• Number of orders
• Traffic
• Weather
• Delivery availability
• Customer availability
• Incorrect address information
• Technical issues
• Events outside our reasonable control

Therefore, delivery estimates are not guaranteed unless expressly stated otherwise.`,
        },
        {
          heading: "4. Customer Availability",
          content: `Customers should remain available at the provided contact number and delivery location around the expected delivery time.

If our delivery personnel cannot reach the customer after reasonable attempts, the order may be delayed, returned or cancelled depending on the circumstances.

Any refund in such circumstances will be handled according to our Cancellation & Refund Policy.`,
        },
        {
          heading: "5. Delivery Charges",
          content: `Any applicable delivery charges will be displayed during the ordering process before payment.

Delivery charges may vary depending on the delivery location, distance, promotional offers or other applicable conditions.`,
        },
        {
          heading: "6. Food and Beverage Handling",
          content: `Our food and beverages are prepared for delivery and should ideally be consumed soon after receiving the order.

Customers should follow any handling, storage or consumption instructions provided with the product.

Because temperature, handling and travel conditions can affect food and beverages after they leave our control, customers should avoid unnecessary delays in receiving their order.`,
        },
        {
          heading: "7. Missing or Incorrect Items",
          content: `If an item is missing or you receive an incorrect item, please contact us as soon as reasonably possible after delivery.

Please provide:
• Order ID
• Customer name
• Contact number
• Description of the issue
• Photographs where useful

We will review the issue and, where appropriate, provide a replacement, refund or another suitable resolution.`,
        },
        {
          heading: "8. Damaged or Spilled Orders",
          content: `If a beverage is significantly spilled or an item arrives damaged, please contact us promptly after delivery.

Where appropriate, we may request photographs or other information to verify the issue.

After reviewing the circumstances, we may provide a replacement, refund or another appropriate resolution.`,
        },
        {
          heading: "9. Delivery Delays",
          content: `We will make reasonable efforts to deliver orders within the estimated delivery period.

However, delays can occur because of traffic, weather, unusually high order volume, technical problems, delivery availability or other circumstances outside our reasonable control.

A delay does not automatically qualify for a refund unless the circumstances meet the conditions of our Cancellation & Refund Policy or applicable law.`,
        },
        {
          heading: "10. Contact",
          content: `For delivery-related questions or problems:

**ONN DA WAY**
Email: nitikshpal@gmail.com
Phone: +91 8130939274

When contacting us about an order, please provide your Order ID.`,
        },
      ]}
    />
  );
}
