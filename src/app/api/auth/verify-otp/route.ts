import { NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { user_json_url, name, image } = await req.json();

    if (!user_json_url) {
      return NextResponse.json({ error: "Missing verification URL" }, { status: 400 });
    }

    const fetchRes = await fetch(user_json_url);
    if (!fetchRes.ok) {
      console.error("Phone.email API returned status:", fetchRes.status);
      return NextResponse.json({ error: "Failed to verify with Phone.email server" }, { status: 400 });
    }
    
    const data = await fetchRes.json();
    console.log("Phone.email Data:", data); // Helpful for debugging mobile number issues

    const { user_country_code, user_phone_number, user_first_name, user_email } = data;
    
    if (!user_phone_number) {
       return NextResponse.json({ error: "Verification failed. No phone number returned." }, { status: 400 });
    }

    await dbConnect();
    
    // Find or create user
    let user = await User.findOne({ phone: user_phone_number });
    
    if (!user) {
      // If user doesn't exist, we use the name from the request, or fallback to the provider's name
      const finalName = name || user_first_name || "New Customer";
      const userId = `phone_${user_phone_number}`;
      
      user = await User.create({
        userId,
        phone: user_phone_number,
        name: finalName,
        email: user_email, // If we got an email
        image: image || "",
      });
    } else {
       // Update if they provided new name/image
       if (name && name !== user.name) user.name = name;
       if (image && image !== user.image) user.image = image;
       if (user_email && !user.email) user.email = user_email;
       await user.save();
    }

    return NextResponse.json({ 
       success: true, 
       userId: user._id.toString(),
       user: {
         phone: user.phone,
         name: user.name,
         email: user.email
       }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to verify OTP" }, { status: 500 });
  }
}
