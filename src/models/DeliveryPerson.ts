import mongoose, { Schema, model, models } from "mongoose";

const DeliveryPersonSchema = new Schema({
  name:           { type: String, required: true },
  phone:          { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  activeOrderIds: { type: [String], default: [] },
  createdAt:      { type: Date, default: Date.now },
});

export default models.DeliveryPerson || model("DeliveryPerson", DeliveryPersonSchema);
