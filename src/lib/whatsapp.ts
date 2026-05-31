/**
 * WhatsApp Messaging Service
 * 
 * This service handles sending automated WhatsApp messages.
 * Currently it implements a mock/logging system, but is structured
 * so that you can easily plug in a provider like Twilio, UltraMsg,
 * or the official WhatsApp Business API.
 */

export async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    // Basic phone number formatting (e.g. ensure country code)
    // If phone doesn't start with +, assume India (+91) for this app's primary context
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;

    console.log(`\n======================================================`);
    console.log(`💬 MOCK WHATSAPP MESSAGE TRIGGERED`);
    console.log(`To: ${formattedPhone}`);
    console.log(`Message:\n${message}`);
    console.log(`======================================================\n`);

    // TODO: To implement real sending, replace the console.log above with an API call:
    // 
    // EXAMPLE (UltraMsg):
    // const res = await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}/messages/chat`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //   body: new URLSearchParams({
    //     token: process.env.ULTRAMSG_TOKEN || "",
    //     to: formattedPhone,
    //     body: message
    //   })
    // });
    // return await res.json();
    
    // Return true indicating "success" for the mock
    return { success: true, mocked: true };
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return { success: false, error };
  }
}
