import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Store from "@/models/Store";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const showAll = req.nextUrl.searchParams.get("all") === "true";
    const filter = showAll ? {} : { isActive: true };

    const stores = await Store.find(filter).sort({ name: 1 }).lean();
    const mapped = stores.map((s: any) => ({
      ...s,
      id: s._id.toString(),
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error("GET /api/stores error:", error);
    return NextResponse.json({ error: "Failed to fetch stores" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  await dbConnect();
  try {
    const body = await req.json();
    const {
      name,
      slug,
      code,
      address,
      city,
      state,
      country,
      postalCode,
      latitude,
      longitude,
      serviceRadiusKm,
      serviceAreas,
      isActive,
      isAcceptingOrders,
      openingTime,
      closingTime,
      minOrderValue,
      deliveryFee,
      estimatedDeliveryMins,
      phone,
      pin,
      managerName,
      banner,
      notes,
    } = body;

    if (!name || !slug || !code || !phone || !pin || latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "Missing required fields (name, slug, code, phone, pin, latitude, longitude)" },
        { status: 400 }
      );
    }

    const newStore = await Store.create({
      name,
      slug: slug.toLowerCase().trim(),
      code: code.toUpperCase().trim(),
      address: address || "",
      city: city || "Delhi",
      state: state || "Delhi",
      country: country || "India",
      postalCode: postalCode || "",
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)], // [lng, lat]
      },
      serviceRadiusKm: serviceRadiusKm != null ? Number(serviceRadiusKm) : 5,
      serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [],
      isActive: isActive !== undefined ? !!isActive : true,
      isAcceptingOrders: isAcceptingOrders !== undefined ? !!isAcceptingOrders : true,
      openingTime: openingTime || "07:00",
      closingTime: closingTime || "23:59",
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      deliveryFee: deliveryFee != null ? Number(deliveryFee) : 20,
      estimatedDeliveryMins: estimatedDeliveryMins ? Number(estimatedDeliveryMins) : 15,
      phone: phone.trim(),
      pin: pin.trim(),
      managerName: managerName || "",
      banner: banner || "",
      notes: notes || "",
    });

    return NextResponse.json({ ...newStore.toObject(), id: newStore._id.toString() }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/stores error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "Store with this code, slug, or phone already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create store", details: error.message }, { status: 500 });
  }
}
