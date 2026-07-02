import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { appCache } from "@/lib/cache";

export async function GET() {
  await dbConnect();
  try {
    const cached = appCache.get<any>("settings_status");
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set("X-Cache", "HIT");
      return res;
    }

    const settings = await Settings.findOne()
      .select("maintenanceMode maintenancePhone maintenanceMessage kitchenClosed kitchenOpenTime")
      .lean();

    const data = settings ? {
      maintenanceMode: (settings as any).maintenanceMode ?? false,
      maintenancePhone: (settings as any).maintenancePhone ?? "",
      maintenanceMessage: (settings as any).maintenanceMessage ?? "",
      kitchenClosed: (settings as any).kitchenClosed ?? false,
      kitchenOpenTime: (settings as any).kitchenOpenTime ?? "7:00 AM",
    } : {
      maintenanceMode: false,
      maintenancePhone: "",
      maintenanceMessage: "",
      kitchenClosed: false,
      kitchenOpenTime: "7:00 AM",
    };

    appCache.set("settings_status", data, 15000); // 15 seconds TTL
    const res = NextResponse.json(data);
    res.headers.set("X-Cache", "MISS");
    return res;
  } catch (error) {
    return NextResponse.json({
      maintenanceMode: false,
      maintenancePhone: "",
      maintenanceMessage: "",
      kitchenClosed: false,
      kitchenOpenTime: "7:00 AM",
    });
  }
}
