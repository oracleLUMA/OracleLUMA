"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/app/context/ThemeContext";

type DayRow    = { date: string; txs: number; success_txs: number; fee_sol: number };
type OracleRow = { id: string; name: string; txs: number; success_txs: number; fee_sol: number };
type Analytics = {
  total_txs: number; success_txs: number; failed_txs: number; total_fee_sol: number;
  by_day: DayRow[]; by_oracle: OracleRow[];
};

function useAppear() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // double rAF guarantees the initial hidden state is painted before transition starts
    let raf2: number;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, []);
  return visible;
}

/* ── Donut ─────────────────────────────────────────────────────────────────── */
function Donut({ pct, value, label, color, size = 90, isDark }: {
  pct: number; value: string; label: string; color: string; size?: number; isDark: boolean;
}) {
  const r    = size * 0.37;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, pct)) * circ;
  const cx   = size / 2, cy = size / 2;
  const sw   = size * 0.08;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"} strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 1.1s cubic-bezier(0.22,1,0.36,1)" }} />
        <text x={cx} y={cy + size * 0.06} textAnchor="middle"
          fontSize={size * 0.2} fontWeight="700" fill="var(--foreground)" fontFamily="var(--font-outfit)">
          {value}
        </text>
      </svg>
      <span className="font-[family-name:var(--font-outfit)] text-xs text-center"
        style={{ color: "var(--foreground)", opacity: 0.35 }}>{label}</span>
    </div>
  );
}

