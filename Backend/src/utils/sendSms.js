// Provider-agnostic SMS sender. Configure ONE of these in .env:
//
//   Twilio:  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
//   MSG91:   MSG91_AUTH_KEY, MSG91_SENDER_ID, MSG91_TEMPLATE_ID (for OTP route)
//
// If neither is configured, messages are logged to the server console instead
// of sent - lets you build/test the whole OTP flow before signing up for a
// provider. NEVER falls back silently in production (see server.js env check).

const sendViaTwilio = async (to, body) => {
  // Lazy-required so the app doesn't crash if the "twilio" package isn't
  // installed - it's optional and only needed if you choose this provider.
  const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return twilio.messages.create({ to, from: process.env.TWILIO_FROM_NUMBER, body });
};

const sendViaMsg91 = async (to, body) => {
  const res = await fetch("https://api.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: { "Content-Type": "application/json", authkey: process.env.MSG91_AUTH_KEY },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      sender: process.env.MSG91_SENDER_ID,
      mobiles: to.replace("+", ""),
      var: body,
    }),
  });
  if (!res.ok) throw new Error(`MSG91 send failed: ${res.status}`);
  return res.json();
};

const sendSms = async ({ to, body }) => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return sendViaTwilio(to, body);
  }
  if (process.env.MSG91_AUTH_KEY) {
    return sendViaMsg91(to, body);
  }

  console.warn(`SMS not configured - would have sent to ${to}: "${body}"`);
  return { skipped: true };
};

module.exports = { sendSms };
