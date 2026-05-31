import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await dbConnect();
  
  try {
    const params = await props.params;
    const body = await req.json();
    const { status, deliveryPersonId, deliveryPersonName, confirmed, otp } = body;

    if (status === "delivered") {
      const currentOrder = await Order.findById(params.id).lean();
      if (!currentOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      if (currentOrder.deliveryOtp && currentOrder.deliveryOtp !== otp) {
        return NextResponse.json({ error: "Invalid Delivery OTP" }, { status: 400 });
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (confirmed !== undefined) updateData.confirmed = confirmed;
    if (deliveryPersonId !== undefined) updateData.deliveryPersonId = deliveryPersonId;
    if (deliveryPersonName !== undefined) updateData.deliveryPersonName = deliveryPersonName;

    const order = await Order.findByIdAndUpdate(params.id, updateData, { new: true }).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Trigger WhatsApp thank you message if status changed to delivered
    if (status === "delivered" && order.userPhone) {
      const { sendWhatsAppMessage } = await import("@/lib/whatsapp");
      const message = `Thank you for ordering from Onn Da Way Coffee ☕ We hope you enjoyed your order. Visit again soon!`;
      // Run asynchronously without blocking the response
      sendWhatsAppMessage(order.userPhone, message).catch(console.error);
    }

    return NextResponse.json({ ...order, id: (order as any)._id.toString() });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const params = await props.params;
    const order = await Order.findById(params.id).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ ...(order as any), id: (order as any)._id.toString() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
