import { Schema, model, models } from "mongoose";

const VendorSchema = new Schema({
  // ── Identity ──
  name:         { type: String, required: true },
  businessName: { type: String, default: "" },
  phone:        { type: String, required: true, unique: true },
  email:        { type: String, default: "" },
  /** PIN used to log in to vendor portal (stored as plain text for MVP, hash later) */
  pin:          { type: String, required: true },

  // ── Status ──
  active:       { type: Boolean, default: true },
  /** Percentage that goes to vendor per sale (e.g. 70 means 70% of sale price) */
  revenueSharePct: { type: Number, default: 70 },

  // ── Notes ──
  notes:        { type: String, default: "" },

  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now },
});

VendorSchema.index({ phone: 1 });

export default models.Vendor || model("Vendor", VendorSchema);
