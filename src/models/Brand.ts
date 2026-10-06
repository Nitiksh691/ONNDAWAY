import { Schema, model, models } from "mongoose";

const BrandSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String, default: "" },
  banner: { type: String, default: "" },
  description: { type: String, default: "" },
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

BrandSchema.index({ slug: 1 });
BrandSchema.index({ active: 1, sortOrder: 1 });

export default models.Brand || model("Brand", BrandSchema);
