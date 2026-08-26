import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InternApplication from "@/models/InternApplication";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const { name, year, branch, skills, project, reason } = body;

    // Basic validation
    if (!name || !year || !branch || !skills || !project || !reason) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const application = await InternApplication.create({
      name,
      year,
      branch,
      skills,
      project,
      reason,
    });

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating intern application:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit application" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    await dbConnect();
    const applications = await InternApplication.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(applications);
  } catch (error: any) {
    console.error("Error fetching intern applications:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
