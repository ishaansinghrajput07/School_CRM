import { initials } from "../../utils/avatars";

const SIZES = {
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-28 w-28 text-4xl",
};

export default function Avatar({ src, name, size = "sm", className = "" }) {
  const sizeClasses = SIZES[size] || SIZES.sm;

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Profile"}
        className={`${sizeClasses} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} flex shrink-0 items-center justify-center rounded-full bg-teal-500 font-semibold text-white ${className}`}
    >
      {initials(name)}
    </div>
  );
}
