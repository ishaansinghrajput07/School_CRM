const mongoose = require("mongoose");
const dns = require("dns");

// A LOT of "MongoDB connection error: querySrv ENOTFOUND _mongodb._tcp...."
// reports turn out to be the machine's configured DNS resolver silently
// dropping/blocking the DNS SRV record lookup that `mongodb+srv://` URIs
// depend on (common on some ISPs, campus/office networks, and certain
// Windows setups). Atlas's own standard connection string still works fine
// there because it doesn't need an SRV lookup - only the *shortcut*
// `mongodb+srv://` form does. Pointing Node's resolver at a public DNS
// server as a fallback fixes the vast majority of these without the user
// having to change their connection string at all.
dns.setServers([...dns.getServers(), "8.8.8.8", "1.1.1.1"]);

const MAX_RETRIES = 3;

const connectDB = async (attempt = 1) => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set in your .env file.");
    process.exit(1);
  }

  // Catches the single most common seeding mistake: an Atlas SRV string with
  // no database name before the "?" (e.g. ".../?retryWrites=true"). Mongoose
  // will happily connect and silently use the "test" database instead, so
  // `npm run seed` "succeeds" but the app - or you, logging in - looks at a
  // completely different, empty database and nothing you seeded shows up.
  const afterHost = uri.split("@").pop() || "";
  const pathPart = afterHost.split("/")[1] || "";
  const dbNameInUri = pathPart.split("?")[0];
  if (!dbNameInUri) {
    console.warn(
      "WARNING: MONGO_URI has no database name before the '?' - MongoDB will default to a database called \"test\". " +
        'Add it explicitly, e.g. "...mongodb.net/school_erp?retryWrites=true..." - otherwise seeded/admin data won\'t be where the app expects it.'
    );
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000, // fail fast with a clear error instead of hanging silently
      family: 4, // prefer IPv4 - sidesteps IPv6/DNS resolution issues on some networks
      // Default pool is small enough that a burst of concurrent requests
      // (e.g. a dashboard firing 6 fetches at once, multiplied across many
      // simultaneous users) can queue up waiting for a free connection.
      // 50 comfortably covers a single-instance deploy under real load
      // without overwhelming a shared/free-tier Atlas cluster's own limits.
      maxPoolSize: 50,
      minPoolSize: 5,
      // Mongoose builds every model's indexes on every boot by default.
      // Harmless for a small collection, but on a large one (Attendance,
      // years in) that's a real write-lock-holding operation you don't want
      // firing on every deploy - indexes should already exist from earlier
      // boots. Keep it on in dev so new indexes still get created locally.
      autoIndex: process.env.NODE_ENV !== "production",
    });
    console.log(`MongoDB connected: ${conn.connection.host} (database: "${conn.connection.name}")`);
  } catch (err) {
    const isDnsError = err.message.includes("querySrv") || err.code === "ENOTFOUND";
    // Covers both the initial-handshake variant ("SSL routines... alert
    // internal error", "SSL alert number 80") and the post-connect variant
    // seen mid-session (same OpenSSL error text, just fired later by the
    // Node/OpenSSL TLS stack rather than at mongoose.connect() time).
    const isTlsHandshakeError =
      err.message.includes("SSL routines") ||
      err.message.includes("tlsv1 alert") ||
      err.message.includes("SSL alert") ||
      err.code === "ESOCKET";
    const isTransientNetworkError =
      isDnsError ||
      isTlsHandshakeError ||
      err.message.includes("ETIMEDOUT") ||
      err.message.includes("connection timed out") ||
      err.message.includes("whitelist") ||
      err.message.includes("Could not connect to any servers");

    if (isTransientNetworkError && attempt < MAX_RETRIES) {
      console.warn(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}), retrying in 3s...`);
      await new Promise((r) => setTimeout(r, 3000));
      return connectDB(attempt + 1);
    }

    console.error(`MongoDB connection error: ${err.message}`);
    if (isDnsError) {
      console.error(
        "This looks like a DNS resolution failure for the mongodb+srv:// SRV lookup, not a code bug. Things to check:\n" +
          "  1. Your internet/DNS is working (try `ping google.com`).\n" +
          "  2. In Atlas, go to your cluster -> Connect -> Drivers, and try the non-SRV connection string \n" +
          "     (starts with mongodb:// and lists 3 hosts) instead of mongodb+srv:// - it avoids the SRV lookup entirely.\n" +
          "  3. If you're on a VPN or restrictive office/campus network, DNS-over-UDP for SRV records is sometimes blocked - try a different network or a phone hotspot to confirm.\n" +
          "  4. Double check for typos in the cluster hostname in MONGO_URI."
      );
    } else if (isTlsHandshakeError) {
      console.error(
        "==============================================================\n" +
          "This is a TLS/SSL handshake failure between Node and Atlas, not\n" +
          "a code bug - your request never got a valid encrypted connection.\n" +
          "This is a well-known issue on Windows with certain Node versions.\n" +
          "Things to check, roughly in order of likelihood:\n" +
          "  1. Node.js version - some Node 21/22 builds have had TLS\n" +
          "     regressions talking to Atlas on Windows. Try switching to\n" +
          "     Node 20 LTS (nodejs.org) and restart.\n" +
          "  2. Antivirus / firewall SSL inspection - Kaspersky, ESET,\n" +
          "     Windows Defender network protection, or a corporate/campus\n" +
          "     proxy can intercept and corrupt the TLS handshake. Try\n" +
          "     temporarily disabling it, or switch to a mobile hotspot to confirm.\n" +
          "  3. System clock skew - if Windows' clock is off, TLS cert\n" +
          "     validation can fail this way. Settings -> Time & Language -> Sync now.\n" +
          "  4. Outdated Windows root certificates - run Windows Update.\n" +
          "  5. Confirm the Atlas cluster itself is not paused (cloud.mongodb.com).\n" +
          "Fastest way to isolate it: try the same MONGO_URI in MongoDB\n" +
          "Compass or `mongosh` from this machine. If that also fails with\n" +
          "a TLS error, it's your network/OS, not this app. If Compass\n" +
          "connects fine, it's specifically a Node/OpenSSL issue - downgrade Node.\n" +
          "=============================================================="
      );
    } else if (err.message.includes("bad auth") || err.message.includes("Authentication failed")) {
      console.error(
        "Authentication failed. In Atlas, check Database Access -> your DB user's username/password match MONGO_URI exactly. " +
          "If your password contains special characters (@ # % : / etc.), it MUST be URL-encoded in the connection string " +
          "(e.g. '@' becomes '%40') or the URI will be parsed incorrectly."
      );
    } else if (
      err.message.includes("ETIMEDOUT") ||
      err.message.includes("connection timed out") ||
      err.message.includes("whitelist") ||
      err.message.includes("Could not connect to any servers")
    ) {
      console.error(
        "==============================================================\n" +
          "This is the Atlas Network Access (IP allow-list) blocking you.\n" +
          "Your app never even reaches the database - fix it in Atlas:\n" +
          "  1. Log into https://cloud.mongodb.com\n" +
          "  2. Open your project -> Network Access (left sidebar, under Security)\n" +
          "  3. Click \"+ ADD IP ADDRESS\"\n" +
          "  4. For development, click \"ALLOW ACCESS FROM ANYWHERE\" (0.0.0.0/0) -\n" +
          "     this is fine for dev/testing since a valid DB username+password is\n" +
          "     still required; for a real production deploy, add only your\n" +
          "     server's actual IP instead.\n" +
          "  5. Wait ~1-2 minutes for the change to propagate, then restart the app.\n" +
          "If you're on a home/mobile network with an IP that changes often, you'll\n" +
          "hit this again later - 0.0.0.0/0 avoids that during development.\n" +
          "=============================================================="
      );
    }
    process.exit(1);
  }
};

// Mongoose also emits connection-lifecycle events independently of the
// connectDB() call above (e.g. a drop mid-session after a successful
// initial connect, which is what "MongoDB disconnected" / "connection
// error (post-connect)" messages come from). Logging the same TLS guidance
// here means a mid-session SSL alert gets the same actionable message
// instead of just a bare OpenSSL error string.
mongoose.connection.on("error", (err) => {
  const isTlsHandshakeError =
    err.message?.includes("SSL routines") || err.message?.includes("tlsv1 alert") || err.message?.includes("SSL alert");
  if (isTlsHandshakeError) {
    console.error(
      "MongoDB connection error (post-connect): TLS/SSL handshake failure mid-session. " +
        "See the TLS troubleshooting steps above (Node version, antivirus/firewall SSL inspection, " +
        "system clock, Windows root certificates) - this is almost always Node/Windows/network, not app code."
    );
  }
});

module.exports = connectDB;