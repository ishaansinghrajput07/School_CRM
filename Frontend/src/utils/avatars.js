// A small set of friendly, flat-illustration cartoon avatars (male + female)
// built as inline SVG so there's no dependency on an external avatar service
// or extra image assets. Users can pick one of these or upload their own
// photo; either way the result is just stored as a string in User.avatar.
const face = (skin, hair, gender) => `
  <circle cx="50" cy="50" r="50" fill="${skin.bg}"/>
  <ellipse cx="50" cy="58" rx="22" ry="24" fill="${skin.face}"/>
  ${gender === "female"
    ? `<path d="M28 46 Q28 18 50 18 Q72 18 72 46 Q72 30 50 30 Q28 30 28 46 Z" fill="${hair}"/>
       <path d="M26 46 Q24 70 30 84 L34 84 Q30 64 32 48 Z" fill="${hair}"/>
       <path d="M74 46 Q76 70 70 84 L66 84 Q70 64 68 48 Z" fill="${hair}"/>`
    : `<path d="M27 44 Q27 16 50 16 Q73 16 73 44 Q68 30 50 30 Q32 30 27 44 Z" fill="${hair}"/>`
  }
  <circle cx="41" cy="58" r="3.2" fill="#2d3142"/>
  <circle cx="59" cy="58" r="3.2" fill="#2d3142"/>
  <path d="M42 70 Q50 76 58 70" stroke="#2d3142" stroke-width="2.4" fill="none" stroke-linecap="round"/>
`;

const svg = (inner) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`
  )}`;

export const AVATAR_PRESETS = [
  { id: "m1", label: "Male 1", gender: "male", url: svg(face({ bg: "#DCEEFB", face: "#F1C27D" }, "#3B2F2F", "male")) },
  { id: "m2", label: "Male 2", gender: "male", url: svg(face({ bg: "#E4F5E9", face: "#8D5524" }, "#1A1A1A", "male")) },
  { id: "m3", label: "Male 3", gender: "male", url: svg(face({ bg: "#FFF1E0", face: "#FFDBAC" }, "#D2691E", "male")) },
  { id: "f1", label: "Female 1", gender: "female", url: svg(face({ bg: "#FDE8EF", face: "#F1C27D" }, "#4A2C2A", "female")) },
  { id: "f2", label: "Female 2", gender: "female", url: svg(face({ bg: "#EEF0FF", face: "#8D5524" }, "#1A1A1A", "female")) },
  { id: "f3", label: "Female 3", gender: "female", url: svg(face({ bg: "#FFF9E0", face: "#FFDBAC" }, "#A0522D", "female")) },
];

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "U";
