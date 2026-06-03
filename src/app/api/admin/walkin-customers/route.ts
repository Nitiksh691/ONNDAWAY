import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WalkInCustomer from "@/models/WalkInCustomer";

/**
 * GET  /api/admin/walkin-customers
 * Returns all walk-in customers sorted by most recent activity.
 */
export async function GET() {
  await dbConnect();
  try {
    const customers = await WalkInCustomer.find({})
      .sort({ updatedAt: -1 })
      .lean();

    const result = customers.map((c: any) => {
      const drinksInCycle = c.totalDrinks % 7;
      const lastOrder =
        c.orders && c.orders.length > 0
          ? c.orders[c.orders.length - 1]
          : null;

      return {
        id: c._id.toString(),
        name: c.name,
        phone: c.phone,
        totalOrders: c.totalOrders || 0,
        totalSpent: c.totalSpent || 0,
        totalDrinks: c.totalDrinks || 0,
        loyaltyRedeemed: c.loyaltyRedeemed || 0,
        drinksInCycle,
        isEligibleForFree: drinksInCycle >= 6,
        lastVisit: lastOrder?.createdAt || c.createdAt,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching walk-in customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch walk-in customers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/walkin-customers
 * Create a new walk-in customer. Body: { name, phone }
 * If a customer with the same phone already exists, return that customer instead.
 */
export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\s+/g, "").trim();

    // Check if customer already exists
    const existing = await WalkInCustomer.findOne({ phone: cleanPhone }).lean();
    if (existing) {
      return NextResponse.json(
        {
          id: (existing as any)._id.toString(),
          name: (existing as any).name,
          phone: (existing as any).phone,
          exists: true,
        },
        { status: 200 }
      );
    }

    const customer = await WalkInCustomer.create({
      name: name.trim(),
      phone: cleanPhone,
    });

    return NextResponse.json(
      {
        id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        exists: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating walk-in customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
