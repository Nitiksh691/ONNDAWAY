import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  username: { type: String, unique: true, sparse: true },
  password: { type: String },
  name: { type: String, default: "" },
  year: { type: String, default: "" },
  accommodation: { type: String, default: "" },
  location: { type: String, default: "" },
  phone: { type: String, default: "" },
  role: { type: String, enum: ["user", "admin", "delivery"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

export default models.User || model("User", UserSchema);
