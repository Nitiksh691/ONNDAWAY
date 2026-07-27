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
    const body = await req.json();
    const {
      deliveryFee,
      maintenanceMode,
      maintenancePhone,
      maintenanceMessage,
      kitchenClosed,
      kitchenOpenTime,
      waitlistMode,
    } = body;

    let settings = await Settings.findOne();
    if (settings) {
      if (deliveryFee !== undefined) settings.deliveryFee = deliveryFee;
      if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
      if (maintenancePhone !== undefined) settings.maintenancePhone = maintenancePhone;
      if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;
      if (kitchenClosed !== undefined) settings.kitchenClosed = kitchenClosed;
      if (kitchenOpenTime !== undefined) settings.kitchenOpenTime = kitchenOpenTime;
      if (waitlistMode !== undefined) settings.waitlistMode = waitlistMode;
      settings.updatedAt = new Date();
      await settings.save();
    } else {
      settings = await Settings.create({ deliveryFee, maintenanceMode, maintenancePhone, maintenanceMessage, kitchenClosed, kitchenOpenTime, waitlistMode });
    }
    // Bust cache so next GET returns updated settings
    appCache.invalidate(CACHE_KEYS.SETTINGS);
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
};

export const GET  = withLogger("GET /api/settings",  _GET);
export const POST = withLogger("POST /api/settings", _POST);
