import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import MenuItem from "@/models/MenuItem";
import { withLogger } from "@/lib/withLogger";
import { normalizeCartLines } from "@/lib/orderLine";
import type { CartItem, OrderStatus } from "@/lib/types";

const _GET = async (req: NextRequest) => {
  await dbConnect();
  const userId = req.nextUrl.searchParams.get("userId");
  const status = req.nextUrl.searchParams.get("status");
  const deliveryPersonId = req.nextUrl.searchParams.get("deliveryPersonId");

  const filter: {
    userId?: string;
    status?: OrderStatus | { $in: OrderStatus[] };
    deliveryPersonId?: string;
  } = {};
  if (userId) filter.userId = userId;
  if (status) {
    if (status.includes(",")) {
      filter.status = { $in: status.split(",") as OrderStatus[] };
    } else {
      filter.status = status as OrderStatus;
    }
  }
  if (deliveryPersonId) filter.deliveryPersonId = deliveryPersonId;

  let query = Order.find(filter).sort({ createdAt: -1 });
  
  // Cap at 100 results for delivered/cancelled to prevent giant payloads
  // but let active statuses return all for the dashboard
  if (status === "delivered" || status === "cancelled" || !status) {
      query = query.limit(100);
  }

  const orders = await query.lean();

  // Map _id to id for frontend compatibility
  const mapped = orders.map((o: { _id: { toString: () => string } } & Record<string, unknown>) => ({ ...o, id: o._id.toString() }));
  return NextResponse.json(mapped);
};

const _POST = async (req: NextRequest) => {
  await dbConnect();

  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (idempotencyKey) {
    const existingOrder = await Order.findOne({ idempotencyKey });
    if (existingOrder) {
      return NextResponse.json({ ...existingOrder.toObject(), id: existingOrder._id.toString() }, { status: 200 });
    }
  }

  const body = await req.json();
  const { userId, userName, userPhone, items, location, locationNotes, latitude, longitude, total, couponCode, discount, status, scheduledTime } = body;

  if (!userId || !items || !location) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const normalizedItems = normalizeCartLines(items as CartItem[]);

  // Aggregate required quantities by item ID
  const requiredStock: Record<string, number> = {};
  for (const item of normalizedItems) {
    const id = item.item.id;
    if (id) {
      requiredStock[id] = (requiredStock[id] || 0) + item.quantity;
    }
  }

  // Atomic stock decrement
  const successfullyDecremented: { id: string; qty: number }[] = [];
  let outOfStockItemId = null;

  for (const [id, qty] of Object.entries(requiredStock)) {
    const updated = await MenuItem.findOneAndUpdate(
      { _id: id, stock: { $gte: qty }, available: true },
      { $inc: { stock: -qty } },
      { new: true }
    );

    if (!updated) {
      outOfStockItemId = id;
      break; // Stop processing and rollback
    } else {
      successfullyDecremented.push({ id, qty });
    }
  }

  // Rollback if any item failed
  if (outOfStockItemId) {
    for (const { id, qty } of successfullyDecremented) {
      await MenuItem.updateOne({ _id: id }, { $inc: { stock: qty } });
    }
    return NextResponse.json({ error: "One or more items are out of stock or unavailable", itemId: outOfStockItemId }, { status: 409 });
  }

  try {
    const order = await Order.create({
      idempotencyKey: idempotencyKey || undefined,
      userId,
      userName: userName || "Customer",
      userPhone: userPhone || "",
      items: normalizedItems,
      location,
      locationNotes: locationNotes || "",
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      total: total || 0,
      couponCode: couponCode || null,
      discount: discount || 0,
      status: status || "placed",
      scheduledTime: scheduledTime || "ASAP (~15 mins)",
      deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      messages: [],
    });

    return NextResponse.json({ ...order.toObject(), id: order._id.toString() }, { status: 201 });
  } catch (error: any) {
    // Check for E11000 duplicate key error on idempotencyKey
    if (error.code === 11000 && error.keyPattern && error.keyPattern.idempotencyKey) {
      // Rollback stock because another concurrent request already handled this order
      for (const { id, qty } of successfullyDecremented) {
        await MenuItem.updateOne({ _id: id }, { $inc: { stock: qty } });
      }
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        return NextResponse.json({ ...existingOrder.toObject(), id: existingOrder._id.toString() }, { status: 200 });
      }
    }
    
    // For other errors, we should theoretically rollback stock as well
    for (const { id, qty } of successfullyDecremented) {
      await MenuItem.updateOne({ _id: id }, { $inc: { stock: qty } });
    }
    throw error;
  }
};

export const GET  = withLogger("GET /api/orders",  _GET);
export const POST = withLogger("POST /api/orders", _POST);

