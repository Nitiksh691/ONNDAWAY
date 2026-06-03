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
      bannerSlides: settings.bannerSlides || []
    });
  } catch (error) {
    console.error("GET Banner Settings Error:", error);
    return NextResponse.json({ error: "Failed to fetch banner settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { bannerEnabled, bannerSlides } = await req.json();
    
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings();
    }
    
    if (typeof bannerEnabled === "boolean") settings.bannerEnabled = bannerEnabled;
    if (Array.isArray(bannerSlides)) settings.bannerSlides = bannerSlides;
    settings.updatedAt = Date.now();
    
    await settings.save();
    
    return NextResponse.json({
      success: true,
      bannerEnabled: settings.bannerEnabled,
      bannerSlides: settings.bannerSlides
    });
  } catch (error) {
    console.error("POST Banner Settings Error:", error);
    return NextResponse.json({ error: "Failed to update banner settings" }, { status: 500 });
  }
}
