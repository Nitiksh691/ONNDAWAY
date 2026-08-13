import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Terms & Conditions — ONN DA WAY",
  description: "Read the Terms & Conditions for using ONN DA WAY food and beverage ordering service.",
};

export default function TermsPage() {
  return (
    <PolicyLayout
      title="Terms & Conditions"
      lastUpdated="August 13, 2026"
      sections={[
        {
          heading: "1. About ONN DA WAY",
          content: `ONN DA WAY is a food and beverage ordering service providing freshly prepared beverages and food products for delivery within our available service area.

Our website allows customers to browse available products, place orders, provide delivery information and make payments through available payment methods.

**Business Name:** ONN DA WAY
**Email:** nitikshpal@gmail.com
**Phone:** +91 8130939274
**Service Area:** Rohini, Delhi`,
        },
        {
          heading: "2. Eligibility",
          content: `You must provide accurate and complete information when placing an order.

If you are placing an order on behalf of another person, you confirm that you are authorized to provide the recipient's information for delivery purposes.`,
        },
        {
          heading: "3. Products and Menu",
          content: `We make reasonable efforts to ensure that product names, descriptions, images and prices displayed on our website are accurate.

However:
• Product images may differ slightly from the actual product.
• Product availability may change without prior notice.
• Ingredients and preparation may vary where reasonably necessary.
• Prices and promotional offers may change from time to time.
• An item may become unavailable after an order has been placed.

If an ordered item becomes unavailable, we may contact you regarding an alternative or cancellation/refund where applicable.`,
        },
        {
          heading: "4. Placing an Order",
          content: `When you place an order through our website, you are submitting a request to purchase the selected products.

An order is considered confirmed when our system successfully records the order and, where applicable, payment has been successfully processed.

We reserve the right to reject or cancel an order in exceptional circumstances, including:
• Product unavailability.
• Incorrect pricing caused by a technical or human error.
• Suspected fraudulent or abusive activity.
• Delivery being unavailable in the requested location.
• Technical problems affecting the ordering system.
• Circumstances that prevent us from safely preparing or delivering the order.

If we cancel an order after payment has been successfully received, any eligible refund will be processed according to our Cancellation & Refund Policy.`,
        },
        {
          heading: "5. Customer Information",
          content: `You are responsible for providing accurate information, including:
• Name
• Phone number
• Email address, where required
• Delivery address or location
• Order information

ONN DA WAY is not responsible for delivery problems caused by incorrect or incomplete information provided by the customer.`,
        },
        {
          heading: "6. Pricing and Payments",
          content: `All prices displayed on the website are in Indian Rupees (INR), unless otherwise stated.

Applicable delivery charges, taxes or other charges, if any, will be displayed before the order is submitted for payment.

Payments may be processed through third-party payment providers, including Razorpay.

We do not intentionally store your complete card, UPI PIN or other sensitive payment credentials on our own servers.

A payment being initiated does not necessarily mean that an order has been successfully confirmed. Payment status is subject to verification with the relevant payment provider.`,
        },
        {
          heading: "7. Delivery",
          content: `We deliver only within our available delivery/service area.

Estimated delivery times are provided for guidance and may vary due to:
• Order volume
• Food and beverage preparation time
• Traffic
• Weather
• Delivery availability
• Incorrect or incomplete customer information
• Events or circumstances outside our reasonable control

Please refer to our Delivery Policy for additional information.`,
        },
        {
          heading: "8. Food and Beverage Products",
          content: `Our products are prepared for immediate consumption.

Customers should consume food and beverages within a reasonable period after delivery and follow any storage or handling instructions provided with the product.

Customers should inform us of relevant allergies or dietary requirements before ordering. We cannot guarantee that products are completely free from allergens or cross-contact unless specifically stated.

If you have a serious food allergy or medical dietary restriction, please contact us before placing an order.`,
        },
        {
          heading: "9. Order Cancellation and Refunds",
          content: `Cancellation and refund requests are handled according to our Cancellation & Refund Policy.

Because our products may be freshly prepared after an order is received, cancellation may not be possible once preparation has started.`,
        },
        {
          heading: "10. Promotional Offers",
          content: `Promotional offers, discounts and coupon codes may be subject to additional conditions.

Unless explicitly stated:
• Offers cannot be exchanged for cash.
• Offers may have expiry dates.
• Certain offers may be limited to specific products or customers.
• Multiple offers may not necessarily be combined.
• We reserve the right to withdraw or modify an offer where reasonably necessary.

Any specific terms displayed with an offer will take precedence over this general section.`,
        },
        {
          heading: "11. Prohibited Use",
          content: `You must not:
• Use the website for fraudulent purposes.
• Place intentionally fraudulent or abusive orders.
• Attempt unauthorized access to our website, systems or accounts.
• Interfere with the operation or security of the website.
• Submit false or misleading information.
• Use payment methods without authorization.
• Attempt to exploit technical errors or pricing errors.

We may cancel orders and take appropriate action where fraudulent or abusive activity is reasonably suspected.`,
        },
        {
          heading: "12. Intellectual Property",
          content: `The ONN DA WAY name, logo, branding, website design, text, graphics, photographs and other original content are owned by or licensed to ONN DA WAY unless otherwise stated.

You may not reproduce, modify, distribute or commercially exploit our content without prior written permission.`,
        },
        {
          heading: "13. Third-Party Services",
          content: `Our website may use third-party services for payment processing, hosting, analytics, communications, maps, delivery support or other technical functions.

Those services may have their own terms and privacy policies.`,
        },
        {
          heading: "14. Limitation of Liability",
          content: `To the extent permitted by applicable law, ONN DA WAY will not be responsible for indirect, incidental or consequential losses arising from the use of our website or services.

Nothing in these Terms is intended to exclude or limit any liability that cannot legally be excluded or limited under applicable law.`,
        },
        {
          heading: "15. Changes to These Terms",
          content: `We may update these Terms & Conditions from time to time.

The updated version will be published on this page with a revised "Last Updated" date.

Your continued use of the website after changes are published constitutes acceptance of the updated terms.`,
        },
        {
          heading: "16. Governing Law",
          content: `These Terms & Conditions are governed by the laws applicable in India.

Any dispute will be subject to the jurisdiction of the courts having appropriate jurisdiction over the applicable location of the business, subject to applicable law.`,
        },
        {
          heading: "17. Contact Us",
          content: `If you have questions regarding these Terms & Conditions, please contact:

**ONN DA WAY**
Email: nitikshpal@gmail.com
Phone: +91 8130939274
Address: Rohini, Delhi`,
        },
      ]}
    />
  );
}
