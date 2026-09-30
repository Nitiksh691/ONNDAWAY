import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";

// Store push subscriptions in User model (we'll use a simple map in MongoDB for now)
// We store subscriptions per user in a lightweight way using a separate model

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, orderId, subscription } = body;

    if (!userId || !orderId || !subscription) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();

    // Store subscription on the order document for targeted delivery
    await Order.findByIdAndUpdate(orderId, {
      $set: { pushSubscription: JSON.stringify(subscription) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}
