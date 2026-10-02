const fs = require("fs");
const path = require("path");
const { useCloudinary, cloudinary } = require("../middleware/upload");

// Optional feature, same pattern as Cloudinary elsewhere in this app: works
// with zero setup for everything else, this one specific feature just
// won't be available until OPENAI_API_KEY is set.
const isConfigured = () => Boolean(process.env.OPENAI_API_KEY);

// @param prompt - plain-language description, e.g. "Annual Function" -
//                 the caller builds a fuller prompt around this.
// @returns the final image URL to store on the notice (Cloudinary URL if
//          configured, otherwise a local /uploads/notices/... path).
const generateNoticeImage = async (prompt) => {
  if (!isConfigured()) {
    const err = new Error(
      "AI image generation isn't set up yet. Add OPENAI_API_KEY to your backend .env " +
        "(get one at platform.openai.com/api-keys) - this is a paid API, priced per image, " +
        "separate from any ChatGPT subscription."
    );
    err.statusCode = 400;
    throw err;
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1536x1024", // landscape - matches the notice card's banner shape
      quality: "medium",
      n: 1,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const err = new Error(`Image generation failed: ${response.status} ${body.slice(0, 300)}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {
    const err = new Error("Image generation returned no image data");
    err.statusCode = 502;
    throw err;
  }

  if (useCloudinary) {
    const uploaded = await cloudinary.uploader.upload(`data:image/png;base64,${b64}`, {
      folder: "school-erp/notices",
      resource_type: "image",
      transformation: [{ fetch_format: "auto", quality: "auto" }],
    });
    return uploaded.secure_url;
  }

  const dest = path.join(__dirname, "..", "..", "uploads", "notices");
  fs.mkdirSync(dest, { recursive: true });
  const filename = `ai-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
  fs.writeFileSync(path.join(dest, filename), Buffer.from(b64, "base64"));
  return `/uploads/notices/${filename}`;
};

module.exports = { generateNoticeImage };