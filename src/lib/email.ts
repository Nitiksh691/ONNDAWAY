import nodemailer from "nodemailer";
import Settings from "@/models/Settings";

interface OrderNotificationData {
  id?: string;
  _id?: any;
  userName?: string;
  userPhone?: string;
  items?: Array<{
    item?: { name: string; price: number };
    name?: string;
    quantity?: number;
    unitPrice?: number;
    price?: number;
    lineDetails?: string;
  }>;
  location?: string;
  locationNotes?: string;
  total?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  scheduledTime?: string;
  deliveryOtp?: string;
  createdAt?: Date | string;
}

/**
 * Format order timestamp with Day, Date, and Time
 */
function formatTiming(dateInput?: Date | string) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const dayName = d.toLocaleDateString("en-IN", { weekday: "long" });
  const dateStr = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${dayName}, ${dateStr} at ${timeStr}`;
}

/**
 * Sends a rich email notification to the admin/team whenever a new order is received.
 * Respects the toggle switch in Admin Settings.
 * Fail-safe: Any network or credential error is caught and logged, never breaking checkout.
 */
export async function sendOrderNotificationEmail(order: OrderNotificationData): Promise<void> {
  try {
    // 1. Check Settings toggle
    const settings: any = await Settings.findOne().lean();
    const isEnabled = settings?.orderEmailNotificationsEnabled !== false; // Default true
    if (!isEnabled) {
      console.log("[email] Order email notifications are disabled in Admin Settings.");
      return;
    }

    const recipientEmail = settings?.orderNotificationEmail || "onndawayy@gmail.com";
    const orderId = order.id || order._id?.toString() || "N/A";
    const shortId = orderId.slice(-6).toUpperCase();
    const timingFormatted = formatTiming(order.createdAt);

    // 2. Resolve SMTP credentials from environment
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
    const smtpPass =
      process.env.SMTP_PASS ||
      process.env.EMAIL_PASS ||
      process.env.GMAIL_APP_PASSWORD ||
      process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPass) {
      console.warn(
        `[email] Order notification ready for ${recipientEmail} (Order #${shortId}), but SMTP credentials (SMTP_USER/SMTP_PASS or GMAIL_APP_PASSWORD) are not yet configured in environment variables.`
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // 3. Build item lines table
    const items = order.items || [];
    const itemRowsHtml = items
      .map((it) => {
        const name = it.item?.name || it.name || "Item";
        const qty = it.quantity || 1;
        const price = it.unitPrice ?? it.item?.price ?? it.price ?? 0;
        const details = it.lineDetails ? `<br><small style="color: #64748B;">${it.lineDetails}</small>` : "";
        return `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0;">
              <strong>${qty}x</strong> ${name}${details}
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 700;">
              ₹${price * qty}
            </td>
          </tr>
        `;
      })
      .join("");

    const itemRowsText = items
      .map((it) => {
        const name = it.item?.name || it.name || "Item";
        const qty = it.quantity || 1;
        const price = it.unitPrice ?? it.item?.price ?? it.price ?? 0;
        const details = it.lineDetails ? ` (${it.lineDetails})` : "";
        return `• ${qty}x ${name}${details} - ₹${price * qty}`;
      })
      .join("\n");

    const subject = `🔔 New Order Received: #${shortId} (₹${order.total || 0}) - ${order.userName || "Customer"}`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; color: #0F172A;">
        <!-- Header -->
        <div style="background: #0135FB; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.5px;">ONN DA WAY</h1>
          <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px; font-weight: 600;">⚡ New Order Alert</p>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <div style="background: #F8FAFC; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #E2E8F0;">
            <div style="font-size: 13px; color: #64748B; font-weight: 700; text-transform: uppercase;">Order Number</div>
            <div style="font-size: 20px; font-weight: 900; color: #0135FB; margin-top: 2px;">#${shortId} <span style="font-size: 13px; color: #475569; font-weight: normal;">(ID: ${orderId})</span></div>
            <div style="margin-top: 8px; font-size: 14px; color: #334155;">
              📅 <strong>Timing:</strong> ${timingFormatted}
            </div>
          </div>

          <!-- Customer Details -->
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Customer & Delivery Info</h3>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Customer:</strong> ${order.userName || "N/A"}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Phone:</strong> <a href="tel:${order.userPhone}" style="color: #0135FB; text-decoration: none;">${order.userPhone || "N/A"}</a></p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Delivery Location:</strong> ${order.location || "N/A"}</p>
            ${order.locationNotes ? `<p style="margin: 4px 0; font-size: 13px; color: #64748B;"><strong>Notes:</strong> ${order.locationNotes}</p>` : ""}
            <p style="margin: 4px 0; font-size: 14px;"><strong>Payment:</strong> ${order.paymentMethod || "COD"} (${order.paymentStatus || "PENDING"})</p>
            ${order.deliveryOtp ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Delivery OTP:</strong> <span style="background: #FEF3C7; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #92400E;">${order.deliveryOtp}</span></p>` : ""}
          </div>

          <!-- Items Ordered -->
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tbody>
                ${itemRowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Total Summary -->
          <div style="background: #EFF6FF; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #BFDBFE;">
            <span style="font-size: 16px; font-weight: 800; color: #1E3A8A;">Total Amount</span>
            <span style="font-size: 22px; font-weight: 900; color: #0135FB;">₹${order.total || 0}</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #F1F5F9; padding: 14px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0;">
          Sent to <strong>${recipientEmail}</strong> • Manage email notifications anytime in Onn Da Way Admin Settings.
        </div>
      </div>
    `;

    const textContent = `
🔔 NEW ORDER RECEIVED: #${shortId}
----------------------------------------
Order ID: ${orderId}
Timing: ${timingFormatted}
Total: ₹${order.total || 0}
Payment: ${order.paymentMethod || "COD"} (${order.paymentStatus || "PENDING"})

CUSTOMER INFO:
Name: ${order.userName || "N/A"}
Phone: ${order.userPhone || "N/A"}
Location: ${order.location || "N/A"}
${order.locationNotes ? `Notes: ${order.locationNotes}\n` : ""}${order.deliveryOtp ? `Delivery OTP: ${order.deliveryOtp}\n` : ""}
ITEMS:
${itemRowsText}
----------------------------------------
Sent to ${recipientEmail} from Onn Da Way.
    `.trim();

    await transporter.sendMail({
      from: `"Onn Da Way Orders" <${smtpUser}>`,
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[email] Successfully sent order notification for #${shortId} to ${recipientEmail}`);
  } catch (err) {
    // Non-blocking catch
    console.error("[email] Error sending order notification email:", err);
  }
}

