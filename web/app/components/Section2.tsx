"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/app/context/ThemeContext";

export default function Section2() {
  const { theme } = useTheme();
  const fg = theme === "light" ? "#000000" : "#FFFFFF";
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const raw = 1 - rect.top / window.innerHeight;
      setProgress(Math.min(Math.max(raw, 0), 1));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const arcReveal = Math.min(progress * 2.5, 1);
  const arcBlur = (1 - arcReveal) * 12;

  const titleProgress = Math.min(Math.max((progress - 0.15) * 2.5, 0), 1);
  const titleBlur = (1 - titleProgress) * 10;
  const titleY = (1 - titleProgress) * 40;

  const subProgress = Math.min(Math.max((progress - 0.3) * 2.5, 0), 1);
  const subBlur = (1 - subProgress) * 10;
  const subY = (1 - subProgress) * 30;

  return (
    <section ref={sectionRef} className="relative w-full h-[150vh]" style={{ overflowX: "clip" }}>
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-visible z-10" style={{ background: "var(--background)" }}>
        {/* Top gradient (mirrored) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 z-10"
          style={{
            opacity: 1,
            background: "radial-gradient(ellipse 80% 100% at 50% 0%, #5470FE 0%, rgba(84,112,254,0.4) 40%, transparent 70%)",
          }}
        />

        {/* Inverted arc — attached to top */}
        <div
          className="absolute z-10 pointer-events-none left-1/2 w-[90vw] md:w-[75vw]"
          style={{
            top: 0,
            transform: "translateX(-50%) scaleY(-1)",
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
              <linearGradient id="arcGrad2" x1="500" y1="10" x2="500" y2="510" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#5470FE" stopOpacity="0" />
                <stop offset="45%" stopColor="#5470FE" stopOpacity="0.7" />
                <stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="glowGrad2" x1="500" y1="10" x2="500" y2="510" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#5470FE" stopOpacity="0" />
                <stop offset="50%" stopColor="#5470FE" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.8" />
              </linearGradient>
              <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
              </filter>
            </defs>

            {/* Soft glow — arc + legs */}
            <path
              d="M 0 700 L 0 510 A 500 500 0 0 1 1000 510 L 1000 700"
              stroke="url(#glowGrad2)"
              strokeWidth="12"
              fill="none"
              filter="url(#glow2)"
            />

            {/* Core line — arc + legs */}
            <path
              d="M 0 700 L 0 510 A 500 500 0 0 1 1000 510 L 1000 700"
              stroke="url(#arcGrad2)"
              strokeWidth="3"
              fill="none"
            />
          </svg>
        </div>

        {/* Text content — inside the inverted arc */}
        <div className="relative z-20 flex flex-col items-center gap-6 px-6 text-center -mt-[15vh]">
          <h2
            className="font-[family-name:var(--font-akony)] text-[1.5rem] sm:text-[2.5rem] md:text-[3.5rem] leading-tight"
            style={theme === "light" ? {
              opacity: titleProgress,
              filter: `blur(${titleBlur}px)`,
              transform: `translateY(${titleY}px)`,
              color: "#5470FE",
            } : {
              opacity: titleProgress,
              filter: `blur(${titleBlur}px)`,
              transform: `translateY(${titleY}px)`,
              backgroundImage: `linear-gradient(to right, #ffffff 0%, #5470FE 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            On-chain Oracle
          </h2>
          <p
            className="font-[family-name:var(--font-outfit)] text-sm sm:text-base md:text-lg max-w-lg leading-relaxed"
            style={{
              opacity: subProgress,
              filter: `blur(${subBlur}px)`,
              transform: `translateY(${subY}px)`,
              color: theme === "light" ? "#5470FE" : "rgba(255,255,255,0.5)",
            }}
          >
            Push any API data to Solana. Automated feeds
            with flexible scheduling — loop or exact time.
          </p>
        </div>
      </div>
    </section>
  );
}
