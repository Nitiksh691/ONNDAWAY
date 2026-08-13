import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Razorpay from "razorpay";
import { withLogger } from "@/lib/withLogger";

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

const _POST = async (req: NextRequest) => {
  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    body as {
      razorpay_payment_id?: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
    };

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return NextResponse.json(
      { error: "Missing required fields: razorpay_payment_id, razorpay_order_id, razorpay_signature" },
      { status: 400 }
    );
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: "Razorpay secret not configured" },
      { status: 500 }
    );
  }

  console.log(`[PAYMENT_VERIFY_STARTED] Received: ${razorpay_payment_id} for order: ${razorpay_order_id}`);

  // 1. Signature Verification FIRST
  const body_string = `${razorpay_order_id}|${razorpay_payment_id}`;
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body_string)
    .digest("hex");

  if (generated_signature !== razorpay_signature) {
    console.error(`[PAYMENT_VERIFY_FAILED] Signature mismatch for ${razorpay_payment_id}`);
    return NextResponse.json(
      { error: "Payment verification failed: signature mismatch" },
      { status: 400 }
    );
  }

  console.log(`[PAYMENT_SIGNATURE_VALID] Signature valid for ${razorpay_payment_id}`);

  // 2. Fetch internal order
  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) {
    console.error(`[PAYMENT_VERIFY_FAILED] Internal order not found for ${razorpay_order_id}`);
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempotency: if already paid (maybe by webhook), return success immediately
  if (order.paymentStatus === "PAID") {
    console.log(`[PAYMENT_VERIFY_IDEMPOTENT] Order already paid: ${order._id}`);
    return NextResponse.json({
      success: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      internalOrderId: order._id.toString()
    });
  }

  // 3. Fetch payment from Razorpay Server-Side
  let paymentDetails;
  try {
    paymentDetails = await getRazorpay().payments.fetch(razorpay_payment_id);
  } catch (error) {
    console.error(`[PAYMENT_VERIFY_FAILED] Could not fetch payment details from Razorpay:`, error);
    return NextResponse.json({ error: "Could not fetch payment from provider" }, { status: 500 });
  }

  // 4. Strict Validations
  console.log(`[PAYMENT_STATUS_CHECKED] Razorpay payment status: ${paymentDetails.status}`);
  
  if (paymentDetails.order_id !== razorpay_order_id) {
    console.error(`[PAYMENT_VERIFY_FAILED] order_id mismatch. Expected ${razorpay_order_id}, got ${paymentDetails.order_id}`);
    return NextResponse.json({ error: "Order ID mismatch" }, { status: 400 });
  }

  const expectedAmount = Math.round(order.total * 100);
  if (paymentDetails.amount !== expectedAmount) {
    console.error(`[PAYMENT_AMOUNT_MISMATCH] Expected ${expectedAmount}, got ${paymentDetails.amount}`);
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  if (paymentDetails.currency !== "INR") {
    console.error(`[PAYMENT_VERIFY_FAILED] Currency mismatch. Expected INR, got ${paymentDetails.currency}`);
    return NextResponse.json({ error: "Currency mismatch" }, { status: 400 });
  }

  if (paymentDetails.status !== "captured") {
    console.error(`[PAYMENT_VERIFY_FAILED] Payment not captured. Status: ${paymentDetails.status}`);
    return NextResponse.json({ error: "Payment not captured" }, { status: 400 });
  }

  console.log(`[PAYMENT_CAPTURED] Payment ${razorpay_payment_id} successfully captured for order ${order._id}`);

  // 5. Atomic State Transition
  order.paymentStatus = "PAID";
  // Only transition to 'placed' if it's currently 'payment_pending'. Don't overwrite cancelled/delivered.
  if (order.status === "payment_pending") {
    order.status = "placed";
  }
  
  order.paymentAttempts.push({
    attemptId: razorpay_payment_id,
    status: "CAPTURED",
    method: "RAZORPAY",
    createdAt: new Date()
  });

  await order.save();
  console.log(`[PAYMENT_VERIFY_SUCCESS] Order ${order._id} successfully marked as PAID`);

  return NextResponse.json({
    success: true,
    payment_id: razorpay_payment_id,
    order_id: razorpay_order_id,
    internalOrderId: order._id.toString()
  });
};

export const POST = withLogger("POST /api/razorpay/verify-payment", _POST);
