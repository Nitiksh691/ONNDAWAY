import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Store from "@/models/Store";

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { riderId, riderName } = await req.json();

    if (!riderId) {
      return NextResponse.json({ error: "riderId is required" }, { status: 400 });
    }

    // Find first active store or default DTU
    const store = (await Store.findOne({ isActive: true }).lean()) || {
      _id: null,
      name: "DTU Main Hub",
      address: "Shahbad Daulatpur, Main Bawana Road, Rohini, Delhi",
    };

    const testOrder = await Order.create({
      userId: "9876543210",
      userName: "Rahul Sharma (Student)",
      userPhone: "9876543210",
      items: [
        {
          cartItemId: `test-item-${Date.now()}`,
          item: {
            name: "Cold Brew Latte (Vanilla)",
            price: 120,
            category: "Coffee",
          },
          quantity: 2,
          unitPrice: 120,
          lineDetails: "Large · Extra Ice",
        },
        {
          cartItemId: `test-item-2-${Date.now()}`,
          item: {
            name: "Peri Peri Fries",
            price: 99,
            category: "Munchies",
          },
          quantity: 1,
          unitPrice: 99,
          lineDetails: "Extra Spicy",
        },
      ],
      location: "Aryabhatta Hostel Gate, DTU Sector 17, Delhi",
      locationNotes: "Opposite Nescafe Kiosk, call when you reach the gate",
      latitude: 28.7505,
      longitude: 77.1180,
      total: 359,
      status: "out_for_delivery",
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      scheduledTime: "ASAP (~12 mins)",
      deliveryPersonId: riderId,
      deliveryPersonName: riderName || "Delivery Partner",
      deliveryOtp: "4589",
      storeId: store._id,
      storeName: store.name,
      storeAddress: store.address,
      messages: [
        { sender: "user", text: "Hey! Please bring extra napkins if possible." },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Sample delivery order created successfully!",
      order: {
        ...testOrder.toObject(),
        id: testOrder._id.toString(),
      },
    });
  } catch (error: any) {
    console.error("POST /api/delivery-persons/sample-order error:", error);
    return NextResponse.json({ error: "Failed to create sample order", details: error.message }, { status: 500 });
  }
}
