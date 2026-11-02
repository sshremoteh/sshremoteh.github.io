import React, { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import { FadeIn } from './FadeIn';

interface CharacterProps {
  char: string;
  index: number;
  totalChars: number;
  scrollYProgress: any;
}

const CharacterReveal: React.FC<CharacterProps> = ({
  char,
  index,
  totalChars,
  scrollYProgress,
}) => {
  const charProgress = index / totalChars;
  const start = Math.max(0, charProgress - 0.1);
  const end = Math.min(1, charProgress + 0.05);

  const opacity = useTransform(scrollYProgress, [start, end], [0.2, 1]);

  return (
    <span className="relative inline-block select-none">
      {/* Invisible duplicate holding the space */}
      <span className="opacity-0">{char === ' ' ? '\u00A0' : char}</span>
      {/* Visible animated character on top */}
      <motion.span
        style={{ opacity }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {char === ' ' ? '\u00A0' : char}
      </motion.span>
    </span>
  );
};

export const AboutMe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  });

  const aboutText =
    "With more than five years of experience in design, i focus on branding, web design, and user experience, i truly enjoy working with businesses that aim to stand out and present their best image. Let's build something incredible together!";

  const characters = aboutText.split('');

  return (
    <section
      id="about"
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-5 sm:px-8 md:px-10 py-20 bg-[#0C0C0C] overflow-hidden"
    >
      {/* 4 decorative corner images (absolute positioned, z-0) */}

      {/* 1. Top-left -- Moon icon */}
      <FadeIn
        delay={0.1}
        x={-80}
        y={0}
        duration={0.9}
        className="absolute top-[4%] left-[1%] sm:left-[2%] md:left-[4%] z-0 pointer-events-none select-none"
      >
        <img
          src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/moon_icon.11395d36.png"
          alt="Moon decorative 3D icon"
          className="w-[120px] sm:w-[160px] md:w-[210px] h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
          loading="lazy"
        />
      </FadeIn>

      {/* 2. Bottom-left -- 3D object */}
      <FadeIn
        delay={0.25}
        x={-80}
        y={0}
        duration={0.9}
        className="absolute bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%] z-0 pointer-events-none select-none"
      >
        <img
          src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/p59_1.4659672e.png"
          alt="3D geometric decorative shape"
          className="w-[100px] sm:w-[140px] md:w-[180px] h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
          loading="lazy"
        />
      </FadeIn>

      {/* 3. Top-right -- Lego icon */}
      <FadeIn
        delay={0.15}
        x={80}
        y={0}
        duration={0.9}
        className="absolute top-[4%] right-[1%] sm:right-[2%] md:right-[4%] z-0 pointer-events-none select-none"
      >
        <img
          src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/lego_icon-1.703bb594.png"
          alt="Lego brick decorative 3D icon"
          className="w-[120px] sm:w-[160px] md:w-[210px] h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
          loading="lazy"
        />
      </FadeIn>

      {/* 4. Bottom-right -- 3D group */}
      <FadeIn
        delay={0.3}
        x={80}
        y={0}
        duration={0.9}
        className="absolute bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%] z-0 pointer-events-none select-none"
      >
        <img
          src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/Group_134-1.2e04f3ce.png"
          alt="3D group composition decorative icon"
          className="w-[130px] sm:w-[170px] md:w-[220px] h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
          loading="lazy"
        />
      </FadeIn>

      {/* Center content (relative z-10, max-w-4xl, centered) */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center gap-16 sm:gap-20 md:gap-24 text-center px-4">
        {/* Group 1 -- Heading + Animated Text (gap 10 sm:14 md:16) */}
        <div className="flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
          {/* Heading "About me" */}
          <FadeIn delay={0} y={40}>
            <h2
              className="hero-heading font-black uppercase leading-none tracking-tight text-center"
              style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
            >
              About me
            </h2>
          </FadeIn>

          {/* Animated paragraph (scroll-driven character-by-character reveal) */}
          <div
            className="text-[#D7E2EA] font-medium text-center leading-relaxed max-w-[560px] flex flex-wrap justify-center items-center"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
          >
            {characters.map((char, index) => (
              <CharacterReveal
                key={index}
                char={char}
                index={index}
                totalChars={characters.length}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>
        </div>

        {/* Group 2 -- Contact Button */}
        <FadeIn delay={0.3} y={20}>
          <a
            href="#contact"
            className="promt-contact-btn inline-flex items-center justify-center rounded-full px-8 py-3 sm:px-10 sm:py-3.5 md:px-12 md:py-4 text-white font-medium uppercase tracking-widest text-xs sm:text-sm md:text-base cursor-pointer"
          >
            Contact Me
          </a>
        </FadeIn>
      </div>
    </section>
  );
};
