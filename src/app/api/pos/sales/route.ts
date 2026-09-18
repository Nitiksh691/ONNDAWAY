import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PosSale from "@/models/PosSale";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const dateQuery = url.searchParams.get("date");
    
    let query = {};
    if (dateQuery === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      query = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    }

    const sales = await PosSale.find(query).sort({ createdAt: -1 });
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching POS sales:", error);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { items, totalAmount, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Sale must contain items" }, { status: 400 });
    }

    if (typeof totalAmount !== "number") {
      return NextResponse.json({ error: "Invalid total amount" }, { status: 400 });
    }

    if (!["Cash", "Online"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method. Must be Cash or Online." }, { status: 400 });
    }

    const newSale = await PosSale.create({
      items,
      totalAmount,
      paymentMethod,
    });

    return NextResponse.json(newSale, { status: 201 });
  } catch (error) {
    console.error("Error adding POS sale:", error);
    return NextResponse.json({ error: "Failed to add sale" }, { status: 500 });
  }
}
