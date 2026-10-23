import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Store from "@/models/Store";

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { storeId, isAcceptingOrders, isBusy, isActive } = await req.json();

    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const update: any = {};
    if (isAcceptingOrders !== undefined) update.isAcceptingOrders = !!isAcceptingOrders;
    if (isBusy !== undefined) update.isBusy = !!isBusy;
    if (isActive !== undefined) update.isActive = !!isActive;

    const store = await Store.findByIdAndUpdate(storeId, update, { new: true });
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      store: {
        id: store._id.toString(),
        name: store.name,
        isActive: store.isActive,
        isAcceptingOrders: store.isAcceptingOrders,
        isBusy: store.isBusy,
      },
    });
  } catch (error: any) {
    console.error("POST /api/store-portal/toggle-status error:", error);
    return NextResponse.json({ error: "Failed to update store status" }, { status: 500 });
  }
}
