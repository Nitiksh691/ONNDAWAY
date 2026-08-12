import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { withLogger } from "@/lib/withLogger";

const _POST = async (req: NextRequest) => {
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

  // HMAC-SHA256 verification as per Razorpay docs
  const body_string = `${razorpay_order_id}|${razorpay_payment_id}`;
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body_string)
    .digest("hex");

  if (generated_signature !== razorpay_signature) {
    return NextResponse.json(
      { error: "Payment verification failed: signature mismatch" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    payment_id: razorpay_payment_id,
    order_id: razorpay_order_id,
  });
};

export const POST = withLogger("POST /api/razorpay/verify-payment", _POST);
