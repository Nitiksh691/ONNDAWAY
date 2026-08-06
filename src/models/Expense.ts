import { Schema, model, models } from "mongoose";

const ExpenseSchema = new Schema({
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ["Raw Materials", "Milk", "Coffee", "Matcha", "Packaging", "Rent", "Electricity", "Staff Payment", "Miscellaneous", "Other"]
  },
  description: { type: String, default: "" },
  date: { type: Date, default: Date.now },
  addedBy: { type: String, default: "admin" }, // Could be expanded if there are multiple admins
});

export default models.Expense || model("Expense", ExpenseSchema);
