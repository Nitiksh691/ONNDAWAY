import { Schema, model, models } from "mongoose";

const StoreSchema = new Schema(
  {
    name:         { type: String, required: true },
    slug:         { type: String, required: true, unique: true, index: true },
    code:         { type: String, required: true, unique: true },
    address:      { type: String, required: true },
    city:         { type: String, default: "Delhi" },
    state:        { type: String, default: "Delhi" },
    country:      { type: String, default: "India" },
    postalCode:   { type: String, default: "" },

    // ── Geospatial Coordinates [longitude, latitude] ──
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },

    // Maximum delivery radius in kilometers
    serviceRadiusKm: { type: Number, default: 5 },

    // Pre-configured delivery zones/neighborhoods served by this store
    serviceAreas:    { type: [String], default: [] },

    // ── Operational Flags ──
    isActive:          { type: Boolean, default: true },
    isAcceptingOrders: { type: Boolean, default: true },
    isBusy:            { type: Boolean, default: false }, // high demand / rush hour buffer

    // Hours (24-hour format "HH:mm")
    openingTime: { type: String, default: "07:00" },
    closingTime: { type: String, default: "23:59" },

    // Minimum order value & delivery charges specific to this store
    minOrderValue:        { type: Number, default: 0 },
    deliveryFee:          { type: Number, default: 20 },
    estimatedDeliveryMins:{ type: Number, default: 15 },

    // ── Store Manager / Collaborator Access ──
    phone:       { type: String, required: true, unique: true },
    pin:         { type: String, required: true }, // Store portal login PIN
    managerName: { type: String, default: "" },
    banner:      { type: String, default: "" },
    notes:       { type: String, default: "" },
  },
  { timestamps: true }
);

// 2dsphere index for high-speed spatial proximity queries
StoreSchema.index({ location: "2dsphere" });
StoreSchema.index({ isActive: 1, isAcceptingOrders: 1 });
StoreSchema.index({ phone: 1 });

export default models.Store || model("Store", StoreSchema);
