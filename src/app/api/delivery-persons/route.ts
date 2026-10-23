import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DeliveryPerson from "@/models/DeliveryPerson";
import User from "@/models/User";
import Store from "@/models/Store";

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const storeId = req.nextUrl.searchParams.get("storeId");
    const filter: any = {};
    if (storeId) filter.storeId = storeId;

    const dps = await DeliveryPerson.find(filter).sort({ createdAt: -1 }).lean();
    const mapped = dps.map((dp: any) => ({
      ...dp,
      id: dp._id.toString(),
      uid: dp._id.toString(),
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error("GET /api/delivery-persons error:", error);
    return NextResponse.json({ error: "Failed to fetch delivery partners" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { phone, name, storeId, email, password, action } = body;

    // ── CASE 1: PHONE-BASED RIDER LOGIN ──
    // When rider logs in from /delivery/login with just their phone number
    if ((action === "login" || (!name && !email)) && phone) {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);

      const phoneVariants = [cleanPhone, `+91${cleanPhone}`, `91${cleanPhone}`];

      // Fast indexed lookup in DeliveryPerson collection
      let rider = await DeliveryPerson.findOne({
        phone: { $in: phoneVariants },
      }).lean();

      // Fallback: fast indexed lookup in User collection with role: "delivery"
      if (!rider) {
        const userRider = await User.findOne({
          phone: { $in: phoneVariants },
          role: "delivery",
        }).lean();

        if (userRider) {
          rider = {
            _id: userRider.userId,
            name: userRider.name || "Delivery Partner",
            phone: userRider.phone,
            active: true,
          } as any;
        }
      }

      if (!rider) {
        return NextResponse.json(
          {
            error:
              "No delivery partner registered with this phone number. Please ask your Admin or Store Manager to add you.",
          },
          { status: 404 }
        );
      }

      const uid = (rider as any)._id?.toString() || (rider as any).uid || cleanPhone;
      return NextResponse.json({
        success: true,
        uid,
        name: rider.name,
        phone: rider.phone,
        storeId: (rider as any).storeId || null,
        storeName: (rider as any).storeName || "",
      });
    }

    // ── CASE 2: LEGACY EMAIL + PASSWORD LOGIN ──
    if (email && password && !name && !phone) {
      const dp = await DeliveryPerson.findOne({ email }).lean();
      if (!dp || dp.password !== password) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      const { password: _, ...rest } = dp as any;
      return NextResponse.json({ ...rest, uid: (dp as any)._id.toString() });
    }

    // ── CASE 3: CREATE RIDER (NAME + PHONE + OPTIONAL STORE) ──
    // Admin, Store Manager, or Vendor creates a new rider
    if (name && phone) {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      if (cleanPhone.length !== 10) {
        return NextResponse.json({ error: "Please enter a valid 10-digit mobile number" }, { status: 400 });
      }

      let storeName = "";
      if (storeId) {
        const store = await Store.findById(storeId).lean();
        if (store) storeName = store.name;
      }

      // Upsert in DeliveryPerson
      const rider = await DeliveryPerson.findOneAndUpdate(
        { phone: cleanPhone },
        {
          $set: {
            name: name.trim(),
            phone: cleanPhone,
            storeId: storeId || null,
            storeName: storeName || "",
            email: email || `${cleanPhone}@rider.onndaway.com`,
            password: password || cleanPhone.slice(-4),
            active: true,
          },
        },
        { new: true, upsert: true }
      );

      // Also ensure User document exists with role: "delivery"
      await User.findOneAndUpdate(
        { phone: cleanPhone },
        {
          $set: {
            userId: rider._id.toString(),
            name: name.trim(),
            phone: cleanPhone,
            role: "delivery",
          },
        },
        { upsert: true }
      );

      return NextResponse.json(
        {
          success: true,
          rider: {
            ...rider.toObject(),
            id: rider._id.toString(),
            uid: rider._id.toString(),
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: "Missing required fields (name and phone required)" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/delivery-persons error:", error);
    return NextResponse.json({ error: "Failed to process request", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Rider ID required" }, { status: 400 });

  try {
    const deleted = await DeliveryPerson.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    // Revoke delivery role on the User record to prevent stale fallback login
    if (deleted.phone) {
      await User.updateOne({ phone: deleted.phone }, { $set: { role: "user" } });
    }
    return NextResponse.json({ success: true, message: "Rider removed" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete rider" }, { status: 500 });
  }
}
