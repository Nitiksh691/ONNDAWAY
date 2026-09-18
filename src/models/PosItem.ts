import mongoose, { Schema, model, models } from "mongoose";

const PosItemSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: "Drink" },
    isActive: { type: Boolean, default: true },
    orderIndex: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default models.PosItem || model("PosItem", PosItemSchema);
