import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Expense from "@/models/Expense";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  await dbConnect();
  try {
    // Fetch all expenses, sorted by newest first
    const expenses = await Expense.find({}).sort({ date: -1 }).lean();
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  await dbConnect();
  try {
    const body = await req.json();
    const { amount, category, description, date } = body;

    if (!amount || !category) {
      return NextResponse.json({ error: "Amount and category are required" }, { status: 400 });
    }

    const expense = await Expense.create({
      amount: Number(amount),
      category,
      description: description || "",
      date: date ? new Date(date) : new Date(),
      addedBy: "admin"
    });

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error("Error adding expense:", error);
    return NextResponse.json({ error: "Failed to add expense" }, { status: 500 });
  }
}
