"use client";
import { useState, useEffect } from "react";
import { DollarSign, Calendar, Plus, Wallet } from "lucide-react";
import toast from "react-hot-toast";

interface Expense {
  _id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

const CATEGORIES = ["Raw Materials", "Milk", "Coffee", "Matcha", "Packaging", "Rent", "Electricity", "Staff Payment", "Miscellaneous", "Other"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/admin/expenses");
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return toast.error("Enter a valid amount");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), category, description }),
      });
      if (res.ok) {
        toast.success("Expense added successfully");
        setAmount("");
        setDescription("");
        fetchExpenses(); // Refresh
      } else {
        toast.error("Failed to add expense");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  
  // Helpers
  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
  const getWeekNumber = (d: Date) => {
    const d2 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d2.setUTCDate(d2.getUTCDate() + 4 - (d2.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d2.getUTCFullYear(),0,1));
    return Math.ceil((((d2.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  };

  // Summaries
  let dailyTotal = 0, weeklyTotal = 0, monthlyTotal = 0, yearlyTotal = 0;

  expenses.forEach(ex => {
    const d = new Date(ex.date);
    if (isSameDay(d, today)) dailyTotal += ex.amount;
    if (d.getFullYear() === today.getFullYear() && getWeekNumber(d) === getWeekNumber(today)) weeklyTotal += ex.amount;
    if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) monthlyTotal += ex.amount;
    if (d.getFullYear() === today.getFullYear()) yearlyTotal += ex.amount;
  });

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "8px", color: "var(--text-dark)" }}>Expense Tracker</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>Log and monitor your business operations costs.</p>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        {[
          { label: "Today's Expenses", val: dailyTotal, color: "#EA580C" },
          { label: "This Week", val: weeklyTotal, color: "#2563EB" },
          { label: "This Month", val: monthlyTotal, color: "#7C3AED" },
          { label: "This Year", val: yearlyTotal, color: "#059669" },
        ].map((card, i) => (
          <div key={i} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{card.label}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: card.color }}>₹{card.val.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px" }}>
        {/* Add Expense Form */}
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px", height: "fit-content" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={20} color="var(--primary)"/> Log Expense
          </h3>
          <form onSubmit={handleAddExpense} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="otw-label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#e4e4e7", marginBottom: "8px" }}>Amount (₹) *</label>
              <input type="number" className="otw-input" style={{ background: "#111", border: "1px solid #3f3f46", color: "#fff", borderRadius: "8px", padding: "14px 16px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} placeholder="e.g. 500" value={amount} onChange={e=>setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="otw-label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#e4e4e7", marginBottom: "8px" }}>Category *</label>
              <select className="otw-input" style={{ background: "#111", border: "1px solid #3f3f46", color: "#fff", borderRadius: "8px", padding: "14px 16px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} value={category} onChange={e=>setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="otw-label" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#e4e4e7", marginBottom: "8px" }}>Description (Optional)</label>
              <textarea className="otw-input" style={{ background: "#111", border: "1px solid #3f3f46", color: "#fff", borderRadius: "8px", padding: "14px 16px", width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} rows={3} placeholder="e.g. Bought 5L milk" value={description} onChange={e=>setDescription(e.target.value)} />
            </div>
            <button type="submit" disabled={isSubmitting} style={{ background: "#0055ff", color: "#fff", border: "none", padding: "14px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", marginTop: "8px", fontFamily: "inherit" }}>
              {isSubmitting ? "Saving..." : "Add Expense"}
            </button>
          </form>
        </div>

        {/* Expense History */}
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", padding: "24px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Wallet size={20} color="var(--primary)"/> Expense History
          </h3>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No expenses logged yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "500px", overflowY: "auto", paddingRight: "8px" }}>
              {expenses.map((ex, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid var(--border)", borderRadius: "12px" }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: "4px" }}>{ex.category}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={12}/> {new Date(ex.date).toLocaleString()}
                    </div>
                    {ex.description && <div style={{ fontSize: "0.85rem", marginTop: "6px" }}>{ex.description}</div>}
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#EA580C" }}>
                    -₹{ex.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
