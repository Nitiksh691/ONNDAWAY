import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { withLogger } from "@/lib/withLogger";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const _POST = async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { amount, currency = "INR", receipt } = body as {
    amount?: number;
    currency?: string;
    receipt?: string;
  };

  if (!amount || typeof amount !== "number" || amount < 100) {
    return NextResponse.json(
      { error: "Amount must be a number ≥ 100 paise (₹1)" },
      { status: 400 }
    );
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: "Razorpay credentials not configured" },
      { status: 401 }
    );
  }

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt ?? `rcpt_${Date.now()}`,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create Razorpay order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export const POST = withLogger("POST /api/razorpay/create-order", _POST);
