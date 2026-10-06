import { Schema, model, models } from "mongoose";

const CategorySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String, default: "" },
  // "food" = existing cafe stuff, "store" = new grocery expansion
  type: { type: String, enum: ["food", "store"], default: "store" }, 
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  subcategories: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CategorySchema.index({ slug: 1 });
CategorySchema.index({ type: 1, active: 1, sortOrder: 1 });

export default models.Category || model("Category", CategorySchema);
