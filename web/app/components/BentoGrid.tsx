"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { useTheme } from "@/app/context/ThemeContext";

function generateChart(points: number, seed: number) {
  const pts: [number, number][] = [];
  let y = 45 + (seed % 20);
  for (let i = 0; i < points; i++) {
    y += Math.sin(i * 0.5 + seed) * 6 + Math.cos(i * 1.1 + seed * 2) * 4 + Math.sin(i * 3.7 + seed * 5) * 2;
    y = Math.max(10, Math.min(90, y));
    pts.push([i * (300 / (points - 1)), y]);
  }
  return pts;
}

const PRICES = ["67,842", "67,915", "68,103", "67,756", "68,244", "67,998", "68,412"];

function ChartLine({ progress, seed }: { progress: number; seed: number }) {
  const pts = useMemo(() => generateChart(50, seed), [seed]);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const drawLength = Math.min(progress * 1.2, 1);

  const priceIdx = Math.min(Math.floor(drawLength * PRICES.length), PRICES.length - 1);
  const currentPrice = PRICES[priceIdx];

  const currentPtIdx = Math.min(Math.floor(drawLength * (pts.length - 1)), pts.length - 1);
  const currentPt = pts[currentPtIdx];

  return (
    <div className="relative w-full h-full">

      {/* Time labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
        {["00:00", "06:00", "12:00", "18:00", "24:00"].map((t) => (
          <span key={t} className="text-[10px] text-white/20 font-[family-name:var(--font-outfit)]">{t}</span>
        ))}
      </div>

      <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`cg${seed}`} x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5470FE" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
          <linearGradient id={`cf${seed}`} x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5470FE" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#5470FE" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        ))}

        <path
          d={`${d} L 300 100 L 0 100 Z`}
          fill={`url(#cf${seed})`}
          opacity={drawLength}
        />

        <path
          d={d}
          stroke={`url(#cg${seed})`}
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
          pathLength="1"
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1 - drawLength,
          }}
        />

        {drawLength > 0.05 && (
          <>
            <circle cx={currentPt[0]} cy={currentPt[1]} r="3" fill="#5470FE" opacity="0.3" />
            <circle cx={currentPt[0]} cy={currentPt[1]} r="1.5" fill="#FFFFFF" />
          </>
        )}
      </svg>
    </div>
  );
}

function StackedIcons() {
  return (
    <div className="flex items-center -space-x-3">
      <Image src="/btc.png" alt="BTC" width={36} height={36} className="rounded-full ring-2 ring-black relative z-30" />
      <Image src="/eth.png" alt="ETH" width={36} height={36} className="rounded-full ring-2 ring-black relative z-20" />
      <Image src="/sol.png" alt="SOL" width={36} height={36} className="rounded-full ring-2 ring-black relative z-10" />
    </div>
  );
}

export default function BentoGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const { theme } = useTheme();
  const cardBg = theme === "light" ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.04)";
  const innerCardBg = theme === "light" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.05)";

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

  const cards = [
    { delay: 0, type: "chart", span: "md:col-span-2" },
    { delay: 0.1, type: "sport", span: "" },
    { delay: 0.15, type: "weather", span: "" },
    { delay: 0.2, type: "chart2", span: "md:col-span-2" },
  ];

  return (
    <div ref={ref} className="w-full max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, i) => {
        const p = Math.min(Math.max((progress - 0.3 - card.delay) * 3, 0), 1);
        const blur = (1 - p) * 10;
        const y = (1 - p) * 40;
        const style = { opacity: p, filter: `blur(${blur}px)`, transform: `translateY(${y}px)`, background: cardBg };

        // Chart card — crypto
        if (card.type === "chart") {
          return (
            <div key={i} className={`${card.span} rounded-2xl p-6 flex flex-col gap-4 min-h-[300px]`} style={style}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StackedIcons />
                  <div>
                    <p className="font-[family-name:var(--font-akony)] text-white text-lg md:text-xl">BTC / USDT</p>
                    <p className="font-[family-name:var(--font-outfit)] text-white/40 text-xs">Binance · 24h</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-[family-name:var(--font-outfit)] text-accent text-xl md:text-2xl font-bold tabular-nums">${PRICES[PRICES.length - 1]}</span>
                  <span className="font-[family-name:var(--font-outfit)] text-green-400 text-xs">+2.14%</span>
                </div>
              </div>
              <div className="flex-1 relative">
                <ChartLine progress={p} seed={42} />
              </div>
            </div>
          );
        }

        // Store prices card
        if (card.type === "chart2") {
          const CartIcon = () => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          );
          const MilkIcon = () => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2h8l2 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6l2-4z" /><path d="M6 6h12" />
            </svg>
          );
          const BreadIcon = () => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8c0-3 2-5 7-5s7 2 7 5c0 2-1 3-2 3v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9c-1 0-2-1-2-3z" />
            </svg>
          );
          const EggIcon = () => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round">
              <ellipse cx="12" cy="14" rx="7" ry="8" /><ellipse cx="12" cy="13" rx="3" ry="3" fill="#fbbf24" opacity="0.2" />
            </svg>
          );
          const AppleIcon = () => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3c-1-1-3-1.5-4 0S5 6 6 9c1 4 3 8 6 12 3-4 5-8 6-12 1-3 0-5-1-6s-3-1-4 0z" /><path d="M12 3c0-1 1-2 2-2" />
            </svg>
          );
          const items = [
            { name: "Milk 1L", price: 1.29, change: +0.05, icon: <MilkIcon /> },
            { name: "Bread", price: 2.49, change: -0.10, icon: <BreadIcon /> },
            { name: "Eggs 12pk", price: 3.99, change: +0.30, icon: <EggIcon /> },
            { name: "Apples 1kg", price: 2.79, change: -0.15, icon: <AppleIcon /> },
          ];
          return (
            <div key={i} className={`${card.span} rounded-2xl p-6 flex flex-col gap-4 min-h-[300px]`} style={style}>
              <div className="flex items-center gap-3">
                <CartIcon />
                <div>
                  <p className="font-[family-name:var(--font-akony)] text-white text-lg md:text-xl">Store Prices</p>
                  <p className="font-[family-name:var(--font-outfit)] text-white/40 text-xs">Walmart · today</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 flex-1 content-center">
                {items.map((item, j) => (
                  <div key={j} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: innerCardBg }}>
                    <div className="flex items-center justify-between">
                      {item.icon}
                      <span className={`font-[family-name:var(--font-outfit)] text-[10px] tabular-nums ${item.change > 0 ? "text-red-400" : "text-green-400"}`}>
                        {item.change > 0 ? "+" : ""}{item.change.toFixed(2)}
                      </span>
                    </div>
                    <p className="font-[family-name:var(--font-outfit)] text-white/50 text-xs">{item.name}</p>
                    <p className="font-[family-name:var(--font-outfit)] text-white font-semibold text-lg tabular-nums">${item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Weather card
        if (card.type === "weather") {
          const SunIcon = () => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          );
          const RainIcon = () => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round">
              <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" /><line x1="8" y1="16" x2="8" y2="20" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="16" y1="16" x2="16" y2="20" />
            </svg>
          );
          const CloudIcon = () => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
            </svg>
          );
          const SnowIcon = () => (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /><line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
            </svg>
          );
          const ThermIcon = () => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
            </svg>
          );
          const icons = [<SunIcon />, <RainIcon />, <CloudIcon />, <SunIcon />, <SnowIcon />];
          const cities = [
            { name: "New York", c: 22 },
            { name: "London", c: 14 },
            { name: "Tokyo", c: 28 },
            { name: "Dubai", c: 38 },
            { name: "Moscow", c: -2 },
          ];
          return (
            <div key={i} className={`${card.span} rounded-2xl bg-white/5 p-6 flex flex-col gap-3 min-h-[300px]`} style={style}>
              <div className="flex items-center gap-2">
                <ThermIcon />
                <p className="font-[family-name:var(--font-akony)] text-white text-lg md:text-xl">Weather</p>
              </div>
              <div className="flex flex-col gap-2 flex-1 justify-center">
                {cities.map((city, j) => {
                  const f = Math.round(city.c * 9 / 5 + 32);
                  return (
                    <div key={j} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        {icons[j]}
                        <span className="font-[family-name:var(--font-outfit)] text-white/60 text-sm">{city.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-outfit)] text-white font-semibold text-sm tabular-nums">{city.c}°C</span>
                        <span className="font-[family-name:var(--font-outfit)] text-white/30 text-xs tabular-nums">{f}°F</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Sport cards
        return (
          <div key={i} className={`${card.span} rounded-2xl p-6 flex flex-col gap-4 min-h-[300px]`} style={style}>
            <div className="flex items-center gap-2">
              <Image src="/ball.svg" alt="" width={28} height={28} className="invert" />
              <p className="font-[family-name:var(--font-akony)] text-white text-lg md:text-xl">Sport Results</p>
            </div>

            <div className="flex flex-col gap-3 flex-1 justify-center">
              {[
                { home: "Arsenal", away: "Chelsea", score: "2 : 1", live: true },
                { home: "Lakers", away: "Celtics", score: "108 : 102", live: false },
                { home: "PSG", away: "Bayern", score: "3 : 3", live: true },
              ].map((match, j) => {
                const isWinMatch = j === 0;
                const winReveal = isWinMatch ? Math.min(Math.max((p - 0.9) * 10, 0), 1) : 0;
                const showWin = winReveal > 0;

                return (
                <div key={j} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 relative overflow-hidden">
                  <span className={`font-[family-name:var(--font-outfit)] text-sm transition-colors duration-500 ${showWin ? "text-green-400" : "text-white/60"}`}>
                    {match.home}
                  </span>
                  <div className="relative flex items-center justify-center min-w-[80px]">
                    <div className="flex items-center gap-2" style={{ opacity: showWin ? 0 : 1, transition: "opacity 0.4s" }}>
                      {match.live && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                      <span className="font-[family-name:var(--font-outfit)] text-white font-semibold text-sm tabular-nums">
                        {match.score}
                      </span>
                    </div>
                    {isWinMatch && (
                      <span
                        className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-akony)] text-green-400 text-sm tracking-widest"
                        style={{
                          opacity: winReveal,
                          transform: `scale(${0.3 + winReveal * 0.7})`,
                          transition: "transform 0.3s ease-out",
                        }}
                      >
                        WIN
                      </span>
                    )}
                    {showWin && (
                      <div className="absolute inset-0 pointer-events-none">
                        {[...Array(12)].map((_, k) => {
                          const angle = (k / 12) * 360;
                          const dist = 20 + (k % 3) * 10;
                          const cx = Math.cos((angle * Math.PI) / 180) * dist;
                          const cy = Math.sin((angle * Math.PI) / 180) * dist;
                          const colors = ["#5470FE", "#22c55e", "#FFFFFF", "#facc15"];
                          return (
                            <div
                              key={k}
                              className="absolute left-1/2 top-1/2 rounded-full"
                              style={{
                                width: k % 2 === 0 ? "3px" : "2px",
                                height: k % 2 === 0 ? "3px" : "6px",
                                background: colors[k % colors.length],
                                opacity: winReveal > 0.5 ? 1 - (winReveal - 0.5) * 2 : winReveal * 2,
                                transform: `translate(-50%, -50%) translate(${cx * winReveal}px, ${cy * winReveal}px) rotate(${angle}deg)`,
                                transition: "transform 0.5s ease-out, opacity 0.5s",
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="font-[family-name:var(--font-outfit)] text-white/60 text-sm">
                    {match.away}
                  </span>
                </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
