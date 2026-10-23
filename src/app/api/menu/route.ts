import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import { appCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { withLogger } from "@/lib/withLogger";
import { requireAdmin } from "@/lib/adminAuth";

const _GET = async (req: NextRequest) => {
  await dbConnect();
  try {
    const showAll = req.nextUrl.searchParams.get("all") === "true";
    const storeId = req.nextUrl.searchParams.get("storeId");
    const cacheKey = storeId ? `${CACHE_KEYS.MENU}:${storeId}` : CACHE_KEYS.MENU;

    if (!showAll) {
      const cached = appCache.get<object[]>(cacheKey);
      if (cached) {
        const res = NextResponse.json(cached);
        res.headers.set("X-Cache", "HIT");
        return res;
      }
    }

    const query = showAll ? {} : { approvalStatus: { $nin: ["pending", "rejected"] } };
    const items = await MenuItem.find(query).sort({ category: 1, name: 1 }).lean();

    // If storeId is provided, merge with store-specific inventory overrides
    let storeInventoryMap = new Map<string, any>();
    if (storeId) {
      const StoreInventory = (await import("@/models/StoreInventory")).default;
      const inventories = await StoreInventory.find({ storeId }).lean();
      inventories.forEach((inv: any) => {
        storeInventoryMap.set(inv.menuItemId.toString(), inv);
      });
    }

    let mapped = items.map((i: any) => {
      const itemId = i._id.toString();
      const override = storeInventoryMap.get(itemId);

      let available = i.available;
      let price = i.price;
      let stock = i.stock;

      if (override) {
        if (override.isAvailable !== undefined) available = override.isAvailable;
        if (override.price != null) price = override.price;
        if (override.stock != null) stock = override.stock;
      }

      return {
        ...i,
        id: itemId,
        available,
        price,
        stock,
        isStoreSpecific: !!override,
      };
    });

    if (!showAll) {
      mapped = mapped.filter((i: any) => i.available === true);
      appCache.set(cacheKey, mapped, CACHE_TTL.MENU);
    }

    const res = NextResponse.json(mapped);
    res.headers.set("X-Cache", "MISS");
    return res;
  } catch (error) {
    console.error("GET /api/menu error:", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
};

const _POST = async (req: NextRequest) => {
  // 🔒 Admin-only: add new menu items
  const authError = requireAdmin(req);
  if (authError) return authError;

  await dbConnect();
  try {
    const body = await req.json();
    const { 
      name, description, price, originalPrice, image, category, 
      isPopular, isRecommended, section, isBanner, hasTallSize, 
      details, sizes, sortOrder, available, customizationCategories,
      brand, subcategory, unit, tags, badges, isDeal, world,
      isConsignment, vendorId, vendorName
    } = body;

    if (!name || !price || !category) {
      return NextResponse.json({ error: "Missing required fields (name, price, category)" }, { status: 400 });
    }

    const item = await MenuItem.create({
      name,
      description: description || "",
      price,
      originalPrice: originalPrice || null,
      image,
      category,
      world:         world          || "food",
      brand:         brand         || "",
      subcategory:   subcategory   || "",
      unit:          unit          || "",
      tags:          tags          || [],
      badges:        badges        || [],
      isDeal:        isDeal        || false,
      isPopular:     isPopular     || false,
      isRecommended: isRecommended || false,
      isBanner:      isBanner      || false,
      hasTallSize:   hasTallSize   || false,
      section:       section       || "",
      sortOrder:     sortOrder     || 0,
      available:     available !== undefined ? available : true,
      details:       details       || [],
      sizes:         sizes         || [],
      customizationCategories: customizationCategories || [],
      isConsignment: !!isConsignment,
      approvalStatus: body.approvalStatus || "approved",
      vendorId:      vendorId      || null,
      vendorName:    vendorName    || "",
      storeId:       body.storeId  || null,
    });

    // Bust cache so next GET reflects the new item across all store views
    appCache.invalidatePattern(CACHE_KEYS.MENU);

    return NextResponse.json({ ...item.toObject(), id: item._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("POST /api/menu error:", error);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
};

export const GET = async (req: NextRequest, ctx: any) => withLogger("GET /api/menu", _GET)(req, ctx);
export const POST = async (req: NextRequest, ctx: any) => withLogger("POST /api/menu", _POST)(req, ctx);

