import { useState } from "react";
import { ChevronDown } from "lucide-react";
import HeroSlider from "./HeroSlider";
import HeroContent from "./HeroContent";
import HeroParticles from "./HeroParticles";
import "./hero.css";
// NOTE: I completely removed the 'import HeroStats from "./HeroStats";' line here

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <section id="top" className="hero-section relative w-full overflow-hidden bg-[#081b33]">
      
      {/* 1. BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        <HeroSlider setActiveSlide={setActiveSlide} />
        <HeroParticles />
      </div>

      {/* 2. LAYOUT WRAPPER */}
      <div className="relative z-10 mx-auto flex h-screen min-h-[850px] w-full max-w-7xl flex-col justify-between px-6 pb-8 pt-[120px] lg:px-12 lg:pb-12">
        
        {/* TOP HALF: Text & Buttons */}
        <div className="flex w-full flex-1 flex-col justify-center text-left">
          <HeroContent activeSlide={activeSlide} />
        </div>

        {/* BOTTOM HALF: Scroll Indicator Only */}
        <div className="flex w-full flex-col items-center justify-end pb-10">
          
          {/* <HeroStats /> HAS BEEN COMPLETELY REMOVED FROM HERE */}

          {/* Scroll indicator */}
          <a
            href="#about"
            aria-label="Scroll to learn more"
            className="scroll-indicator mt-6 hidden lg:flex"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:-translate-y-1">
              <ChevronDown size={16} />
            </span>
          </a>
        </div>
        
      </div>
    </section>
  );
}