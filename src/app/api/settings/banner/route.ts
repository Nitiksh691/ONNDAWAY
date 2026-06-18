import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({});
    }
    return NextResponse.json({
      bannerEnabled: settings.bannerEnabled,
      bannerMode: settings.bannerMode || "single",
      bannerSlides: settings.bannerSlides || [],
      bentoSlides: settings.bentoSlides || []
    });
  } catch (error) {
    console.error("GET Banner Settings Error:", error);
    return NextResponse.json({ error: "Failed to fetch banner settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { bannerEnabled, bannerMode, bannerSlides, bentoSlides } = await req.json();
    
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings();
    }
    
    if (typeof bannerEnabled === "boolean") settings.bannerEnabled = bannerEnabled;
    if (bannerMode === "single" || bannerMode === "bento") settings.bannerMode = bannerMode;
    if (Array.isArray(bannerSlides)) settings.bannerSlides = bannerSlides;
    if (Array.isArray(bentoSlides)) settings.bentoSlides = bentoSlides;
    settings.updatedAt = Date.now();
    
    await settings.save();
    
    return NextResponse.json({
      success: true,
      bannerEnabled: settings.bannerEnabled,
      bannerMode: settings.bannerMode,
      bannerSlides: settings.bannerSlides,
      bentoSlides: settings.bentoSlides
    });
  } catch (error) {
    console.error("POST Banner Settings Error:", error);
    return NextResponse.json({ error: "Failed to update banner settings" }, { status: 500 });
  }
}
