"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/app/context/ThemeContext";

export default function Hero() {
  const { theme } = useTheme();
  const fg = theme === "light" ? "#000000" : "#FFFFFF";
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const h = sectionRef.current.offsetHeight;
      const raw = -rect.top / (h - window.innerHeight);
      setProgress(Math.min(Math.max(raw, 0), 1));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const textProgress = Math.min(progress * 2.5, 1);
  const textOpacity = textProgress;
  const textScale = 0.85 + textProgress * 0.15;
  const textBlur = (1 - textProgress) * 12;
  const textY = (1 - textProgress) * 30;
  const glowOpacity = Math.min(progress * 2, 1);
  const gradientBottomOpacity = Math.max(0, (progress - 0.1) * 1.5);
  // 0 → 1: how much of the arc is revealed (bottom to top)
  const arcReveal = Math.min(progress * 2.5, 1);
  const arcBlur = (1 - arcReveal) * 12;

  return (
    <section ref={sectionRef} className="relative h-[200vh] w-full" style={{ overflowX: "clip" }}>
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-visible" style={{ background: "var(--background)" }}>
        {/* Bottom gradient */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 z-10"
          style={{
            opacity: 1,
            background: "radial-gradient(ellipse 80% 100% at 50% 100%, #5470FE 0%, rgba(84,112,254,0.4) 40%, transparent 70%)",
          }}
        />

        {/* Glow behind everything */}
        <div
          className="absolute rounded-full blur-[150px] z-0 max-w-[90vw]"
          style={{
            width: "800px",
            height: "300px",
            background: "#5470FE",
            opacity: glowOpacity * 0.2,
          }}
        />

        {/* Semi-circle line */}
        <div
          className="absolute z-10 pointer-events-none left-1/2 w-[90vw] md:w-[75vw]"
          style={{
            bottom: 0,
            transform: "translateX(-50%)",
            filter: `blur(${arcBlur}px)`,
            maskImage: `linear-gradient(to top, white ${arcReveal * 100}%, transparent ${arcReveal * 100}%)`,
            WebkitMaskImage: `linear-gradient(to top, white ${arcReveal * 100}%, transparent ${arcReveal * 100}%)`,
          }}
        >
          <svg
            viewBox="-60 -60 1120 570"
            fill="none"
            className="w-full"
            style={{ overflow: "visible", display: "block" }}
          >
            <defs>
              <linearGradient id="arcGrad" x1="500" y1="10" x2="500" y2="510" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#5470FE" stopOpacity="0" />
                <stop offset="45%" stopColor="#5470FE" stopOpacity="0.7" />
                <stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="glowGrad" x1="500" y1="10" x2="500" y2="510" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#5470FE" stopOpacity="0" />
                <stop offset="50%" stopColor="#5470FE" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
              </filter>
            </defs>

            {/* Wide soft glow — arc + legs extending down */}
            <path
              d="M 0 700 L 0 510 A 500 500 0 0 1 1000 510 L 1000 700"
              stroke="url(#glowGrad)"
              strokeWidth="12"
              fill="none"
              filter="url(#glow)"
            />

            {/* Core bright line — arc + legs */}
            <path
              d="M 0 700 L 0 510 A 500 500 0 0 1 1000 510 L 1000 700"
              stroke="url(#arcGrad)"
              strokeWidth="3"
              fill="none"
            />
          </svg>
        </div>

        {/* LUMA text — each letter staggers in */}
        <h1
          className="relative z-20 select-none font-[family-name:var(--font-akony)] text-[3rem] sm:text-[5rem] md:text-[8rem] leading-none tracking-wider mt-[5vh] flex"
          style={{
            filter: `blur(${textBlur}px)`,
          }}
        >
          {"LUMA".split("").map((char, i) => {
            const delay = i * 0.08;
            const charProgress = Math.min(Math.max((textProgress - delay) / (1 - delay), 0), 1);
            const isLU = i < 2;
            return (
              <span
                key={i}
                style={theme === "light" ? {
                  opacity: charProgress,
                  transform: `translateY(${(1 - charProgress) * textY}px) scale(${0.9 + charProgress * 0.1})`,
                  display: "inline-block",
                  color: "#5470FE",
                } : {
                  opacity: charProgress,
                  transform: `translateY(${(1 - charProgress) * textY}px) scale(${0.9 + charProgress * 0.1})`,
                  display: "inline-block",
                  backgroundImage: isLU
                    ? `linear-gradient(135deg, #ffffff 0%, #5470FE 25%)`
                    : `linear-gradient(to right, #5470FE 0%, #ffffff 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {char}
              </span>
            );
          })}
        </h1>

        {/* Scroll hint — fades out on scroll */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
          style={{
            opacity: Math.max(0, 1 - progress * 4),
          }}
        >
          <span className="font-[family-name:var(--font-outfit)] text-xs tracking-widest uppercase" style={{ color: theme === "light" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.3)" }}>
            Scroll down
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme === "light" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.3)"} strokeWidth="2" strokeLinecap="round" className="animate-bounce">
            <path d="M7 13l5 5 5-5" /><path d="M7 6l5 5 5-5" />
          </svg>
        </div>

      </div>
    </section>
  );
}
