import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  // Fail loudly in the console instead of silently shipping a build that
  // points nowhere. If you see this in production, VITE_API_URL was not set
  // when the app was BUILT (Vite bakes env vars in at build time - setting
  // it on the server afterwards does nothing, you must rebuild/redeploy).
  console.error(
    "[config] VITE_API_URL is not set. Set it in your hosting provider's " +
      "environment variables (e.g. Vercel Project Settings -> Environment " +
      "Variables) to your deployed backend URL, e.g. https://your-api.onrender.com/api, " +
      "then redeploy so it gets baked into the build. Falling back to same-origin " +
      "'/api', which will only work if the frontend and backend share a domain."
  );
}

const api = axios.create({
  baseURL: API_URL || "/api",
});

// Attach the JWT to every request once the user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("erp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Bounce back to login on token expiry / invalidation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("erp_token");
      localStorage.removeItem("erp_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;