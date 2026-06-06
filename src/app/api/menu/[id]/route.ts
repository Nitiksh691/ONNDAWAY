import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import { appCache, CACHE_KEYS } from "@/lib/cache";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const params = await props.params;
    const body = await req.json();
    
    const item = await MenuItem.findByIdAndUpdate(params.id, body, { new: true }).lean();
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    
    appCache.invalidate(CACHE_KEYS.MENU);
    return NextResponse.json({ ...item, id: (item as any)._id.toString() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const params = await props.params;
    const item = await MenuItem.findByIdAndDelete(params.id);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    
    appCache.invalidate(CACHE_KEYS.MENU);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
