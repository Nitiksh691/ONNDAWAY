import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { appCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { withLogger } from "@/lib/withLogger";

const _GET = async () => {
  await dbConnect();
  try {
    const cached = appCache.get<object>(CACHE_KEYS.SETTINGS);
    if (cached) return NextResponse.json(cached);

    let settings = await Settings.findOne().lean();
    if (!settings) {
      settings = await Settings.create({ deliveryFee: 20 });
    }
    appCache.set(CACHE_KEYS.SETTINGS, settings, CACHE_TTL.SETTINGS);
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
};

const _POST = async (req: NextRequest) => {
  await dbConnect();
  try {
    const { deliveryFee } = await req.json();
    let settings = await Settings.findOne();
    if (settings) {
      settings.deliveryFee = deliveryFee;
      settings.updatedAt = new Date();
      await settings.save();
    } else {
      settings = await Settings.create({ deliveryFee });
    }
    // Bust cache so next GET returns updated fee
    appCache.invalidate(CACHE_KEYS.SETTINGS);
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
};

export const GET  = withLogger("GET /api/settings",  _GET);
export const POST = withLogger("POST /api/settings", _POST);



