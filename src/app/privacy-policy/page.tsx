import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — ONN DA WAY",
  description: "Learn how ONN DA WAY collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      lastUpdated="August 13, 2026"
      sections={[
        {
          heading: "1. Information We Collect",
          content: `Depending on how you use our website, we may collect the following information:

**Personal Information**
• Name
• Mobile/telephone number
• Email address
• Delivery address or location
• Account information, if you create an account

**Order Information**
We may collect information relating to your orders, including:
• Products ordered
• Order amount
• Order date and time
• Order status
• Delivery information
• Order ID
• Transaction/payment status

**Payment Information**
Payments may be processed through third-party payment providers such as Razorpay. We do not intentionally collect or store your UPI PIN, complete card number, CVV or banking password on our own servers.

**Technical Information**
When you access our website, we may automatically receive limited technical information such as:
• IP address
• Browser type
• Device type
• Operating system
• Website interaction information
• Error and diagnostic information`,
        },
        {
          heading: "2. How We Use Your Information",
          content: `We may use your information to:
• Process and deliver orders.
• Contact you regarding your order.
• Confirm payments and transaction status.
• Provide customer support.
• Handle cancellations, refunds and complaints.
• Maintain and improve our website.
• Prevent fraud and unauthorized activity.
• Maintain security.
• Comply with applicable legal requirements.
• Communicate important service-related information.

Where legally permitted and where applicable, we may also use information for promotional communications.`,
        },
        {
          heading: "3. Information Sharing",
          content: `We may share necessary information with service providers that help us operate our business.

These may include:
• Payment processors.
• Hosting and cloud service providers.
• Delivery/service providers.
• Communication providers.
• Analytics or technical service providers.
• Professional advisers where necessary.
• Government authorities or law-enforcement agencies where legally required.

We only intend to share information that is reasonably necessary for the relevant purpose.`,
        },
        {
          heading: "4. Payment Processing",
          content: `Payments made through our website may be processed by third-party payment providers.

For example, Razorpay may process payment information when you select a payment method supported through Razorpay.

Your payment information may therefore be subject to the payment provider's own terms and privacy policy.`,
        },
        {
          heading: "5. Cookies and Similar Technologies",
          content: `Our website may use cookies, local storage or similar technologies to:
• Keep you logged in.
• Maintain shopping/order functionality.
• Remember preferences.
• Improve website performance.
• Understand website usage.
• Maintain security.

You may be able to control cookies through your browser settings. Disabling certain technologies may affect website functionality.`,
        },
        {
          heading: "6. Data Security",
          content: `We take reasonable technical and organizational measures to protect information against unauthorized access, alteration, disclosure or destruction.

However, no internet-based service can guarantee absolute security.

You should also protect your account credentials and avoid sharing passwords or authentication information with others.`,
        },
        {
          heading: "7. Data Retention",
          content: `We retain information for as long as reasonably necessary for the purposes described in this Privacy Policy, including order processing, customer support, accounting, dispute resolution, fraud prevention and legal or regulatory requirements.

When information is no longer reasonably required, it may be deleted, anonymized or securely disposed of, subject to applicable legal obligations.`,
        },
        {
          heading: "8. Your Choices and Rights",
          content: `Depending on applicable law, you may have rights relating to your personal information, including requesting access, correction or deletion of certain information.

You may contact us to make a privacy-related request.

We may need to verify your identity before processing certain requests.`,
        },
        {
          heading: "9. Children's Privacy",
          content: `Our website is not specifically directed toward children.

We do not knowingly seek to collect personal information from children in violation of applicable law.

If you believe that a child has provided personal information to us improperly, please contact us.`,
        },
        {
          heading: "10. Third-Party Websites and Services",
          content: `Our website may contain links or integrations to third-party services.

We are not responsible for the privacy practices of third-party websites or services.

We recommend reviewing their respective privacy policies before providing information to them.`,
        },
        {
          heading: "11. Changes to This Privacy Policy",
          content: `We may update this Privacy Policy when our services, technology or legal requirements change.

The latest version will be published on this page with the updated date.`,
        },
        {
          heading: "12. Contact Us",
          content: `For privacy-related questions, requests or concerns:

**ONN DA WAY**
Email: nitikshpal@gmail.com
Phone: +91 8130939274
Address: Rohini, Delhi`,
        },
      ]}
    />
  );
}
