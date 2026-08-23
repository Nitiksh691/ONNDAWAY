import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/adminAuth";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  // 🔒 Admin-only endpoint
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { image } = await req.json(); // base64 image string

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate it's actually an image and check size
    if (!image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }
    const base64Data = image.split(",")[1] ?? "";
    const approxBytes = Math.ceil(base64Data.length * 0.75);
    if (approxBytes > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 413 });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: "onndaway/menu",
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
