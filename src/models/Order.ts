import { Schema, model, models } from "mongoose";

// Properly typed sub-schema replaces Schema.Types.Mixed
// Gives Mongoose validation and makes aggregation on items fields reliable
const CartItemSchema = new Schema(
  {
    cartItemId: { type: String, required: true },
    item: {
      id:          { type: String },
      name:        { type: String },
      price:       { type: Number },
      image:       { type: String },
      category:    { type: String },
      description: { type: String },
    },
    quantity:             { type: Number, required: true, min: 1, default: 1 },
    specialInstructions:  { type: String, default: "" },
    unitPrice:            { type: Number, default: null },
    lineDetails:          { type: String, default: "" },
    selectedCustomizations: {
      type: [{
        category: { type: String },
        option:   { type: String },
        price:    { type: Number, default: 0 },
      }],
      default: [],
    },
  },
  { _id: false } // no extra _id per cart item — saves space
);

const OrderSchema = new Schema(
  {
    idempotencyKey:     { type: String, unique: true, sparse: true },
    userId:             { type: String, required: true },
    userName:           { type: String, required: true },
    userPhone:          { type: String, required: true },
    items:              { type: [CartItemSchema], required: true },
    location:           { type: String, required: true },
    locationNotes:      { type: String, default: "" },
    latitude:           { type: Number, default: null },
    longitude:          { type: Number, default: null },
    total:              { type: Number, required: true },
    couponCode:         { type: String, default: null },
    discount:           { type: Number, default: 0 },
    status:             { type: String, enum: ["placed", "preparing", "out_for_delivery", "delivered", "cancelled"], default: "placed" },
    confirmed:          { type: Boolean, default: false },
    scheduledTime:      { type: String, default: null },
    deliveryPersonId:   { type: String, default: null },
    deliveryPersonName: { type: String, default: null },
    deliveryOtp:        { type: String, default: null },
    messages:           {
      type: [{ sender: String, text: String, timestamp: { type: Date, default: Date.now } }],
      default: [],
    },
    rating:  { type: Number, min: 1, max: 5, default: null },
    review:  { type: String, default: null },
    feedback: { type: String, default: null },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Compound index: most common query pattern (user order history filtered by status)
OrderSchema.index({ userId: 1, status: 1 });
// Compound index: admin dashboard — latest orders by status
OrderSchema.index({ status: 1, createdAt: -1 });
// Compound index: delivery dashboard — assigned orders by status
OrderSchema.index({ deliveryPersonId: 1, status: 1 });

export default models.Order || model("Order", OrderSchema);
