import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { requireAdmin } from "@/lib/adminAuth";

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

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    await dbConnect();
    const { bannerEnabled, bannerMode, bannerSlides, bentoSlides } = await req.json();

    const updateFields: Record<string, unknown> = { updatedAt: Date.now() };
    if (typeof bannerEnabled === "boolean") updateFields.bannerEnabled = bannerEnabled;
    if (bannerMode === "single" || bannerMode === "bento") updateFields.bannerMode = bannerMode;
    if (Array.isArray(bannerSlides)) updateFields.bannerSlides = bannerSlides;
    if (Array.isArray(bentoSlides)) updateFields.bentoSlides = bentoSlides;

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: updateFields },
      { upsert: true, new: true }
    );

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
