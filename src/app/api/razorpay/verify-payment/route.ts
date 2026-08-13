import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { withLogger } from "@/lib/withLogger";

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

  // Find the internal order
  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempotency: if already paid (maybe by webhook), return success immediately
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({
      success: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      internalOrderId: order._id.toString()
    });
  }

  // HMAC-SHA256 verification as per Razorpay docs
  const body_string = `${razorpay_order_id}|${razorpay_payment_id}`;
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body_string)
    .digest("hex");

  if (generated_signature !== razorpay_signature) {
    // Record failed verification attempt if you want, but this might just be a spoofed request
    return NextResponse.json(
      { error: "Payment verification failed: signature mismatch" },
      { status: 400 }
    );
  }

  // Update order to PAID and placed
  order.paymentStatus = "PAID";
  order.status = "placed"; // Move to kitchen queue
  
  // Record the attempt
  order.paymentAttempts.push({
    attemptId: razorpay_payment_id,
    status: "CAPTURED",
    method: "RAZORPAY",
    createdAt: new Date()
  });

  await order.save();

  return NextResponse.json({
    success: true,
    payment_id: razorpay_payment_id,
    order_id: razorpay_order_id,
    internalOrderId: order._id.toString()
  });
};

export const POST = withLogger("POST /api/razorpay/verify-payment", _POST);
