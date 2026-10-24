import { Schema, model, models } from "mongoose";

const OrderSchema = new Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    items: { type: Array, required: true },
    location: { type: String, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "payment_pending",
        "placed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "payment_pending",
    },
    paymentStatus: { type: String, default: "PENDING" },
    paymentMethod: { type: String, required: true },
    deliveryPersonId: { type: String, default: null },
    deliveryPersonName: { type: String, default: null },
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

export const OrderModel = models.Order || model("Order", OrderSchema);
