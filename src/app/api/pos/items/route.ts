import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PosItem from "@/models/PosItem";

export async function GET() {
  try {
    await dbConnect();
    const items = await PosItem.find({ isActive: true }).sort({ orderIndex: 1, name: 1 });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching POS items:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, price, category } = body;

    if (!name || typeof price !== "number") {
      return NextResponse.json({ error: "Name and valid price are required" }, { status: 400 });
    }

    const newItem = await PosItem.create({ name, price, category });
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error adding POS item:", error);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, name, price, isActive, category, orderIndex } = body;

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const updatedItem = await PosItem.findByIdAndUpdate(
      id,
      { name, price, isActive, category, orderIndex },
      { new: true }
    );

    if (!updatedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating POS item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
