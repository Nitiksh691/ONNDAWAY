import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import StoreInventory from "@/models/StoreInventory";
import { appCache, CACHE_KEYS } from "@/lib/cache";

export async function GET(req: NextRequest) {
  await dbConnect();
  const storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) {
    return NextResponse.json({ error: "storeId is required" }, { status: 400 });
  }

  try {
    const items = await MenuItem.find({ approvalStatus: { $ne: "rejected" } })
      .sort({ category: 1, name: 1 })
      .lean();

    const inventories = await StoreInventory.find({ storeId }).lean();
    const invMap = new Map<string, any>();
    inventories.forEach((inv: any) => {
      invMap.set(inv.menuItemId.toString(), inv);
    });

    const result = items.map((i: any) => {
      const id = i._id.toString();
      const override = invMap.get(id);

      return {
        id,
        name: i.name,
        category: i.category,
        image: i.image,
        basePrice: i.price,
        baseAvailable: i.available,
        baseStock: i.stock,
        // Override fields
        isAvailable: override ? override.isAvailable : i.available,
        storePrice: override && override.price != null ? override.price : i.price,
        storeStock: override && override.stock != null ? override.stock : i.stock,
        hasOverride: !!override,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/store-portal/inventory error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { storeId, menuItemId, isAvailable, price, stock } = await req.json();

    if (!storeId || !menuItemId) {
      return NextResponse.json({ error: "storeId and menuItemId are required" }, { status: 400 });
    }

    const update: any = {};
    if (isAvailable !== undefined) update.isAvailable = !!isAvailable;
    if (price !== undefined) update.price = price === "" || price == null ? null : Number(price);
    if (stock !== undefined) update.stock = stock === "" || stock == null ? null : Number(stock);

    const record = await StoreInventory.findOneAndUpdate(
      { storeId, menuItemId },
      { $set: update },
      { new: true, upsert: true }
    );

    // Invalidate menu cache for this store
    appCache.invalidatePattern(`${CACHE_KEYS.MENU}:${storeId}`);
    appCache.invalidate(CACHE_KEYS.MENU);

    return NextResponse.json({ success: true, inventory: record });
  } catch (error: any) {
    console.error("POST /api/store-portal/inventory error:", error);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
