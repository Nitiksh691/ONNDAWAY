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
  const { userId, userName, userPhone, items, location, locationNotes, latitude, longitude, couponCode, scheduledTime, storeId } = body;
  // NOTE: 'total' and 'discount' from the client are intentionally ignored for security.
  // We recompute them server-side from DB prices, just like the Razorpay route.

  if (!userId || !items || !location) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Multi-Store Serviceability Engine Check
  const { checkServiceability } = await import("@/lib/serviceability");
  const serviceResult = await checkServiceability({
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    areaName: location,
    storeId: storeId || null,
  });

  if (!serviceResult.isServiceable || !serviceResult.store) {
    return NextResponse.json(
      { error: serviceResult.message || "Your delivery location is not currently serviceable by any open store." },
      { status: 400 }
    );
  }

  const assignedStore = serviceResult.store;

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

  const itemIds = Object.keys(requiredStock);

  // Check store-specific inventory overrides first
  const StoreInventory = (await import("@/models/StoreInventory")).default;
  const storeInventories = await StoreInventory.find({
    storeId: assignedStore.id,
    menuItemId: { $in: itemIds },
  }).lean();

  const storeInvMap = new Map<string, any>();
  storeInventories.forEach((inv: any) => {
    storeInvMap.set(inv.menuItemId.toString(), inv);
  });

  // Check if any item is explicitly marked unavailable or out of stock at this store
  for (const id of itemIds) {
    const inv = storeInvMap.get(id);
    if (inv) {
      if (inv.isAvailable === false) {
        return NextResponse.json(
          { error: `An item in your cart is currently out of stock at ${assignedStore.name}`, itemId: id },
          { status: 409 }
        );
      }
      if (inv.stock != null && inv.stock - (inv.reservedStock || 0) < requiredStock[id]) {
        return NextResponse.json(
          { error: `Insufficient stock available at ${assignedStore.name}`, itemId: id },
          { status: 409 }
        );
      }
    }
  }

  // Base catalog lookup & availability check in a single DB query
  const dbItemsCOD = await MenuItem.find({ _id: { $in: itemIds } }).lean();
  const unavailableItem = (dbItemsCOD as any[]).find(i => !i.available);
  if (unavailableItem) {
    return NextResponse.json(
      { error: "One or more items are currently unavailable", itemId: unavailableItem._id },
      { status: 409 }
    );
  }

  let serverSubtotal = 0;
  let grocerySubtotal = 0;
  let hasGroceryItems = false;
  let hasCoffeeOrMojito = false;

  for (const cartItem of normalizedItems) {
    const dbItem = (dbItemsCOD as Record<string, unknown>[]).find((d: Record<string, unknown>) => (d._id as { toString(): string }).toString() === cartItem.item.id);
    if (!dbItem) continue;

    // Attach vendor & consignment information
    if (dbItem.vendorId) {
      const vId = (dbItem.vendorId as { toString(): string }).toString();
      cartItem.vendorId = vId;
      cartItem.item.vendorId = vId;
      cartItem.item.vendorName = (dbItem.vendorName as string) || "";
      cartItem.item.isConsignment = !!dbItem.isConsignment;
    }

    let unitPrice = dbItem.price as number;
    for (const cust of cartItem.selectedCustomizations || []) {
      for (const cat of (dbItem.customizationCategories as { name: string; options: { name: string; price: number }[] }[] || [])) {
        const opt = cat.options.find(o => o.name === cust.option && cat.name === cust.category);
        if (opt) { unitPrice += opt.price; break; }
      }
    }
    cartItem.unitPrice = unitPrice;
    const lineTotal = unitPrice * cartItem.quantity;
    serverSubtotal += lineTotal;

    // Check if item is grocery/munchies (exempt: coffee and mojito)
    const cat = ((dbItem.category as string) || "").toLowerCase();
    const itemName = ((dbItem.name as string) || "").toLowerCase();
    const isExempt = cat.includes("coffee") || cat.includes("mojito") || itemName.includes("coffee") || itemName.includes("mojito");
    if (isExempt) {
      hasCoffeeOrMojito = true;
    } else {
      hasGroceryItems = true;
      grocerySubtotal += lineTotal;
    }
  }

  // Enforce minimum overall order value if configured
  const minOrder = settings?.minOrderValue || 0;
  if (minOrder > 0 && serverSubtotal < minOrder) {
    return NextResponse.json(
      { error: `Minimum order amount for delivery is ₹${minOrder}. Please add ₹${(minOrder - serverSubtotal).toFixed(0)} more to place your order.` },
      { status: 400 }
    );
  }

  // Enforce minimum grocery order value if configured
  const minGrocery = settings?.minGroceryOrderValue || 0;
  if (minGrocery > 0 && hasGroceryItems && !hasCoffeeOrMojito && grocerySubtotal < minGrocery) {
    return NextResponse.json(
      { error: `Minimum order value for grocery items is ₹${minGrocery}. Add ₹${(minGrocery - grocerySubtotal).toFixed(0)} more groceries to place your order.` },
      { status: 400 }
    );
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
      storeId: assignedStore.id,
      storeName: assignedStore.name,
      storeAddress: assignedStore.address,
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

