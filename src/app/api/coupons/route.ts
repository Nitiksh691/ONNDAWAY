import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (code) {
      const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();
      if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
      return NextResponse.json({ ...coupon, id: (coupon as any)._id.toString() });
    }

    const items = await Coupon.find().sort({ createdAt: -1 }).lean();
    const mapped = items.map((i: any) => ({ ...i, id: i._id.toString() }));
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { code, discount, type, label, memeImage, memeSound } = body;

    if (!code || !discount || !type || !label) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await Coupon.create({ code: code.toUpperCase(), discount, type, label, memeImage, memeSound });
    return NextResponse.json({ ...item.toObject(), id: item._id.toString() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
