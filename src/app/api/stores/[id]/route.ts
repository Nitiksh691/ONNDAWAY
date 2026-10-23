import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Store from "@/models/Store";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  try {
    const store = await Store.findById(id).lean();
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return NextResponse.json({ ...store, id: store._id.toString() });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch store" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  await dbConnect();
  const { id } = await params;
  try {
    const body = await req.json();
    const updateData: any = { ...body };

    if (body.latitude != null && body.longitude != null) {
      updateData.location = {
        type: "Point",
        coordinates: [Number(body.longitude), Number(body.latitude)],
      };
      delete updateData.latitude;
      delete updateData.longitude;
    }

    const updated = await Store.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ ...updated, id: updated._id.toString() });
  } catch (error: any) {
    console.error("PATCH /api/stores/[id] error:", error);
    return NextResponse.json({ error: "Failed to update store" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  await dbConnect();
  const { id } = await params;
  try {
    const deleted = await Store.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Cascade clean up: remove orphaned store inventories and unassign riders
    const StoreInventory = (await import("@/models/StoreInventory")).default;
    const DeliveryPerson = (await import("@/models/DeliveryPerson")).default;
    await Promise.all([
      StoreInventory.deleteMany({ storeId: id }),
      DeliveryPerson.updateMany({ storeId: id }, { $set: { storeId: null, storeName: "" } }),
    ]);

    return NextResponse.json({ success: true, message: "Store deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete store" }, { status: 500 });
  }
}
