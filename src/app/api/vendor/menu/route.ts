import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";
import Vendor from "@/models/Vendor";

// GET /api/vendor/menu?vendorId=xxx
// Returns all menu items belonging to this vendor with approvalStatus
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");

  if (!vendorId) {
    return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
  }

  try {
    const items = await MenuItem.find({ vendorId })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = items.map((i: any) => ({
      ...i,
      id: i._id.toString(),
      approvalStatus: i.approvalStatus || "approved",
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/vendor/menu error:", error);
    return NextResponse.json({ error: "Failed to fetch vendor menu" }, { status: 500 });
  }
}

// POST /api/vendor/menu
// Vendor proposes / uploads a new menu item (sets approvalStatus to 'pending')
export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const {
      vendorId,
      name,
      price,
      originalPrice,
      category,
      description,
      image,
      brand,
      unit,
      world,
    } = body;

    if (!vendorId || !name || !price || !category) {
      return NextResponse.json(
        { error: "vendorId, name, price, and category are required" },
        { status: 400 }
      );
    }

    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const vendorDisplayName = (vendor as any).businessName || (vendor as any).name || "Vendor";

    const newItem = await MenuItem.create({
      name: name.trim(),
      description: description?.trim() || "",
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      category: category.trim(),
      image: image?.trim() || "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop&q=60",
      brand: brand?.trim() || vendorDisplayName,
      unit: unit?.trim() || "",
      world: world === "food" ? "food" : "munchies",
      vendorId,
      vendorName: vendorDisplayName,
      isConsignment: true,
      available: true,
      approvalStatus: "pending", // Requires Admin Approval
      approvalNotes: "",
      orderCount: 0,
    });

    return NextResponse.json({
      success: true,
      item: { ...newItem.toObject(), id: newItem._id.toString() },
      message: "Item submitted successfully! Awaiting Admin approval before going live.",
    });
  } catch (error) {
    console.error("POST /api/vendor/menu error:", error);
    return NextResponse.json({ error: "Failed to submit menu item" }, { status: 500 });
  }
}

// PATCH /api/vendor/menu
// Vendor updates their item (e.g. toggle stock/availability)
export async function PATCH(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { vendorId, itemId, available, price, originalPrice, description, name, image } = body;

    if (!vendorId || !itemId) {
      return NextResponse.json({ error: "vendorId and itemId are required" }, { status: 400 });
    }

    const item = await MenuItem.findOne({ _id: itemId, vendorId });
    if (!item) {
      return NextResponse.json({ error: "Item not found or does not belong to vendor" }, { status: 404 });
    }

    // If changing stock availability only, keep current approvalStatus
    if (available !== undefined && price === undefined && name === undefined) {
      item.available = Boolean(available);
      await item.save();
      return NextResponse.json({ success: true, item: { ...item.toObject(), id: item._id.toString() } });
    }

    // If critical fields like price or name are changed, reset to pending approval
    if (price !== undefined) item.price = Number(price);
    if (originalPrice !== undefined) item.originalPrice = originalPrice ? Number(originalPrice) : null;
    if (name !== undefined) item.name = name.trim();
    if (description !== undefined) item.description = description.trim();
    if (image !== undefined) item.image = image.trim();
    if (available !== undefined) item.available = Boolean(available);

    // Any major edit requires admin re-approval
    item.approvalStatus = "pending";
    item.updatedAt = new Date();
    await item.save();

    return NextResponse.json({
      success: true,
      item: { ...item.toObject(), id: item._id.toString() },
      message: "Item updated and submitted for admin re-approval.",
    });
  } catch (error) {
    console.error("PATCH /api/vendor/menu error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE /api/vendor/menu?vendorId=xxx&id=yyy
export async function DELETE(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");
  const itemId = searchParams.get("id");

  if (!vendorId || !itemId) {
    return NextResponse.json({ error: "vendorId and id are required" }, { status: 400 });
  }

  try {
    const deleted = await MenuItem.findOneAndDelete({ _id: itemId, vendorId });
    if (!deleted) {
      return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/vendor/menu error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
