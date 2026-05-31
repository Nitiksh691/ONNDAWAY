import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await dbConnect();
  
  try {
    const params = await props.params;
    const body = await req.json();
    const { sender, text } = body;

    if (!sender || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(
      params.id,
      { $push: { messages: { sender, text, timestamp: new Date() } } },
      { new: true }
    ).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, messages: order.messages }, { status: 201 });
  } catch (error) {
    console.error("Error adding message:", error);
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 });
  }
}
