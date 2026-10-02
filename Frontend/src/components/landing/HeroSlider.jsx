import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

import { heroSlides } from "./HeroData";

export default function HeroSlider({ setActiveSlide }) {
  // Swiper v9+ dropped the old "Lazy" module entirely (it's not exported
  // from swiper/modules anymore) - native loading="lazy" doesn't help
  // either, since fade effect stacks every slide in the same spot, so
  // they're all geometrically "in view" from the first paint. So this
  // tracks manually, in plain React state, which slide indices are
  // allowed to actually have an src yet: just the first slide, plus
  // whichever ones autoplay has already brought into view. Everything
  // else renders with no src at all until its turn comes.
  const [loaded, setLoaded] = useState(() => new Set([0]));

  const revealSlide = (i) => {
    setLoaded((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  };

  return (
    <Swiper
      modules={[EffectFade, Pagination, Autoplay]}
      effect="fade"
      fadeEffect={{ crossFade: true }}
      slidesPerView={1}
      loop={true}
      speed={1200}
      pagination={{ clickable: true }}
      autoplay={{ delay: 6000, disableOnInteraction: false }}
      onSlideChange={(swiper) => {
        const i = swiper.realIndex;
        setActiveSlide(i);
        revealSlide(i);
        // Pre-load the next slide one step ahead so its crossfade doesn't
        // start on a blank image.
        revealSlide((i + 1) % heroSlides.length);
      }}
      className="h-full w-full"
    >
      {heroSlides.map((slide, i) => (
        <SwiperSlide key={slide.id}>
          <div className="hero-slide">
            {loaded.has(i) ? (
              <img
                src={slide.image}
                alt={slide.title}
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            ) : (
              <div className="hero-slide-placeholder" aria-hidden />
            )}
            <div className="hero-overlay" />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}