import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import { appCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { withLogger } from "@/lib/withLogger";

const _GET = async () => {
  await dbConnect();
  try {
    // Serve from cache if available (cache key: "menu", TTL: 60s)
    const cached = appCache.get<object[]>(CACHE_KEYS.MENU);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set("X-Cache", "HIT");
      return res;
    }

    const items = await MenuItem.find({ available: true }).sort({ category: 1, name: 1 }).lean();
    const mapped = items.map((i: any) => ({ ...i, id: i._id.toString() }));

    appCache.set(CACHE_KEYS.MENU, mapped, CACHE_TTL.MENU);

    const res = NextResponse.json(mapped);
    res.headers.set("X-Cache", "MISS");
    return res;
  } catch (error) {
    console.error("GET /api/menu error:", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
};

const _POST = async (req: NextRequest) => {
  await dbConnect();
  try {
    const body = await req.json();
    const { name, description, price, originalPrice, image, category, isPopular, isRecommended, section, isBanner, customizationCategories } = body;

    if (!name || !price || !image || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await MenuItem.create({
      name,
      description: description || "",
      price,
      originalPrice: originalPrice || null,
      image,
      category,
      isPopular:     isPopular     || false,
      isRecommended: isRecommended || false,
      isBanner:      isBanner      || false,
      section:       section       || "",
      customizationCategories: customizationCategories || [],
    });

    // Bust cache so next GET reflects the new item
    appCache.invalidate(CACHE_KEYS.MENU);

    return NextResponse.json({ ...item.toObject(), id: item._id.toString() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
};

export const GET = async (req: NextRequest, ctx: any) => withLogger("GET /api/menu", _GET)(req, ctx);
export const POST = async (req: NextRequest, ctx: any) => withLogger("POST /api/menu", _POST)(req, ctx);

