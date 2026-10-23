import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import { requireAdmin } from "@/lib/adminAuth";
import { appCache, CACHE_KEYS } from "@/lib/cache";

// PATCH /api/admin/menu/approve
// Body: { itemId: string, action: "approve" | "reject", notes?: string }
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  await dbConnect();
  try {
    const { itemId, action, notes } = await req.json();

    if (!itemId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "itemId and valid action (approve/reject) required" }, { status: 400 });
    }

    const updated = await MenuItem.findByIdAndUpdate(
      itemId,
      {
        approvalStatus: action === "approve" ? "approved" : "rejected",
        approvalNotes: notes || (action === "approve" ? "Approved by Admin" : "Rejected by Admin"),
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Invalidate cache so changes reflect immediately
    appCache.invalidate(CACHE_KEYS.MENU);

    return NextResponse.json({
      success: true,
      item: { ...updated, id: (updated as any)._id.toString() },
      message: `Item ${action === "approve" ? "approved and published" : "rejected"} successfully.`,
    });
  } catch (error) {
    console.error("PATCH /api/admin/menu/approve error:", error);
    return NextResponse.json({ error: "Failed to update item approval" }, { status: 500 });
  }
}
