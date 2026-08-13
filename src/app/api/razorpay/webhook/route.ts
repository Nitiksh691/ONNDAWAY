import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import WebhookEvent from "@/models/WebhookEvent";
import { withLogger } from "@/lib/withLogger";

const _POST = async (req: NextRequest) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  await dbConnect();

  console.log(`[WEBHOOK_RECEIVED] Processing webhook event`);

  // Razorpay explicitly requires raw body for verification
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const eventId = req.headers.get("x-razorpay-event-id");

  if (!signature || !eventId) {
    console.error(`[WEBHOOK_FAILED] Missing signature or event ID`);
    return NextResponse.json({ error: "Missing signature or event ID" }, { status: 400 });
  }

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.error(`[WEBHOOK_FAILED] Invalid signature for event ${eventId}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Parse body ONLY AFTER signature verification
  const body = JSON.parse(rawBody);
  const eventType = body.event;
  const paymentEntity = body.payload?.payment?.entity;
  const orderEntity = body.payload?.order?.entity;

  const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
  const paymentId = paymentEntity?.id;

  if (!razorpayOrderId) {
    console.error(`[WEBHOOK_FAILED] No order ID in payload for event ${eventId}`);
    return NextResponse.json({ error: "No order ID in payload" }, { status: 400 });
  }

  // Idempotency check via WebhookEvent
  try {
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      console.log(`[WEBHOOK_DUPLICATE] Event ${eventId} already processed`);
      return NextResponse.json({ success: true, message: "Already processed" }, { status: 200 });
    }
  } catch (error) {
    console.error(`[WEBHOOK_ERROR] DB Error checking idempotency for ${eventId}`, error);
    return NextResponse.json({ error: "DB Error" }, { status: 500 });
  }

  // Retrieve Order
  const order = await Order.findOne({ razorpayOrderId });
  if (!order) {
    console.error(`[WEBHOOK_FAILED] Internal order not found for ${razorpayOrderId}`);
    return NextResponse.json({ error: "Internal order not found" }, { status: 404 });
  }

  // Handle Event
  if (eventType === "payment.captured" || eventType === "order.paid") {
    // Only update if not already paid
    if (order.paymentStatus !== "PAID") {
      
      const receivedAmount = paymentEntity?.amount || orderEntity?.amount;
      const receivedCurrency = paymentEntity?.currency || orderEntity?.currency;
      const expectedAmount = Math.round(order.total * 100);
      
      if (receivedAmount !== expectedAmount) {
         console.error(`[PAYMENT_AMOUNT_MISMATCH] Webhook amount mismatch for order ${order._id}: expected ${expectedAmount}, received ${receivedAmount}`);
         // Return 200 to acknowledge the webhook, but DO NOT mark as PAID
         return NextResponse.json({ success: true, message: "Amount mismatch, flagged" }, { status: 200 });
      }

      if (receivedCurrency !== "INR") {
         console.error(`[WEBHOOK_FAILED] Currency mismatch. Expected INR, got ${receivedCurrency}`);
         return NextResponse.json({ success: true, message: "Currency mismatch, flagged" }, { status: 200 });
      }

      console.log(`[WEBHOOK_PAYMENT_CAPTURED] Payment captured for order ${order._id}`);
      
      order.paymentStatus = "PAID";
      // Atomic state transition protection
      if (order.status === "payment_pending") {
        order.status = "placed";
      }
      
      order.paymentAttempts.push({
        attemptId: paymentId || "unknown",
        status: "CAPTURED",
        method: "RAZORPAY",
        createdAt: new Date()
      });

      await order.save();
    }
  } else if (eventType === "payment.failed") {
    // Only record the attempt, do NOT change paymentStatus if it's already PAID
    if (order.paymentStatus !== "PAID") {
       console.log(`[WEBHOOK_PAYMENT_FAILED] Payment failed for order ${order._id}`);
       order.paymentAttempts.push({
          attemptId: paymentId || "unknown",
          status: "FAILED",
          method: "RAZORPAY",
          createdAt: new Date()
       });
       await order.save();
    }
  }

  // Save the Webhook Event to prevent duplicate processing
  await WebhookEvent.create({
    eventId,
    eventType,
    orderId: order._id.toString()
  });

  return NextResponse.json({ success: true });
};

export const POST = withLogger("POST /api/razorpay/webhook", _POST);
