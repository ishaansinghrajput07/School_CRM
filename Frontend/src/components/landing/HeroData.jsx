// Captions for the rotating hero slides, in display order. If there are
// more images in assets/hero/ than captions here, the extra images reuse
// the last caption rather than crashing - and vice versa, extra captions
// beyond the number of images are simply unused. Add/remove images in
// assets/hero/ freely; you don't need to touch this array's length to
// match exactly, though keeping them in sync gives the best result.
const CAPTIONS = [
  { title: "Welcome to St. Thomas Convent School", subtitle: "Nurturing Minds • Building Character • Inspiring Excellence" },
  { title: "Interactive Smart Classrooms", subtitle: "Technology-enabled learning that inspires curiosity and confidence." },
  { title: "Modern Science Laboratories", subtitle: "Hands-on experiments that transform ideas into discoveries." },
  { title: "Future Ready Computer Labs", subtitle: "Empowering students with digital skills, coding, and innovation." },
  { title: "A World of Knowledge", subtitle: "Quiet spaces that encourage reading, imagination, and lifelong learning." },
  { title: "Excellence Beyond Academics", subtitle: "Sports and fitness that build confidence, teamwork, and leadership." },
  { title: "Creativity Without Limits", subtitle: "Dance, music, drama, and culture that help every child shine." },
  { title: "Learning Through Innovation", subtitle: "Creative projects that inspire problem-solving and imagination." },
  { title: "Celebrating Achievements", subtitle: "Recognizing excellence in academics, sports, and co-curricular activities." },
  { title: "A Safe & Inspiring Campus", subtitle: "A vibrant environment where every child learns, grows, and succeeds." },
  { title: "Building Lifelong Friendships", subtitle: "A caring community where students grow together with shared values." },
  { title: "Admissions Open", subtitle: "Join a community dedicated to academic excellence and holistic development." },
];

// Dynamically pulls in whatever images actually exist in assets/hero/ -
// deliberately NOT 12 hardcoded `import heroN from "..."` lines. Those
// fail the entire production build the moment a single file is missing,
// renamed, or a different extension (the same class of bug that broke
// the Salary and idCardCompact imports earlier). This way, dropping a
// new photo into assets/hero/ or removing one just works, no code change
// needed, and a missing file degrades gracefully instead of breaking the
// whole site.
const modules = import.meta.glob("../../assets/hero/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const images = Object.keys(modules)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
  .map((path) => modules[path]);

export const heroSlides = images.map((image, i) => ({
  id: i + 1,
  image,
  title: (CAPTIONS[i] || CAPTIONS[CAPTIONS.length - 1]).title,
  subtitle: (CAPTIONS[i] || CAPTIONS[CAPTIONS.length - 1]).subtitle,
}));