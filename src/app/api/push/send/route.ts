import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { sendPushNotification } from "@/lib/push";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, title, message, url } = body;

    if (!orderId || !title || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();

    const order = (await Order.findById(orderId).lean()) as any;
    if (!order || !order.pushSubscription) {
      return NextResponse.json(
        { error: "No subscription found for this order" },
        { status: 404 }
      );
    }

    const success = await sendPushNotification(order.pushSubscription, {
      title,
      message,
      url: url || `/track/${orderId}`,
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Failed to send notification" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("Push send API error:", err);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
