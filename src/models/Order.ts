import mongoose, { Schema, model, models } from "mongoose";

const OrderSchema = new Schema({
  userId:             { type: String, required: true, index: true },
  userName:           { type: String, required: true },
  userPhone:          { type: String, required: true },
  items:              { type: Schema.Types.Mixed, required: true },
  location:           { type: String, required: true },
  total:              { type: Number, required: true },
  couponCode:         { type: String, default: null },
  discount:           { type: Number, default: 0 },
  status:             { type: String, enum: ["placed", "preparing", "out_for_delivery", "delivered", "cancelled"], default: "placed", index: true },
  confirmed:          { type: Boolean, default: false },
  scheduledTime:      { type: String, default: null },
  deliveryPersonId:   { type: String, default: null },
  deliveryPersonName: { type: String, default: null },
  deliveryOtp:        { type: String, default: null },
  messages:           { type: [{ sender: String, text: String, timestamp: { type: Date, default: Date.now } }], default: [] },
}, { timestamps: true });

export default models.Order || model("Order", OrderSchema);
