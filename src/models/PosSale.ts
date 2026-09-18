import mongoose, { Schema, model, models } from "mongoose";

const PosSaleItemSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

const PosSaleSchema = new Schema(
  {
    items: [PosSaleItemSchema],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["Cash", "Online"], required: true },
  },
  {
    timestamps: true,
  }
);

export default models.PosSale || model("PosSale", PosSaleSchema);
