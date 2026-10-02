const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cloudinary is used automatically whenever its three env vars are set -
// this is the fix for local-disk uploads disappearing on host restarts/
// redeploys (Render's free tier wipes its filesystem on every deploy and
// after idle spin-down). Without those env vars set, everything falls back
// to local disk exactly as before, so local development still works with
// zero Cloudinary setup required.
const useCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    "Cloudinary env vars not set - falling back to local disk storage for uploads. " +
      "This is fine for local development, but uploaded files WILL be lost on redeploy/restart " +
      "if you deploy this way (e.g. on Render's free tier). Set CLOUDINARY_CLOUD_NAME, " +
      "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to fix this before going live."
  );
}

// One folder per feature under backend/uploads/, created on demand so a
// fresh clone doesn't need any manual setup before the first upload.
// (Local-disk path only - unused when Cloudinary is active.)
const makeLocalStorage = (subfolder) => {
  const dest = path.join(__dirname, "..", "..", "uploads", subfolder);
  fs.mkdirSync(dest, { recursive: true });
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, safeName);
    },
  });
};

const makeCloudinaryStorage = (subfolder, allowedExt) => {
  const isImage = allowedExt.every((e) => [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(e));
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `school-erp/${subfolder}`,
      // Cloudinary needs "raw" for non-image files (PDF/ZIP) and "image" for
      // photos, or PDFs get silently mis-served.
      resource_type: isImage ? "image" : "raw",
      public_id: (req, file) => `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      // f_auto/q_auto: serves WebP/AVIF to browsers that support it and
      // picks the smallest quality that still looks right - typically
      // 50-80% smaller than the original upload, no visible difference.
      // This is what actually makes gallery/hero photos fast; storage
      // migration alone (the original point of Cloudinary) doesn't help
      // load speed on its own.
      transformation: isImage ? [{ fetch_format: "auto", quality: "auto" }] : undefined,
    },
  });
};

const makeUploader = (subfolder, allowedExt) => {
  const storage = useCloudinary ? makeCloudinaryStorage(subfolder, allowedExt) : makeLocalStorage(subfolder);

  return multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB - generous enough for a PDF or a small zipped project
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedExt.includes(ext)) {
        return cb(new Error(`Only ${allowedExt.join(", ")} files are allowed`));
      }
      cb(null, true);
    },
  });
};

// Assignments: teacher instructions (PDF) and student submissions (PDF or ZIP)
const assignmentUpload = makeUploader("assignments", [".pdf", ".zip"]);
// Projects: student uploads, typically zipped source
const projectUpload = makeUploader("projects", [".pdf", ".zip"]);
// Gallery: admin-uploaded school photos (campus, events, sports, etc.)
const galleryUpload = makeUploader("gallery", [".jpg", ".jpeg", ".png", ".webp"]);
// Syllabus: optional full syllabus/prospectus PDF per class+semester
const syllabusUpload = makeUploader("syllabus", [".pdf"]);
// Notices/events: optional image shown on the notice/event card (e.g. an
// Annual Function poster)
const noticeUpload = makeUploader("notices", [".jpg", ".jpeg", ".png", ".webp"]);
// Toppers: student photo for the academic achievers section
const topperUpload = makeUploader("toppers", [".jpg", ".jpeg", ".png", ".webp"]);

// Builds the URL to store in the DB and serve back to the frontend.
// - Cloudinary: multer-storage-cloudinary puts the final hosted URL on
//   req.file.path - that's what must be saved, NOT a local /uploads path.
// - Local disk: build the /uploads/<subfolder>/<filename> path the app's
//   own express.static() serves.
// Every controller that accepts an upload MUST use this (not its own copy)
// or files uploaded to Cloudinary get the wrong URL saved and 404 forever.
const fileUrl = (file, subfolder) => {
  if (!file) return undefined;
  return useCloudinary ? file.path : `/uploads/${subfolder}/${file.filename}`;
};

module.exports = {
  assignmentUpload,
  projectUpload,
  galleryUpload,
  syllabusUpload,
  noticeUpload,
  topperUpload,
  useCloudinary,
  cloudinary,
  fileUrl,
};