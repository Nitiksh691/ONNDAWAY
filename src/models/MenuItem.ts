import mongoose, { Schema, model, models } from "mongoose";

const MenuItemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, enum: ["coffee", "snacks", "meals", "drinks", "desserts"], required: true },
  orderCount: { type: Number, default: 0 },
  available: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  isRecommended: { type: Boolean, default: false },
  isBanner: { type: Boolean, default: false },
  originalPrice: { type: Number, default: null },
  section: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default models.MenuItem || model("MenuItem", MenuItemSchema);