/* ── Bar chart ─────────────────────────────────────────────────────────────── */
function CallsChart({ data, isDark }: { data: DayRow[]; isDark: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 420, H = 130, PAD = 5;
  const max = Math.max(...data.map(d => d.txs), 1);
  const barW = data.length > 0 ? Math.max(6, (W - PAD * (data.length - 1)) / data.length) : 20;
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col gap-3 h-full">
      <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: "var(--foreground)", opacity: 0.4 }}>
        Calls per day — last 14 days
      </span>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs font-[family-name:var(--font-outfit)]"
          style={{ color: "var(--foreground)", opacity: 0.2 }}>No data yet</div>
      ) : (
        <svg width="100%" viewBox={`0 0 ${W} ${H + 22}`} style={{ overflow: "visible", flex: 1 }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5470FE" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#5470FE" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7b93ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#5470FE" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* grid lines */}
          {gridLines.map(g => {
            const y = H - g * H;
            return (
              <line key={g} x1={0} y1={y} x2={W} y2={y}
                stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} strokeWidth={1} strokeDasharray="3 4" />
            );
          })}

          {/* bars */}
          {data.map((d, i) => {
            const v    = d.txs;
            const barH = Math.max(3, (v / max) * H);
            const x    = i * (barW + PAD);
            const y    = H - barH;
            const isHover = hover === i;
            const dateShort = d.date.slice(5);
            return (
              <g key={d.date} style={{ cursor: "default" }}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                {/* bar */}
                <rect x={x} y={y} width={barW} height={barH} rx={4}
                  fill={isHover ? "url(#barGradHover)" : "url(#barGrad)"} />
                {/* date label every ~2 bars */}
                {i % Math.ceil(data.length / 7) === 0 && (
                  <text x={x + barW / 2} y={H + 15} textAnchor="middle" fontSize={8.5}
                    fill="var(--foreground)" opacity={0.25} fontFamily="var(--font-outfit)">
                    {dateShort}
                  </text>
                )}
                {/* hover tooltip */}
                {isHover && (
                  <g>
                    <rect x={x + barW / 2 - 20} y={y - 26} width={40} height={20} rx={5}
                      fill="rgba(84,112,254,0.85)" />
                    <text x={x + barW / 2} y={y - 12} textAnchor="middle" fontSize={9.5}
                      fill="white" fontWeight="600" fontFamily="var(--font-outfit)">
                      {v}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────────────────────── */
export default function AnalyticsContent({ onNavigateOracle }: { onNavigateOracle?: (id: string) => void }) {
  const { theme } = useTheme();
  const isDark      = theme === "dark";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const surfaceBg   = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";

  const [data, setData]       = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const visible = useAppear();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res  = await fetch("/api/analytics");
        const json = await res.json();
        if (alive) { setData(json); setLoading(false); }
      } catch { if (alive) setLoading(false); }
    };
    load();
    const iv = setInterval(load, 10_000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const wrapStyle: React.CSSProperties = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? "none" : "translateY(22px)",
    filter:     visible ? "none" : "blur(10px)",
    transition: "opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1), filter 0.55s cubic-bezier(0.22,1,0.36,1)",
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={wrapStyle}>
      <span className="w-7 h-7 rounded-full border-2 border-[#5470FE] border-t-transparent animate-spin" />
    </div>
  );
  if (!data) return (
    <div className="flex-1 flex items-center justify-center font-[family-name:var(--font-outfit)] text-sm"
      style={{ color: "var(--foreground)", opacity: 0.3, ...wrapStyle }}>Failed to load analytics</div>
  );

  const successRate  = data.total_txs > 0 ? data.success_txs / data.total_txs : 1;
  const failedRate   = data.total_txs > 0 ? data.failed_txs / data.total_txs : 0;
  const todayStr     = new Date().toISOString().slice(0, 10);
  const todayRow     = data.by_day.find(d => d.date === todayStr);
  const todayTxs     = todayRow?.txs ?? 0;
  const maxDay       = Math.max(...data.by_day.map(d => d.txs), 1);

  const divider = <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />;

  return (
    <div className="flex flex-col w-full pb-10 rounded-2xl overflow-hidden"
      style={{ background: surfaceBg, ...wrapStyle }}>

      {/* Title + stat cards */}
      <div className="px-7 pt-7 pb-6 flex flex-col gap-6">
        <h1 className="font-[family-name:var(--font-akony)] text-2xl tracking-widest"
          style={{ color: "var(--foreground)" }}>
          Analytics
        </h1>

        <div className="grid grid-cols-4 gap-6">
          {[
            { label: "Total calls", value: String(data.total_txs) },
            { label: "Successful",  value: String(data.success_txs) },
            { label: "Failed",      value: String(data.failed_txs) },
            { label: "SOL spent",   value: data.total_fee_sol.toFixed(5) },
          ].map(c => (
            <div key={c.label} className="flex flex-col gap-0.5">
              <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: "var(--foreground)", opacity: 0.3 }}>{c.label}</span>
              <span className="font-[family-name:var(--font-outfit)] text-2xl font-bold" style={{ color: "var(--foreground)" }}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>

      {divider}

      {/* Donuts + bar chart */}
      <div className="grid" style={{ gridTemplateColumns: "280px 1fr" }}>

        {/* Donuts */}
        <div className="px-7 py-6 flex flex-col gap-5 border-r"
          style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
          <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: "var(--foreground)", opacity: 0.35 }}>Overview</span>
          <div className="flex justify-center">
            <Donut pct={successRate} value={`${Math.round(successRate * 100)}%`} label="Success rate" color="#22c55e" size={120} isDark={isDark} />
          </div>
          <div className="flex justify-around">
            <Donut pct={failedRate} value={`${Math.round(failedRate * 100)}%`} label="Failed" color="#ef4444" size={80} isDark={isDark} />
            <Donut pct={maxDay > 0 ? todayTxs / maxDay : 0} value={String(todayTxs)} label="Today" color="#5470FE" size={80} isDark={isDark} />
          </div>
        </div>

        {/* Bar chart */}
        <div className="px-7 py-6 flex flex-col" style={{ minHeight: 240 }}>
          <CallsChart data={data.by_day} isDark={isDark} />
        </div>
      </div>

      {divider}

      {/* Per-oracle table */}
      <div>
        <div className="px-7 py-4">
          <span className="font-[family-name:var(--font-outfit)] text-xs font-semibold" style={{ color: "var(--foreground)", opacity: 0.4 }}>
            By oracle
          </span>
        </div>
        {divider}
        {data.by_oracle.length === 0 ? (
          <div className="px-7 py-8 text-center font-[family-name:var(--font-outfit)] text-sm"
            style={{ color: "var(--foreground)", opacity: 0.25 }}>No data yet</div>
        ) : (
          data.by_oracle.map((row, i) => (
            <div key={row.id}>
              {i > 0 && divider}
              <div className="px-7 py-3.5 flex items-center gap-4 cursor-pointer transition-colors"
                onClick={() => onNavigateOracle?.(row.id)}
                style={{ background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div className="flex-1 min-w-0">
                  <span className="font-[family-name:var(--font-outfit)] text-sm font-semibold truncate block" style={{ color: "var(--foreground)" }}>
                    {row.name}
                  </span>
                  <span className="font-mono text-xs" style={{ color: "var(--foreground)", opacity: 0.2 }}>{row.id}</span>
                </div>
                <div className="shrink-0 text-right w-16">
                  <span className="font-[family-name:var(--font-outfit)] text-sm font-semibold" style={{ color: "var(--foreground)" }}>{row.txs}</span>
                  <span className="font-[family-name:var(--font-outfit)] text-xs ml-1" style={{ color: "var(--foreground)", opacity: 0.3 }}>calls</span>
                </div>
                <div className="shrink-0 w-28">
                  <div className="h-1.5 rounded-full overflow-hidden mb-0.5"
                    style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
                    <div className="h-full rounded-full" style={{
                      width: row.txs > 0 ? `${(row.success_txs / row.txs) * 100}%` : "100%",
                      background: "#22c55e", transition: "width 0.8s ease",
                    }} />
                  </div>
                  <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: "var(--foreground)", opacity: 0.3 }}>
                    {row.txs > 0 ? Math.round((row.success_txs / row.txs) * 100) : 100}% ok
                  </span>
                </div>
                <div className="shrink-0 text-right w-28">
                  <span className="font-[family-name:var(--font-outfit)] text-sm" style={{ color: "#5470FE" }}>{row.fee_sol.toFixed(6)}</span>
                  <span className="font-[family-name:var(--font-outfit)] text-xs ml-1" style={{ color: "var(--foreground)", opacity: 0.3 }}>SOL</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
