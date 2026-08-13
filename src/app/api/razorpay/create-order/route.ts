import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import MenuItem from "@/models/MenuItem";
import Settings from "@/models/Settings";
import { normalizeCartLines } from "@/lib/orderLine";
import type { CartItem } from "@/lib/types";
import { withLogger } from "@/lib/withLogger";

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

const _POST = async (req: NextRequest) => {
  await dbConnect();

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: "Razorpay credentials not configured" },
      { status: 500 }
    );
  }

  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (idempotencyKey) {
    const existingOrder = await Order.findOne({ idempotencyKey, paymentMethod: "RAZORPAY" });
    if (existingOrder) {
      if (existingOrder.razorpayOrderId) {
        return NextResponse.json({
          order_id: existingOrder.razorpayOrderId,
          amount: Math.round(existingOrder.total * 100),
          currency: "INR",
          internalOrderId: existingOrder._id.toString(),
        }, { status: 200 });
      }
    }
  }

  const body = await req.json().catch(() => ({}));
  const { userId, userName, userPhone, items, location, locationNotes, latitude, longitude, couponCode, discount, scheduledTime } = body;

  if (!userId || !items || !location) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const settings = await Settings.findOne();
  if (settings?.kitchenClosed) {
    return NextResponse.json({ error: `Kitchen is closed. We'll be open from ${settings.kitchenOpenTime || "soon"}.` }, { status: 403 });
  }

  const normalizedItems = normalizeCartLines(items as CartItem[]);

  // Calculate actual total based on DB prices
  let serverTotal = 0;
  
  // Collect item IDs
  const requiredStock: Record<string, number> = {};
  for (const item of normalizedItems) {
    const id = item.item.id;
    if (id) {
      requiredStock[id] = (requiredStock[id] || 0) + item.quantity;
    }
  }

  const itemIds = Object.keys(requiredStock);
  const dbItems = await MenuItem.find({ _id: { $in: itemIds } }).lean();
  
  // Verify availability and calculate
  for (const cartItem of normalizedItems) {
    const dbItem = dbItems.find((d: any) => d._id.toString() === cartItem.item.id);
    if (!dbItem || !dbItem.available) {
      return NextResponse.json(
        { error: "One or more items are currently unavailable", itemId: cartItem.item.id },
        { status: 409 }
      );
    }

    // Calculate unit price: base price + customizations
    let unitPrice = dbItem.price;
    if (cartItem.selectedCustomizations && cartItem.selectedCustomizations.length > 0) {
       for (const cust of cartItem.selectedCustomizations) {
         unitPrice += (cust.price || 0);
       }
    }
    
    // Override cartItem with server-calculated price
    cartItem.unitPrice = unitPrice;
    cartItem.item.price = dbItem.price;
    serverTotal += unitPrice * cartItem.quantity;
  }

  // Delivery fee
  const deliveryFee = settings?.deliveryFee || 0;
  serverTotal += deliveryFee;

  // Discount
  const finalDiscount = Number(discount) || 0; // In a full implementation, you should re-verify the coupon code against DB here
  serverTotal = Math.max(0, serverTotal - finalDiscount);

  // Create internal order first
  let internalOrder;
  try {
    internalOrder = await Order.create({
      idempotencyKey: idempotencyKey || undefined,
      userId,
      userName: userName || "Customer",
      userPhone: userPhone || "",
      items: normalizedItems,
      location,
      locationNotes: locationNotes || "",
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      total: serverTotal,
      couponCode: couponCode || null,
      discount: finalDiscount,
      status: "payment_pending",
      paymentMethod: "RAZORPAY",
      paymentStatus: "PENDING",
      paymentInitializationStatus: "PENDING",
      scheduledTime: scheduledTime || "ASAP (~15 mins)",
      messages: [],
    });
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey });
      if (existing?.razorpayOrderId) {
        return NextResponse.json({
          order_id: existing.razorpayOrderId,
          amount: Math.round(existing.total * 100),
          currency: "INR",
          internalOrderId: existing._id.toString(),
        }, { status: 200 });
      }
    }
    throw error;
  }

  // Now create Razorpay Order
  const amountPaise = Math.round(serverTotal * 100);
  
  if (amountPaise < 100) {
    // Edge case: if total is 0 (100% discount), we can't use Razorpay easily, but let's assume food delivery always has a cost or we handle 0 elsewhere
    await Order.findByIdAndDelete(internalOrder._id);
    return NextResponse.json({ error: "Amount must be at least ₹1" }, { status: 400 });
  }

  try {
    const razorpayOrder = await getRazorpay().orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: internalOrder._id.toString(),
    });

    // Save Razorpay order ID to internal order
    internalOrder.razorpayOrderId = razorpayOrder.id;
    internalOrder.paymentInitializationStatus = "SUCCESS";
    await internalOrder.save();

    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      internalOrderId: internalOrder._id.toString(),
    }, { status: 201 });

  } catch (err: unknown) {
    // If Razorpay fails, keep the order but mark as FAILED init
    internalOrder.paymentInitializationStatus = "FAILED";
    await internalOrder.save();

    const message = err instanceof Error ? err.message : "Failed to create Razorpay order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export const POST = withLogger("POST /api/razorpay/create-order", _POST);
