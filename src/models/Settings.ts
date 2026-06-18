import mongoose, { Schema, model, models } from "mongoose";

const SettingsSchema = new Schema({
  deliveryFee: { type: Number, default: 20 },
  bannerEnabled: { type: Boolean, default: true },
  bannerMode: { type: String, enum: ["single", "bento"], default: "single" },
  bannerSlides: [{
    id: String,
    text: String,
    subText: String,
    image: String,
    link: String,
    active: { type: Boolean, default: true }
  }],
  bentoSlides: [{
    position: Number, // 0-5
    slides: [{
      id: String,
      text: String,
      subText: String,
      image: String,
      link: String,
      active: { type: Boolean, default: true }
    }]
  }],
  updatedAt:   { type: Date, default: Date.now },
});

// Prevent Mongoose from caching the old schema during Next.js hot-reloads
if (models.Settings) {
  delete models.Settings;
}

export default model("Settings", SettingsSchema);
