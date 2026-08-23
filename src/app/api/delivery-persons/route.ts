import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DeliveryPerson from "@/models/DeliveryPerson";
import User from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  // 🔒 Admin-only: list all delivery persons
  const authError = requireAdmin(req);
  if (authError) return authError;

  await dbConnect();
  const dps = await DeliveryPerson.find().lean();
  const usersAsDps = await User.find({ role: "delivery" }).lean();
  
  // Exclude passwords and map _id
  const mappedDps = dps.map((dp: any) => {
    const { password, ...rest } = dp;
    return { ...rest, uid: dp._id.toString() };
  });

  const mappedUsers = usersAsDps.map((u: any) => {
    return {
      name: u.name,
      phone: u.phone,
      email: `${u.userId}@onndaway.com`, // dummy email for users acting as DPs
      activeOrderIds: [],
      uid: u.userId, // Use userId as the uid for linking to orders
    };
  });

  return NextResponse.json([...mappedDps, ...mappedUsers]);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { email, password } = body;

    if (email && password) {
      // This acts as a simple login check for delivery persons
      const dp = await DeliveryPerson.findOne({ email }).lean();
      
      if (!dp || dp.password !== password) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const { password: _, ...rest } = dp as any;
      return NextResponse.json({ ...rest, uid: (dp as any)._id.toString() });
    }

    // Otherwise, create a new delivery person
    // 🔒 Admin-only: create new delivery persons
    const authError = requireAdmin(req);
    if (authError) return authError;

    const { name, phone, email: newEmail, password: newPassword } = body;
    if (!name || !phone || !newEmail || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dp = await DeliveryPerson.create({ name, phone, email: newEmail, password: newPassword });
    const { password: _, ...rest } = dp.toObject() as any;
    return NextResponse.json({ ...rest, uid: dp._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("Error with delivery person:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
