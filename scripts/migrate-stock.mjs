import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env.local");
  process.exit(1);
}

async function migrateStock() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    
    // Set stock to 999 for all available items that don't have stock or have stock 0.
    const result = await db.collection("menuitems").updateMany(
      { available: true },
      { $set: { stock: 999 } }
    );

    console.log(`Updated ${result.modifiedCount} available menu items to have stock: 999.`);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateStock();
