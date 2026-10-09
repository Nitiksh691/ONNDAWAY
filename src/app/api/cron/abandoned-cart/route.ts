import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";
import { sendPushNotification } from "@/lib/push";

// Ensure DB is connected
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI as string);
};

export async function GET(req: Request) {
  try {
    // Basic security: require a cron secret to prevent random people from triggering this
    const authHeader = req.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000); // Stop bugging them after 2 hours

    // Find users whose cart was updated between 30 mins and 2 hours ago, and haven't been notified yet
    const abandonedUsers = await User.find({
      lastCartUpdate: { $lte: thirtyMinutesAgo, $gt: twoHoursAgo },
      abandonedCartNotified: false,
      pushSubscription: { $ne: null },
    });

    let notifiedCount = 0;

    const funnyMessages = [
      { title: "🥺 Your burger has abandonment issues...", message: "It's sitting in your cart feeling very unloved right now. Come back!" },
      { title: "🚨 Hunger detected!", message: "Your brain says 'study,' but your stomach says 'order the cart.' Listen to your stomach." },
      { title: "💔 So... we're just ignoring each other now?", message: "You left some deliciousness in your cart. Let's finish what we started." },
      { title: "🍔 Let’s be honest...", message: "You're going to order it eventually. Why make yourself wait 30 more minutes? Check out now!" },
      { title: "💀 Not you ghosting your own food...", message: "Your cart is literally right there waiting for you. Don't do this to us." }
    ];

    for (const user of abandonedUsers) {
      const randomMsg = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      
      const success = await sendPushNotification(user.pushSubscription, {
        title: randomMsg.title,
        message: randomMsg.message,
        url: "/checkout",
      });

      if (success) {
        user.abandonedCartNotified = true;
        await user.save();
        notifiedCount++;
      }
    }

    return NextResponse.json({ success: true, notifiedCount });
  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
