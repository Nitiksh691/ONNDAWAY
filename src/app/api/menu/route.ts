import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MenuItem from "@/models/MenuItem";

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const items = await MenuItem.find().sort({ category: 1, name: 1 }).lean();
    const mapped = items.map((i: any) => ({ ...i, id: i._id.toString() }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/menu error:", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { name, description, price, originalPrice, image, category, isPopular, isRecommended, section, isBanner } = body;

    if (!name || !price || !image || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await MenuItem.create({ 
      name, 
      description: description || "", 
      price, 
      originalPrice: originalPrice || null,
      image, 
      category,
      isPopular: isPopular || false,
      isRecommended: isRecommended || false,
      isBanner: isBanner || false,
      section: section || ""
    });
    return NextResponse.json({ ...item.toObject(), id: item._id.toString() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}
