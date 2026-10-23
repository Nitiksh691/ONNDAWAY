import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { checkServiceability } from "@/lib/serviceability";
import Store from "@/models/Store";

export async function GET(req: NextRequest) {
  await dbConnect();
  const searchParams = req.nextUrl.searchParams;
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");
  const areaName = searchParams.get("area");
  const storeId = searchParams.get("storeId");

  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;

  try {
    const result = await checkServiceability({
      latitude,
      longitude,
      areaName,
      storeId,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/serviceability error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate serviceability", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json().catch(() => ({}));
    const { latitude, longitude, areaName, storeId } = body;

    const result = await checkServiceability({
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      areaName: areaName || null,
      storeId: storeId || null,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/serviceability error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate serviceability", details: error.message },
      { status: 500 }
    );
  }
}
