import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WalkInCustomer from "@/models/WalkInCustomer";
import { withLogger } from "@/lib/withLogger";

/**
 * POST /api/admin/walkin-customers/[id]/orders
 * Add an order to a walk-in customer.
 * Body: { items: [{ name, price, quantity, category }], amount, drinkCount, note? }
 */
const _POST = async (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => {
  await dbConnect();
  try {
    const params = await ctx!.params;
    const body = await req.json();
    const { items, amount, drinkCount, note } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    if (amount === undefined || amount < 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    const customer = await WalkInCustomer.findById(params.id);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const orderDrinkCount = drinkCount || 0;

    customer.orders.push({
      items,
      amount,
      drinkCount: orderDrinkCount,
      isFreeRedeem: false,
      note: note || "",
      createdAt: new Date(),
    });

    customer.totalOrders = (customer.totalOrders || 0) + 1;
    customer.totalSpent  = (customer.totalSpent  || 0) + amount;
    customer.totalDrinks = (customer.totalDrinks || 0) + orderDrinkCount;
    customer.lastVisitAt = new Date(); // track recency without scanning orders array

    await customer.save();

    const drinksInCycle = customer.totalDrinks % 7;

    return NextResponse.json({
      success: true,
      totalDrinks:      customer.totalDrinks,
      drinksInCycle,
      isEligibleForFree: drinksInCycle >= 6,
    });
  } catch (error) {
    console.error("Error adding walk-in order:", error);
    return NextResponse.json(
      { error: "Failed to add order" },
      { status: 500 }
    );
  }
};

export const POST = withLogger("POST /api/admin/walkin-customers/[id]/orders", _POST);
