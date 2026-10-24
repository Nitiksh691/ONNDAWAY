import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { appCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { withLogger } from "@/lib/withLogger";
import { requireAdmin } from "@/lib/adminAuth";

const _GET = async () => {
  await dbConnect();
  try {
    const cached = appCache.get<object>(CACHE_KEYS.SETTINGS);
    if (cached) return NextResponse.json(cached);

    let settings: any = await Settings.findOne().lean();
    if (!settings) {
      settings = await Settings.create({ deliveryFee: 20, minOrderValue: 69 });
    } else if (settings.minOrderValue === undefined || settings.minOrderValue === 0) {
      await Settings.updateOne({ _id: settings._id }, { $set: { minOrderValue: 69, minGroceryOrderValue: 0 } });
      settings.minOrderValue = 69;
      settings.minGroceryOrderValue = 0;
    }
    appCache.set(CACHE_KEYS.SETTINGS, settings, CACHE_TTL.SETTINGS);
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
};

const _POST = async (req: NextRequest) => {
  const authError = requireAdmin(req);
  if (authError) return authError;

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
      launchingSoonMode,
      onlinePaymentEnabled,
      codEnabled,
      ordersPaused,
      heroSectionEnabled,
      minOrderValue,
      minGroceryOrderValue,
      homeLayout,
    } = body;

    // Build update object — only include defined fields
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (deliveryFee !== undefined) update.deliveryFee = deliveryFee;
    if (maintenanceMode !== undefined) update.maintenanceMode = maintenanceMode;
    if (maintenancePhone !== undefined) update.maintenancePhone = maintenancePhone;
    if (maintenanceMessage !== undefined) update.maintenanceMessage = maintenanceMessage;
    if (kitchenClosed !== undefined) update.kitchenClosed = kitchenClosed;
    if (kitchenOpenTime !== undefined) update.kitchenOpenTime = kitchenOpenTime;
    if (waitlistMode !== undefined) update.waitlistMode = waitlistMode;
    if (launchingSoonMode !== undefined) update.launchingSoonMode = launchingSoonMode;
    if (onlinePaymentEnabled !== undefined) update.onlinePaymentEnabled = onlinePaymentEnabled;
    if (codEnabled !== undefined) update.codEnabled = codEnabled;
    if (ordersPaused !== undefined) update.ordersPaused = ordersPaused;
    if (heroSectionEnabled !== undefined) update.heroSectionEnabled = heroSectionEnabled;
    if (minOrderValue !== undefined) {
      update.minOrderValue = minOrderValue;
      update.minGroceryOrderValue = 0;
    }
    if (homeLayout !== undefined) update.homeLayout = homeLayout;

    // Single atomic op — much faster than findOne+save, avoids 30s timeout
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: update },
      { upsert: true, returnDocument: "after", lean: true, maxTimeMS: 8000 }
    );

    // Bust both caches so all clients get fresh data immediately
    appCache.invalidate(CACHE_KEYS.SETTINGS);
    appCache.invalidate("settings_status");
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
};

export const GET  = withLogger("GET /api/settings",  _GET);
export const POST = withLogger("POST /api/settings", _POST);
