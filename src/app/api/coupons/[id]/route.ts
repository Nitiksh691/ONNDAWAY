import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const params = await props.params;
    const body = await req.json();
    
    const item = await Coupon.findByIdAndUpdate(params.id, body, { new: true }).lean();
    if (!item) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    
    return NextResponse.json({ ...item, id: (item as any)._id.toString() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const params = await props.params;
    const item = await Coupon.findByIdAndDelete(params.id);
    if (!item) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
