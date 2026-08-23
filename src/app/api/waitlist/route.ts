import { type NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Waitlist from "@/models/Waitlist";
import { requireAdmin } from "@/lib/adminAuth";

// ── Indian phone regex (same one used across the app) ──
const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/waitlist
 * Register a new waitlist entry.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { username, email, phoneNumber, branch, year } = body;

    // ── Validation ──
    const errors: Record<string, string> = {};

    if (!username || typeof username !== "string" || !username.trim()) {
      errors.username = "Username is required.";
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      errors.email = "A valid email address is required.";
    }
    if (!phoneNumber || !PHONE_REGEX.test(phoneNumber)) {
      errors.phoneNumber = "A valid 10-digit Indian phone number is required.";
    }
    if (!branch) {
      errors.branch = "Branch is required.";
    }
    if (!year) {
      errors.year = "Year is required.";
    }

    if (Object.keys(errors).length > 0) {
      return Response.json({ error: "Validation failed.", errors }, { status: 400 });
    }

    // ── Check duplicates ──
    const existingEmail = await Waitlist.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return Response.json(
        { error: "This email is already on the waitlist.", field: "email" },
        { status: 409 }
      );
    }

    const existingPhone = await Waitlist.findOne({ phoneNumber: phoneNumber.trim() });
    if (existingPhone) {
      return Response.json(
        { error: "This phone number is already on the waitlist.", field: "phoneNumber" },
        { status: 409 }
      );
    }

    // ── Create entry ──
    const entry = await Waitlist.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      branch,
      year,
    });

    return Response.json(
      { message: "Successfully joined the waitlist!", data: entry },
      { status: 201 }
    );
  } catch (err: unknown) {
    // Handle Mongoose duplicate key errors (race condition fallback)
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      return Response.json(
        { error: "You're already on the waitlist." },
        { status: 409 }
      );
    }
    console.error("[waitlist] POST error:", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}

/**
 * GET /api/waitlist
 * Retrieve all waitlist entries (admin use).
 * Supports: ?search=, ?branch=, ?year=, ?format=csv
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    await dbConnect();

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const branch = searchParams.get("branch") || "";
    const year = searchParams.get("year") || "";
    const format = searchParams.get("format") || "";

    // Build query
    const query: Record<string, unknown> = {};

    if (branch) query.branch = branch;
    if (year) query.year = year;

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { username: regex },
        { email: regex },
        { phoneNumber: regex },
      ];
    }

    const entries = await Waitlist.find(query).sort({ createdAt: -1 }).lean();

    // CSV export
    if (format === "csv") {
      const header = "Username,Email,Phone Number,Branch,Year,Joined On\n";
      const rows = entries
        .map(
          (e: Record<string, unknown>) =>
            `"${e.username}","${e.email}","${e.phoneNumber}","${e.branch}","${e.year}","${new Date(e.createdAt as string).toISOString()}"`
        )
        .join("\n");

      return new Response(header + rows, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="waitlist_${Date.now()}.csv"`,
        },
      });
    }

    return Response.json({ entries, total: entries.length });
  } catch (err) {
    console.error("[waitlist] GET error:", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}

/**
 * DELETE /api/waitlist?id=<mongoId>
 * Remove a single waitlist entry.
 */
export async function DELETE(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    await dbConnect();

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Missing id parameter." }, { status: 400 });
    }

    const deleted = await Waitlist.findByIdAndDelete(id);
    if (!deleted) {
      return Response.json({ error: "Entry not found." }, { status: 404 });
    }

    return Response.json({ message: "Entry deleted." });
  } catch (err) {
    console.error("[waitlist] DELETE error:", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
