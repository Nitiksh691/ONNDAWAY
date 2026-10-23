import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import dbConnect from "@/lib/mongodb";
import Vendor from "@/models/Vendor";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// POST /api/vendor/upload
// Accepts base64 data URL and vendorId to upload product photos to Cloudinary
export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { image, vendorId } = await req.json();

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId is required" }, { status: 401 });
    }

    // Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.active) {
      return NextResponse.json({ error: "Invalid or inactive vendor account" }, { status: 403 });
    }

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate image data format
    if (!image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Only image files (JPEG, PNG, WEBP) are allowed" }, { status: 400 });
    }

    const base64Data = image.split(",")[1] ?? "";
    const approxBytes = Math.ceil(base64Data.length * 0.75);
    if (approxBytes > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Image file is too large (max 10MB)" }, { status: 413 });
    }

    // Upload to Cloudinary under onndaway/vendor-menu folder
    const result = await cloudinary.uploader.upload(image, {
      folder: "onndaway/vendor-menu",
      transformation: [
        { quality: "auto:good", fetch_format: "auto" }
      ]
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Vendor upload error:", error);
    return NextResponse.json({ error: "Failed to upload image. Please try again." }, { status: 500 });
  }
}
