import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WalkInCustomer from "@/models/WalkInCustomer";

/**
 * GET /api/admin/walkin-customers/[id]
 * Fetch a single walk-in customer with full order history.
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  try {
    const params = await props.params;
    const customer = await WalkInCustomer.findById(params.id).lean();

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const c = customer as any;
    const drinksInCycle = c.totalDrinks % 7;

    return NextResponse.json({
      id: c._id.toString(),
      name: c.name,
      phone: c.phone,
      totalOrders: c.totalOrders || 0,
      totalSpent: c.totalSpent || 0,
      totalDrinks: c.totalDrinks || 0,
      loyaltyRedeemed: c.loyaltyRedeemed || 0,
      drinksInCycle,
      isEligibleForFree: drinksInCycle >= 6,
      orders: (c.orders || [])
        .map((o: any) => ({
          id: o._id?.toString(),
          items: o.items || [],
          amount: o.amount,
          drinkCount: o.drinkCount || 0,
          isFreeRedeem: o.isFreeRedeem || false,
          note: o.note || "",
          createdAt: o.createdAt,
        }))
        .reverse(), // newest first
      createdAt: c.createdAt,
    });
  } catch (error) {
    console.error("Error fetching walk-in customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/walkin-customers/[id]
 * Remove a walk-in customer.
 */
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  try {
    const params = await props.params;
    await WalkInCustomer.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting walk-in customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
