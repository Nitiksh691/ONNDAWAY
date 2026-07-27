import mongoose, { Schema, model, models } from "mongoose";

const InternApplicationSchema = new Schema({
  name: { type: String, required: true },
  year: { type: String, required: true },
  branch: { type: String, required: true },
  skills: { type: String, required: true },
  project: { type: String, required: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

delete mongoose.models.InternApplication;
export default mongoose.models.InternApplication || model("InternApplication", InternApplicationSchema);
