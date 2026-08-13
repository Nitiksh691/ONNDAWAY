import { Schema, model, models } from "mongoose";

const WebhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    orderId: { type: String },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.WebhookEvent || model("WebhookEvent", WebhookEventSchema);
