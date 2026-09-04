import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import MenuItem from "@/models/MenuItem";
import Settings from "@/models/Settings";
import { withLogger } from "@/lib/withLogger";
import { normalizeCartLines } from "@/lib/orderLine";
import { requireAdmin } from "@/lib/adminAuth";
import type { CartItem, OrderStatus } from "@/lib/types";

const _GET = async (req: NextRequest) => {
  await dbConnect();
  const userId = req.nextUrl.searchParams.get("userId");
  const status = req.nextUrl.searchParams.get("status");
  const deliveryPersonId = req.nextUrl.searchParams.get("deliveryPersonId");

  // 🔒 SECURITY: Prevent dumping the entire database
  const isAdmin = !requireAdmin(req);
  if (!isAdmin && !userId && !deliveryPersonId) {
    return NextResponse.json({ error: "Unauthorized. Must provide userId or deliveryPersonId." }, { status: 403 });
  }

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
  const { userId, userName, userPhone, items, location, locationNotes, latitude, longitude, couponCode, scheduledTime } = body;
  // NOTE: 'total' and 'discount' from the client are intentionally ignored for security.
  // We recompute them server-side from DB prices, just like the Razorpay route.

  if (!userId || !items || !location) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const settings = await Settings.findOne();
  if (settings?.kitchenClosed) {
    return NextResponse.json({ error: `Kitchen is closed. We'll be open from ${settings.kitchenOpenTime || "soon"}.` }, { status: 403 });
  }
  if (settings?.ordersPaused) {
    return NextResponse.json({ error: "Due to heavy traffic, orders are stopped for a few minutes. Service will resume shortly." }, { status: 403 });
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

  // Check availability
  const itemIds = Object.keys(requiredStock);
  const unavailableItems = await MenuItem.find({
    _id: { $in: itemIds },
    available: false
  }).select("_id").lean();

  if (unavailableItems.length > 0) {
    return NextResponse.json(
      { error: "One or more items are currently unavailable", itemId: unavailableItems[0]._id },
      { status: 409 }
    );
  }

  // Re-compute total server-side from DB prices (never trust client-supplied total)
  const dbItemsCOD = await import("@/models/MenuItem").then(m => m.default.find({ _id: { $in: itemIds } }).lean());
  let serverSubtotal = 0;
  for (const cartItem of normalizedItems) {
    const dbItem = (dbItemsCOD as Record<string, unknown>[]).find((d: Record<string, unknown>) => (d._id as { toString(): string }).toString() === cartItem.item.id);
    if (!dbItem) continue;
    let unitPrice = dbItem.price as number;
    for (const cust of cartItem.selectedCustomizations || []) {
      for (const cat of (dbItem.customizationCategories as { name: string; options: { name: string; price: number }[] }[] || [])) {
        const opt = cat.options.find(o => o.name === cust.option && cat.name === cust.category);
        if (opt) { unitPrice += opt.price; break; }
      }
    }
    cartItem.unitPrice = unitPrice;
    serverSubtotal += unitPrice * cartItem.quantity;
  }

  const deliveryFee = settings?.deliveryFee || 0;
  let finalDiscount = 0;
  if (couponCode) {
    const Coupon = (await import("@/models/Coupon")).default;
    const dbCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
    if (dbCoupon) {
      finalDiscount = dbCoupon.type === "percentage"
        ? (serverSubtotal * dbCoupon.discount) / 100
        : dbCoupon.discount;
    }
  }
  const serverTotal = Math.max(0, serverSubtotal - finalDiscount + deliveryFee);

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
      total: serverTotal,
      couponCode: couponCode || null,
      discount: finalDiscount,
      status: "placed",
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      scheduledTime: scheduledTime || "ASAP (~15 mins)",
      deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      messages: [],
    });

    return NextResponse.json({ ...order.toObject(), id: order._id.toString() }, { status: 201 });
  } catch (error: unknown) {
    const e = error as { code?: number; keyPattern?: Record<string, unknown> };
    if (e.code === 11000 && e.keyPattern?.idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        return NextResponse.json({ ...existingOrder.toObject(), id: existingOrder._id.toString() }, { status: 200 });
      }
    }
    throw error;
  }

};

export const GET  = withLogger("GET /api/orders",  _GET);
export const POST = withLogger("POST /api/orders", _POST);

