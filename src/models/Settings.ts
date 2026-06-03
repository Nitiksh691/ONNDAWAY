import mongoose, { Schema, model, models } from "mongoose";

const SettingsSchema = new Schema({
  deliveryFee: { type: Number, default: 20 },
  bannerEnabled: { type: Boolean, default: true },
  bannerSlides: [{
    id: String,
    text: String,
    subText: String,
    image: String,
    link: String,
    active: { type: Boolean, default: true }
  }],
  updatedAt:   { type: Date, default: Date.now },
});

export default models.Settings || model("Settings", SettingsSchema);
