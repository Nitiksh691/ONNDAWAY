import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ deliveryFee: 20 });
    }
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
