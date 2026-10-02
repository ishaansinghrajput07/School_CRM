/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Public site's outer section width - wider than the app-wide 7xl
      // (1280px) so landing sections use more of the screen on large
      // desktops (1440-1920px) without touching any dashboard layout.
      maxWidth: {
        site: "1600px",
      },
      colors: {
        // Design tokens for the School ERP - deep navy for trust/authority,
        // teal for secondary actions, amber as the single warm accent for alerts.
        navy: {
          50: "#eef2f6",
          100: "#d4dee8",
          200: "#a9bdd1",
          300: "#7e9cba",
          400: "#4a6f96",
          500: "#1E3A5F",
          600: "#1a3252",
          700: "#152841",
          800: "#101e31",
          900: "#0b1520",
        },
        teal: {
          50: "#eafafa",
          100: "#c7efef",
          500: "#2C7A7B",
          600: "#256867",
          700: "#1d5253",
        },
        amber: {
          50: "#fdf3e2",
          100: "#fae3b8",
          500: "#E8A33D",
          600: "#c98726",
        },
        // Landing-page-only accents: a premium violet + coral pair layered
        // on top of the existing navy/teal/amber system for the marketing
        // site, kept out of the dashboard chrome.
        violet: {
          50: "#f1efff",
          100: "#e0dcfe",
          400: "#8b7cf6",
          500: "#6C5CE7",
          600: "#5541d1",
          700: "#4230a6",
        },
        coral: {
          50: "#fff1ee",
          100: "#ffdcd4",
          400: "#ff8a79",
          500: "#FF6B5C",
          600: "#e94f3f",
        },
        surface: "#F7F8FA",
        // Public school-site palette (Landing page only) - warm paper in
        // place of the app's cool grey surface, so the homepage reads as a
        // school prospectus rather than dashboard chrome bleeding outward.
        paper: {
          DEFAULT: "#FAF5E9",
          dark: "#F0E6D2",
        },
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
        // Public school-site display face only - a characterful serif for
        // headlines on the homepage, kept out of the dashboard app itself.
        serif: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 30, 49, 0.06), 0 1px 3px 0 rgba(16, 30, 49, 0.08)",
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px -15px rgba(108, 92, 231, 0.45)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(4%, 6%) scale(1.08)" },
          "66%": { transform: "translate(-3%, -4%) scale(0.96)" },
        },
        "fade-up": {
          from: { opacity: 0, transform: "translateY(18px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        "drift-slow": "drift 26s ease-in-out infinite reverse",
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
        float: "float 4s ease-in-out infinite",
        marquee: "marquee 22s linear infinite",
        "marquee-reverse": "marquee 22s linear infinite reverse",
      },
    },
  },
  plugins: [],
};