import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { heroSlides } from "./HeroData";

export default function HeroContent({ activeSlide }) {
  const slide = heroSlides[activeSlide];

  return (
    <div className="w-full max-w-3xl">
      
      {/* Badge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`badge-${slide.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 backdrop-blur-md"
        >
          <span className="text-sm font-medium tracking-wide text-white">
            Since 2010 • CBSE Affiliated
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Heading */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={slide.title}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.7 }}
          className="font-serif text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl"
        >
          {slide.title}
        </motion.h1>
      </AnimatePresence>

      {/* Subtitle */}
      <AnimatePresence mode="wait">
        <motion.p
          key={slide.subtitle}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.7,
            delay: 0.15,
          }}
          className="mt-8 max-w-2xl text-lg leading-8 text-white/90 md:text-xl"
        >
          {slide.subtitle}
        </motion.p>
      </AnimatePresence>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 flex flex-wrap gap-5"
      >
        <Link
           to="/apply"
          className="hero-btn inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-sm font-semibold text-slate-900"
        >
          Apply Now
          <ArrowRight size={18} />
        </Link>

        <a
          href="#about"
          className="hero-btn inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur-md"
        >
          <BookOpen size={18} />
          Explore Campus
        </a>
      </motion.div>

      {/* NEW: Ratings Line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 flex flex-wrap items-center gap-2 text-sm font-medium text-white/90 lg:text-base"
      >
        <span className="text-lg tracking-widest text-amber-400">⭐⭐⭐⭐⭐</span>
        <span>4.9 Rated <span className="mx-2 opacity-50">|</span> 1200+ Families <span className="mx-2 opacity-50">|</span> 25+ Years</span>
      </motion.div>

    </div>
  );
}