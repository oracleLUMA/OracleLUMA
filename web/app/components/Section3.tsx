"use client";

import { useEffect, useRef, useState } from "react";
import BentoGrid from "./BentoGrid";
import { useTheme } from "@/app/context/ThemeContext";

export default function Section3() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const { theme } = useTheme();
  const fg = theme === "light" ? "#000000" : "#FFFFFF";

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const raw = 1 - rect.top / window.innerHeight;
      setProgress(Math.min(Math.max(raw, 0), 1));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const titleP = Math.min(Math.max((progress - 0.1) * 3, 0), 1);
  const subP = Math.min(Math.max((progress - 0.2) * 3, 0), 1);

  return (
    <section ref={ref} className="relative w-full pt-16 pb-16 overflow-clip">
      {/* Background blobs */}
      <div
        className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-[0.12]"
        style={{
          background: "#5470FE",
          bottom: "5%",
          right: "-5%",
          animation: "blobFloat1 22s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute w-[450px] h-[450px] rounded-full blur-[80px] opacity-[0.1]"
        style={{
          background: "#5470FE",
          top: "5%",
          left: "-12%",
          animation: "blobFloat2 18s ease-in-out infinite",
        }}
      />

      {/* Heading */}
      <div className="relative z-20 flex flex-col items-center gap-4 px-6 text-center mb-16">
        <h2
          className="font-[family-name:var(--font-akony)] text-[1.5rem] sm:text-[2.5rem] md:text-[3.5rem] leading-tight"
          style={theme === "light" ? {
            opacity: titleP,
            filter: `blur(${(1 - titleP) * 10}px)`,
            transform: `translateY(${(1 - titleP) * 30}px)`,
            color: "#5470FE",
          } : {
            opacity: titleP,
            filter: `blur(${(1 - titleP) * 10}px)`,
            transform: `translateY(${(1 - titleP) * 30}px)`,
            backgroundImage: `linear-gradient(to right, #ffffff 0%, #5470FE 50%, #ffffff 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Any data, one feed
        </h2>
        <p
          className="font-[family-name:var(--font-outfit)] text-sm sm:text-base md:text-lg max-w-md"
          style={{
            opacity: subP,
            filter: `blur(${(1 - subP) * 10}px)`,
            transform: `translateY(${(1 - subP) * 20}px)`,
            color: theme === "light" ? "#5470FE" : "rgba(255,255,255,0.4)",
          }}
        >
          Prices, sports, weather — push anything on-chain.
        </p>
      </div>

      <div className="relative z-20">
        <BentoGrid />
      </div>
    </section>
  );
}
