// Uploaded files are served from the backend's static /uploads path, not
// under /api - so we strip a trailing "/api" off the configured API URL.
const API_BASE = import.meta.env.VITE_API_URL;
const API_ROOT = (API_BASE || "/api").replace(/\/+$/, "");
// Guard against a missing env var: without this, ORIGIN.replace() throws at
// module load and crashes the entire app (blank white screen), not just
// image loading. See src/api/axios.js for the corresponding console warning.
const ORIGIN = API_BASE ? API_BASE.replace(/\/api\/?$/, "") : "";

export function resolveFileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/demo-gallery/")) return `${API_ROOT}${path}`;
  return `${ORIGIN}${path}`;
}