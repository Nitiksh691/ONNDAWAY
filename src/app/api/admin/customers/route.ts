import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    // Fetch all orders
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    
    // Group by userId
    const customerMap = new Map();

    orders.forEach((order) => {
      const uId = order.userId;
      if (!customerMap.has(uId)) {
        customerMap.set(uId, {
          userId: uId,
          name: order.userName || "Unknown",
          phone: order.userPhone || "Unknown",
          totalSpent: 0,
          totalOrders: 0,
          lastOrderDate: order.createdAt,
          items: {}
        });
      }

      const customer = customerMap.get(uId);
      
      // We only count delivered/completed orders towards total spent (or you could count all placed)
      if (order.status !== "cancelled") {
        customer.totalSpent += order.total;
        customer.totalOrders += 1;
        
        // Ensure lastOrderDate is accurate (assuming sort is desc, the first one encountered is newest)
        if (new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
          customer.lastOrderDate = order.createdAt;
          // In case user updated their name/phone in a newer order
          customer.name = order.userName || customer.name;
          customer.phone = order.userPhone || customer.phone;
        }

        // Tally items
        order.items.forEach((cartItem: any) => {
          const itemName = cartItem.item?.name;
          if (itemName) {
            customer.items[itemName] = (customer.items[itemName] || 0) + cartItem.quantity;
          }
        });
      }
    });

    const customers = Array.from(customerMap.values()).map(c => {
      // Find top item
      let topItem = "None";
      let topItemCount = 0;
      for (const [name, count] of Object.entries(c.items)) {
        if ((count as number) > topItemCount) {
          topItemCount = count as number;
          topItem = name;
        }
      }

      return {
        userId: c.userId,
        name: c.name,
        phone: c.phone,
        totalSpent: c.totalSpent,
        totalOrders: c.totalOrders,
        lastOrderDate: c.lastOrderDate,
        frequentItem: topItem
      };
    });

    // Sort by total spent by default
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
