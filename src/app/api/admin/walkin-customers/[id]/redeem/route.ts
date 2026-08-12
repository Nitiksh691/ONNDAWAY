import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WalkInCustomer from "@/models/WalkInCustomer";

/**
 * POST /api/admin/walkin-customers/[id]/redeem
 * Redeem a free drink for a walk-in customer.
 * Records a ₹0 order and resets the loyalty cycle.
 * Body: { itemName?: string } — optional name of the free drink
 */
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  try {
    const params = await props.params;
    const body = await req.json().catch(() => ({}));
    const itemName = body.itemName || "Free Loyalty Drink";

    const customer = await WalkInCustomer.findById(params.id);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const drinksInCycle = customer.totalDrinks % 7;
    if (drinksInCycle < 6) {
      return NextResponse.json(
        {
          error: `Customer needs ${6 - drinksInCycle} more drink(s) before earning a free one`,
        },
        { status: 400 }
      );
    }

    const newOrder = {
      items: [{ name: itemName, price: 0, quantity: 1, category: "drinks" }],
      amount: 0,
      drinkCount: 1,
      isFreeRedeem: true,
      note: "🎉 Free loyalty drink redeemed!",
      createdAt: new Date(),
    };

    const updatedCustomer = await WalkInCustomer.findOneAndUpdate(
      { _id: params.id, totalDrinks: customer.totalDrinks },
      {
        $push: { orders: newOrder },
        $inc: { totalDrinks: 1, totalOrders: 1, loyaltyRedeemed: 1 }
      },
      { new: true }
    );

    if (!updatedCustomer) {
      return NextResponse.json(
        { error: "Race condition detected, please try again" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Free drink redeemed!",
      totalDrinks: updatedCustomer.totalDrinks,
      loyaltyRedeemed: updatedCustomer.loyaltyRedeemed,
      drinksInCycle: updatedCustomer.totalDrinks % 7, // should be 0 now
    });
  } catch (error) {
    console.error("Error redeeming free drink:", error);
    return NextResponse.json(
      { error: "Failed to redeem free drink" },
      { status: 500 }
    );
  }
}
