import { Schema, model, models } from "mongoose";

const DeliveryPersonSchema = new Schema({
  name:           { type: String, required: true },
  phone:          { type: String, required: true, unique: true, index: true },
  email:          { type: String, default: "" },
  password:       { type: String, default: "" },
  storeId:        { type: Schema.Types.ObjectId, ref: "Store", default: null },
  storeName:      { type: String, default: "" },
  activeOrderIds: { type: [String], default: [] },
  active:         { type: Boolean, default: true },
  createdAt:      { type: Date, default: Date.now },
});

export default models.DeliveryPerson || model("DeliveryPerson", DeliveryPersonSchema);
