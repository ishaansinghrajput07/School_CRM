const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const compression = require("compression");
const session = require("express-session");

dotenv.config();

const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "SESSION_SECRET"];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(`Missing required environment variable(s): ${missingEnv.join(", ")}`);
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.includes("replace_this")) {
  console.error("JWT_SECRET is still set to the placeholder value from .env.example - refusing to start in production.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && process.env.SESSION_SECRET.includes("replace_this")) {
  console.error("SESSION_SECRET is still set to the placeholder value from .env.example - refusing to start in production.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && !process.env.CLIENT_URL) {
  console.warn(
    "CLIENT_URL is not set in production - CORS will accept requests from any " +
      "origin. Set it to your deployed frontend's exact URL (comma-separated " +
      "if there's more than one, e.g. a custom domain + a Vercel preview URL)."
  );
}

const parseAllowedOrigins = (raw) =>
  (raw || "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_URL);
const isLocalDevelopmentOrigin = (origin) => {
  if (process.env.NODE_ENV === "production") return false;

  try {
    const url = new URL(origin);
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin) => {
  if (!origin || allowedOrigins.length === 0) return true;
  const normalizedOrigin = origin.replace(/\/+$/, "");
  return allowedOrigins.includes(normalizedOrigin) || isLocalDevelopmentOrigin(normalizedOrigin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    callback(new Error(`CORS: origin "${origin}" is not in CLIENT_URL`));
  },
  credentials: true,
};

const connectDB = require("./src/config/db");
const passport = require("./src/config/passport");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");
const { initRealtime } = require("./src/utils/realtime");

// Routes
const authRoutes = require("./src/routes/authRoutes");
const otpRoutes = require("./src/routes/otpRoutes");
const studentRoutes = require("./src/routes/studentRoutes");
const classRoutes = require("./src/routes/classRoutes");
const subjectRoutes = require("./src/routes/subjectRoutes");
const assignmentRoutes = require("./src/routes/assignmentRoutes");
const projectRoutes = require("./src/routes/projectRoutes");
const markRoutes = require("./src/routes/markRoutes");
const resultRoutes = require("./src/routes/resultRoutes");
const calendarRoutes = require("./src/routes/calendarRoutes");
const parentRoutes = require("./src/routes/parentRoutes");
const attendanceRoutes = require("./src/routes/attendanceRoutes");
const feeRoutes = require("./src/routes/feeRoutes");
const feeStructureRoutes = require("./src/routes/feeStructureRoutes");
const invoiceRoutes = require("./src/routes/invoiceRoutes");
const salaryRoutes = require("./src/routes/salaryRoutes");
const staffRoutes = require("./src/routes/staffRoutes");
const accountingRoutes = require("./src/routes/accountingRoutes");
const ticketRoutes = require("./src/routes/ticketRoutes");
const trackingRoutes = require("./src/routes/trackingRoutes");
const noticeRoutes = require("./src/routes/noticeRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const externalResultRoutes = require("./src/routes/externalResultRoutes");
const examRoutes = require("./src/routes/examRoutes");
const settingsRoutes = require("./src/routes/settingsRoutes");
const galleryRoutes = require("./src/routes/galleryRoutes");
const syllabusRoutes = require("./src/routes/syllabusRoutes");
const topperRoutes = require("./src/routes/topperRoutes");
const feedbackRoutes = require("./src/routes/feedbackRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const admissionRoutes = require("./src/routes/admissionRoutes");
const contactInquiryRoutes = require("./src/routes/contactInquiryRoutes");

const app = express();
app.set("trust proxy", 1);

// Connect to MongoDB
connectDB();

// silently and just looks like "nothing works" with no clue why.
mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected - Mongoose will attempt to reconnect automatically."));
mongoose.connection.on("reconnected", () => console.log("MongoDB reconnected."));
mongoose.connection.on("error", (err) => console.error("MongoDB connection error (post-connect):", err.message));

// Global middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(hpp());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/demo-gallery", express.static(path.join(__dirname, "public", "demo-gallery")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false, // don't rewrite unchanged sessions on every request
    saveUninitialized: false, // don't create a session record until something is actually stored in it (e.g. after login)
    name: process.env.SESSION_COOKIE_NAME || "sid", // don't advertise "connect.sid" (the express-session default) - trivial hardening
    rolling: true, // refresh the cookie's maxAge on every request - active users stay logged in, idle ones expire on schedule
    cookie: {
      httpOnly: true, // JS on the frontend can never read this cookie - blocks a class of XSS-driven session theft

      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests - please slow down" },
});
app.use("/api", globalLimiter);

// Basic rate limiting for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts - please wait a few minutes" },
});
app.use("/api/auth/login", loginLimiter);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/marks", markRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/fee-structures", feeStructureRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/external-results", externalResultRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/syllabus", syllabusRoutes);
app.use("/api/toppers", topperRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/contact-inquiries", contactInquiryRoutes);

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOptions.origin,
    credentials: true,
  },
});

initRealtime(io);

const bootstrap = () => {
  httpServer.listen(PORT, () => {
    console.log(`School ERP API running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
    console.log(`Socket.io ready for real-time updates`);
  });
};

bootstrap();

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);
  httpServer.close(async () => {
    console.log("HTTP server closed");
    try {
      await mongoose.connection.close(false);
      console.log("MongoDB connection closed");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err.message);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));