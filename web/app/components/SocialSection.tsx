"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/app/context/ThemeContext";

export default function SocialSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const ease = "cubic-bezier(0.22,1,0.36,1)";

  const item = (delay: number): React.CSSProperties => ({
    opacity:    vis ? 1 : 0,
    transform:  vis ? "none" : "translateY(30px)",
    filter:     vis ? "none" : "blur(8px)",
    transition: `opacity 0.7s ${ease} ${delay}ms, transform 0.7s ${ease} ${delay}ms, filter 0.7s ${ease} ${delay}ms`,
  });

  return (
    <section ref={ref} className="relative w-full flex items-center justify-center px-6 py-32" style={{ overflowX: "clip" }}>

      {/* blobs */}
      <div className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.13]"
        style={{ background: "#5470FE", top: "0%", left: "50%", transform: "translateX(-50%)", animation: "blobFloat1 20s ease-in-out infinite" }} />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-lg">

        {/* X icon */}
        <div style={item(0)}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--foreground)" }}>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-3" style={item(80)}>
          <h2 className="font-[family-name:var(--font-akony)] text-3xl md:text-4xl tracking-wide"
            style={isDark ? {
              backgroundImage: "linear-gradient(to right, #5470FE 0%, #ffffff 50%, #5470FE 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            } : { color: "#5470FE" }}>
            We&apos;re on X
          </h2>
          <p className="font-[family-name:var(--font-outfit)] text-base leading-relaxed"
            style={{ color: "var(--foreground)", opacity: 0.45 }}>
            All the latest updates, integrations and announcements —<br />follow us so you never miss a thing.
          </p>
        </div>

        {/* Button */}
        <div style={item(160)}>
          <a
            href="https://x.com/LUMAoracle"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-[family-name:var(--font-outfit)] text-sm font-semibold transition-all hover:scale-105 hover:brightness-110"
            style={{ background: "#5470FE", color: "#fff" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
            </svg>
            @LUMAoracle
          </a>
        </div>

        {/* Divider line */}
        <div style={{ ...item(220), width: "100%" }}>
          <div className="w-full h-px" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)" }} />
          <p className="mt-5 font-[family-name:var(--font-outfit)] text-xs" style={{ color: "var(--foreground)", opacity: 0.2 }}>
            © {new Date().getFullYear()} LUMA. Built on Solana.
          </p>
        </div>
      </div>
    </section>
  );
}
