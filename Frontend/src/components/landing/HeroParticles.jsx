import {
  BookOpen,
  GraduationCap,
  Pencil,
  Star,
  Leaf,
} from "lucide-react";

const particles = [
  {
    Icon: BookOpen,
    className: "left-[8%] top-[15%]",
    size: 42,
    delay: "0s",
    duration: "8s",
  },
  {
    Icon: GraduationCap,
    className: "right-[12%] top-[18%]",
    size: 54,
    delay: "1s",
    duration: "10s",
  },
  {
    Icon: Pencil,
    className: "left-[20%] bottom-[18%]",
    size: 36,
    delay: "2s",
    duration: "9s",
  },
  {
    Icon: Star,
    className: "right-[28%] bottom-[22%]",
    size: 26,
    delay: "1.5s",
    duration: "7s",
  },
  {
    Icon: Leaf,
    className: "left-[55%] top-[10%]",
    size: 32,
    delay: "3s",
    duration: "11s",
  },
];

export default function HeroParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block overflow-hidden">
      {particles.map(({ Icon, className, size, delay, duration }, index) => (
        <Icon
          key={index}
          size={size}
          className={`absolute text-white/10 animate-float ${className}`}
          style={{
            animationDelay: delay,
            animationDuration: duration,
          }}
        />
      ))}
    </div>
  );
}