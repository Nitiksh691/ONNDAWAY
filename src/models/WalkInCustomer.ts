import mongoose, { Schema, model, models } from "mongoose";

const WalkInOrderSchema = new Schema({
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, default: 1 },
      category: { type: String, default: "" },
    },
  ],
  amount: { type: Number, required: true },
  drinkCount: { type: Number, default: 0 },
  isFreeRedeem: { type: Boolean, default: false },
  note: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const WalkInCustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    totalDrinks: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    loyaltyRedeemed: { type: Number, default: 0 },
    orders: { type: [WalkInOrderSchema], default: [] },
  },
  { timestamps: true }
);

export default models.WalkInCustomer ||
  model("WalkInCustomer", WalkInCustomerSchema);
