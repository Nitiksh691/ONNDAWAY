import { Schema, model, models } from "mongoose";

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
  // Maintenance mode: shows a full-screen "under repair" page to non-admins
  maintenanceMode: { type: Boolean, default: false },
  maintenancePhone: { type: String, default: "" },
  maintenanceMessage: { type: String, default: "We're currently under maintenance. Please call us to place your order." },
  // Kitchen closed: shows a banner on all pages
  kitchenClosed: { type: Boolean, default: false },
  kitchenOpenTime: { type: String, default: "7:00 AM" },
  // Waitlist mode: redirects or blocks normal access, showing waitlist
  waitlistMode: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

delete models.Settings;
export default models.Settings || model("Settings", SettingsSchema);
