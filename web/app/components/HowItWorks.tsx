"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/app/context/ThemeContext";

const steps = [
  {
    num: "01",
    title: "Create a Feed",
    desc: "Pick any API — crypto, sports, weather. Set the schedule: loop every N seconds or exact UTC time.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5470FE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "We Fetch & Parse",
    desc: "Our server hits the API on your schedule, parses the response with your format rules.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5470FE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Write On-chain",
    desc: "Data gets written to your Solana program account. Verifiable, immutable, always available.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5470FE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /><polyline points="9 15 11 17 15 13" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Dashboard",
    desc: "Monitor every request, see live results and history from your personal dashboard.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5470FE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const { theme } = useTheme();

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

  const titleP = Math.min(Math.max(progress * 4, 0), 1);
  const subP = Math.min(Math.max((progress - 0.05) * 4, 0), 1);
  const lineP = Math.min(Math.max((progress - 0.15) * 1.5, 0), 1);

  return (
    <section ref={sectionRef} className="relative h-[200vh] w-full">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6 overflow-clip" style={{ background: "var(--background)" }}>
      {/* Background blobs */}
      <div
        className="pointer-events-none absolute w-[480px] h-[480px] rounded-full blur-[80px] opacity-[0.11]"
        style={{
          background: "#5470FE",
          top: "10%",
          right: "-8%",
          animation: "blobFloat2 20s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute w-[420px] h-[420px] rounded-full blur-[80px] opacity-[0.09]"
        style={{
          background: "#5470FE",
          bottom: "10%",
          left: "-10%",
          animation: "blobFloat1 24s ease-in-out infinite",
        }}
      />
        {/* Heading */}
        <div className="flex flex-col items-center gap-3 text-center mb-12">
          <h2
            className="font-[family-name:var(--font-akony)] text-[1rem] sm:text-[1.4rem] md:text-[2rem] leading-tight"
            style={theme === "light" ? {
              opacity: titleP,
              filter: `blur(${(1 - titleP) * 10}px)`,
              transform: `translateY(${(1 - titleP) * 30}px)`,
              color: "#5470FE",
            } : {
              opacity: titleP,
              filter: `blur(${(1 - titleP) * 10}px)`,
              transform: `translateY(${(1 - titleP) * 30}px)`,
              backgroundImage: `linear-gradient(to right, #5470FE 0%, #ffffff 50%, #5470FE 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Effortless by design
          </h2>
          <p
            className="font-[family-name:var(--font-outfit)] text-xs sm:text-sm md:text-base max-w-sm"
            style={{
              opacity: subP,
              filter: `blur(${(1 - subP) * 10}px)`,
              transform: `translateY(${(1 - subP) * 20}px)`,
              color: theme === "light" ? "#5470FE" : "rgba(255,255,255,0.4)",
            }}
          >
            Four steps from API to on-chain data.
          </p>
        </div>

        {/* Steps row */}
        <div className="max-w-6xl w-full mx-auto relative px-4">
          {/* Horizontal connecting line */}
          <div className="hidden md:block absolute top-[7px] left-0 right-0 h-px">
            <div
              style={{
                width: `${lineP * 100}%`,
                transition: "width 0.1s linear",
                height: "100%",
                backgroundImage: `linear-gradient(to right, #5470FE, ${theme === "light" ? "rgba(84,112,254,0.2)" : "rgba(255,255,255,0.15)"})`,
              }}
            />
          </div>
          {/* Vertical line for mobile */}
          <div className="md:hidden absolute left-5 top-0 bottom-0 w-px">
            <div
              style={{
                height: `${lineP * 100}%`,
                transition: "height 0.1s linear",
                backgroundImage: `linear-gradient(to bottom, #5470FE, ${theme === "light" ? "rgba(84,112,254,0.2)" : "rgba(255,255,255,0.15)"})`,
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => {
              const stepP = Math.min(Math.max((progress - 0.15 - i * 0.12) * 4, 0), 1);

              return (
                <div
                  key={i}
                  className={`relative pl-12 pr-4 pb-4 md:px-4 md:pt-12 md:pb-4 rounded-2xl${theme === "light" ? " dark-card" : ""}`}
                  style={{
                    opacity: stepP,
                    filter: `blur(${(1 - stepP) * 8}px)`,
                    transform: `translateY(${(1 - stepP) * 25}px)`,
                    background: theme === "light" ? "rgba(0,0,0,0.65)" : "transparent",
                  }}
                >
                  {/* Dot */}
                  <div className="absolute left-[14px] top-1 md:left-1/2 md:-translate-x-1/2 md:top-0 w-4 h-4 rounded-full bg-accent ring-4 ring-black z-10" />

                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      {step.icon}
                    </div>
                    <span className="font-[family-name:var(--font-outfit)] text-[10px] font-semibold tracking-widest" style={{ color: "#5470FE" }}>{step.num}</span>
                  </div>
                  <h3 className="font-[family-name:var(--font-akony)] text-base md:text-lg mb-2" style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>{step.title}</h3>
                  <p className="font-[family-name:var(--font-outfit)] text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
