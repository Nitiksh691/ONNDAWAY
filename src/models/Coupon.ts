import { Schema, model, models } from "mongoose";

const CouponSchema = new Schema({
  code:           { type: String, required: true, unique: true, uppercase: true },
  discount:       { type: Number, required: true },
  type:           { type: String, enum: ["percentage", "flat"], required: true },
  label:          { type: String, required: true },
  active:         { type: Boolean, default: true },
  createdAt:      { type: Date, default: Date.now },
});

export default models.Coupon || model("Coupon", CouponSchema);
