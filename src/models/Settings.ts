import mongoose, { Schema, model, models } from "mongoose";

const SettingsSchema = new Schema({
  deliveryFee: { type: Number, default: 20 },
  updatedAt:   { type: Date, default: Date.now },
});

export default models.Settings || model("Settings", SettingsSchema);
