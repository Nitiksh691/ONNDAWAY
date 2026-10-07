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
  // Launching Soon mode: allows browsing but shows popup on add to cart
  launchingSoonMode: { type: Boolean, default: false },
  // Online Payment Enable/Disable
  onlinePaymentEnabled: { type: Boolean, default: true },
  codEnabled: { type: Boolean, default: false },
  // Pause new orders (heavy traffic)
  ordersPaused: { type: Boolean, default: false },

  // Server-Driven UI (SDUI) Homepage Layout Config
  homeLayout: {
    categoryIconsBar: {
      enabled: { type: Boolean, default: true },
    },
    freeDelivery: {
      enabled: { type: Boolean, default: true },
      headingText: { type: String, default: "FREE DELIVERY ABOVE ₹" },
      subText: { type: String, default: "Use code at checkout" },
      minAmount: { type: Number, default: 199 },
      code: { type: String, default: "FREEDEL" },
      bgGradient: { type: String, default: "linear-gradient(135deg, #FF7E00 0%, #FF3D00 100%)" },
      bgImage: { type: String, default: "" },
    },
    dealOfTheDay: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: "Deal of the Day" },
      subtitle: { type: String, default: "Handpicked mega discounts ending soon" },
      showTimer: { type: Boolean, default: true },
      endTime: { type: String, default: "23:59:59" },
      itemIds: [{ type: String }],
    },
    comboPromo: {
      enabled: { type: Boolean, default: true },
      subtitle: { type: String, default: "COMBO SPECIAL" },
      title: { type: String, default: "COFFEE + SANDWICH" },
      priceText: { type: String, default: "149" },
      originalPriceText: { type: String, default: "249" },
      link: { type: String, default: "/menu" },
      bgGradient: { type: String, default: "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)" },
      image: { type: String, default: "" },
    },
    orderAgain: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: "Order again" },
      subtitle: { type: String, default: "Your recent favorites" },
    },
    browseMenu: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: "Browse menu" },
      subtitle: { type: String, default: "Explore all categories" },
    },
  },
  updatedAt: { type: Date, default: Date.now },
});

delete models.Settings;
export default models.Settings || model("Settings", SettingsSchema);
