import { Schema, model, models } from "mongoose";

const StoreInventorySchema = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
      index: true,
    },
    // Explicit stock count (null means unlimited/untracked)
    stock: {
      type: Number,
      default: null,
    },
    // Reserved quantity in pending payments/checkouts
    reservedStock: {
      type: Number,
      default: 0,
    },
    // Fast toggle for store collaborator to mark out-of-stock
    isAvailable: {
      type: Boolean,
      default: true,
    },
    // Optional price override for this store (falls back to MenuItem.price if null)
    price: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique compound index so each store has at most one inventory entry per menuItem
StoreInventorySchema.index({ storeId: 1, menuItemId: 1 }, { unique: true });
StoreInventorySchema.index({ storeId: 1, isAvailable: 1 });

export default models.StoreInventory || model("StoreInventory", StoreInventorySchema);
