import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    userId:        { type: String, required: true, unique: true, index: true },
    username:      { type: String, unique: true, sparse: true },
    password:      { type: String },
    name:          { type: String, default: "" },
    year:          { type: String, default: "" },
    accommodation: { type: String, default: "" },
    location:      { type: String, default: "" },
    phone:         { type: String, default: "" },
    gender:        { type: String, enum: ["boy", "girl", ""], default: "" },
    role:          { type: String, enum: ["user", "admin", "delivery"], default: "user" },
    lastLoginAt:   { type: Date, default: null }, // updated on each successful login
    createdAt:     { type: Date, default: Date.now },
  }
);

// Phone index — lookups by phone number are common in admin views
UserSchema.index({ phone: 1 });

export default models.User || model("User", UserSchema);

