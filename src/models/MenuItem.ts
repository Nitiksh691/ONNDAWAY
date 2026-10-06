import { Schema, model, models } from "mongoose";

const MenuItemSchema = new Schema({
  name:          { type: String, required: true },
  description:   { type: String, required: true },
  price:         { type: Number, required: true },
  image:         { type: String, required: true },
  category:      { type: String, required: true },
  
  // ── World (which tab this item belongs to) ──
  world:         { type: String, enum: ["food", "munchies"], default: "food" },
  
  // ── Grocery / Store Extensions ──
  brand:         { type: String, default: "" },
  subcategory:   { type: String, default: "" },
  unit:          { type: String, default: "" },
  tags:          { type: [String], default: [] },
  badges:        { type: [String], default: [] },
  isDeal:        { type: Boolean, default: false },
  
  orderCount:    { type: Number, default: 0 },
  available:     { type: Boolean, default: true },
  stock:         { type: Number, default: null },
  isPopular:     { type: Boolean, default: false },
  isRecommended: { type: Boolean, default: false },
  isBanner:      { type: Boolean, default: false },
  hasTallSize:   { type: Boolean, default: false },
  isLaunchingSoon: { type: Boolean, default: false },
  originalPrice: { type: Number, default: null },
  section:       { type: String, default: "" },
  sortOrder:     { type: Number, default: 0 },
  customizationCategories: [{
    name:     { type: String, required: true },
    required: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },
    options:  [{
      name:  { type: String, required: true },
      price: { type: Number, default: 0 },
    }],
  }],
  details: [{
    label: { type: String, required: true },
    value: { type: String, required: true },
  }],
  sizes: [{
    name:  { type: String, required: true },
    price: { type: Number, required: true },
  }],
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now },
});

// ── Indexes ────────────────────────────────────────────────────────────────────
// Most common filter: category + available (menu page rendering)
MenuItemSchema.index({ category: 1, available: 1 });
// Popular/recommended item sorting
MenuItemSchema.index({ orderCount: -1 });
MenuItemSchema.index({ brand: 1, available: 1 });
MenuItemSchema.index({ world: 1, available: 1 });

export default models.MenuItem || model("MenuItem", MenuItemSchema);

