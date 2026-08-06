import { Schema, model, models } from "mongoose";

const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Biotechnology",
  "Mathematics",
  "Other",
] as const;

const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Alumni",
] as const;

const WaitlistSchema = new Schema({
  username:    { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  phoneNumber: { type: String, required: true, unique: true, trim: true },
  branch:      { type: String, required: true, enum: BRANCHES },
  year:        { type: String, required: true, enum: YEARS },
  createdAt:   { type: Date, default: Date.now },
});

// Indexes for admin search & duplicate prevention
WaitlistSchema.index({ email: 1 }, { unique: true });
WaitlistSchema.index({ phoneNumber: 1 }, { unique: true });
WaitlistSchema.index({ createdAt: -1 });

export default models.Waitlist || model("Waitlist", WaitlistSchema);
