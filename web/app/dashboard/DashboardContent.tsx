"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/app/context/ThemeContext";
import ThemeToggle from "@/app/components/ThemeToggle";
import CreateOracleModal from "./CreateOracleModal";
import AnalyticsContent from "./AnalyticsContent";
import OracleContent from "./OracleContent";

function useAppear() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let r2: number;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setVisible(true)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, []);
  return visible;
}

type Oracle = {
  id: string;
  name: string;
  url: string;
  mode: "loop" | "date";
  time: string;
  format: string;
  active: boolean;
  pda: string | null;
  timestamp: string;
  walletPubkey: string;
  balance: { lamports: number; sol: number } | null;
};

function OraclesList({ oracles, loading, isDark, borderColor, onOpen, onCreate, slideDir }: {
  oracles: Oracle[];
  loading: boolean;
  isDark: boolean;
  borderColor: string;
  onOpen: (id: string) => void;
  onCreate: () => void;
  slideDir: "left" | "right";
}) {
  const visible = useAppear();
  const ease = "cubic-bezier(0.22,1,0.36,1)";
  const anim = slideDir === "left" ? "slideInLeft" : "slideInRight";
  const wrapStyle: React.CSSProperties = {
    animation: `${anim} 0.38s ${ease} both`,
  };

  return (
    <div className="flex flex-col flex-1" style={wrapStyle}>
      <div className="flex items-center justify-between mb-7">
        <h1 className="font-[family-name:var(--font-akony)] text-2xl tracking-widest" style={{ color: "var(--foreground)" }}>
          My oracles
        </h1>
        {oracles.length > 0 && (
          <span className="font-[family-name:var(--font-outfit)] text-xs px-3 py-1 rounded-full"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", color: "var(--foreground)", opacity: 0.4 }}>
            {oracles.length} feed{oracles.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center" style={{ animation: "fadeIn 0.5s ease 0.3s both" }}>
          <span className="w-7 h-7 rounded-full border-2 border-[#5470FE] border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && oracles.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="font-[family-name:var(--font-outfit)] text-sm" style={{ color: "var(--foreground)", opacity: 0.35 }}>
            No feeds yet. Create your first oracle.
          </p>
          <button onClick={onCreate}
            className="mt-2 px-5 py-2 rounded-full text-sm font-[family-name:var(--font-outfit)] font-semibold text-white"
            style={{ background: "#5470FE" }}>
            + Create new
          </button>
        </div>
      )}

      {!loading && oracles.length > 0 && (
        <div className="grid grid-cols-1 gap-3 max-w-2xl w-full mx-auto">
          {oracles.map((oracle) => {
            const paths = oracle.format.split(",").map(s => s.trim()).filter(Boolean);
            return (
              <div key={oracle.id}
                onClick={() => onOpen(oracle.id)}
                className="rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.005]"
                style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", border: `1px solid ${borderColor}` }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(84,112,254,0.3)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = borderColor)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                      style={{ background: oracle.active ? "#22c55e" : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)",
                        boxShadow: oracle.active ? "0 0 6px #22c55e88" : "none" }} />
                    <span className="font-[family-name:var(--font-outfit)] text-base font-semibold truncate" style={{ color: "var(--foreground)" }}>
                      {oracle.name}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    {oracle.balance === null ? (
                      <span className="w-3 h-3 rounded-full border border-[#5470FE] border-t-transparent animate-spin inline-block" />
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="font-[family-name:var(--font-outfit)] text-base font-bold" style={{ color: "#5470FE" }}>
                          {oracle.balance.sol.toFixed(4)}
                        </span>
                        <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: "var(--foreground)", opacity: 0.25 }}>SOL</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0" style={{ color: "var(--foreground)", opacity: 0.25 }}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <span className="font-[family-name:var(--font-outfit)] text-xs truncate" style={{ color: "var(--foreground)", opacity: 0.3 }}>
                    {oracle.url}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-[family-name:var(--font-outfit)] text-xs px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                    style={{ background: "rgba(84,112,254,0.12)", color: "#5470FE" }}>
                    {oracle.mode === "loop" ? (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    ) : (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    )}
                    {oracle.mode === "loop" ? `every ${oracle.time}s` : `${oracle.time} UTC`}
                  </span>
                  {paths.slice(0, 3).map(p => (
                    <span key={p} className="font-mono text-xs px-2 py-0.5 rounded-full"
                      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)", color: "var(--foreground)", opacity: 0.5 }}>
                      {p}
                    </span>
                  ))}
                  {paths.length > 3 && (
                    <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: "var(--foreground)", opacity: 0.25 }}>
                      +{paths.length - 3} more
                    </span>
                  )}
                  <div className="ml-auto">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      style={{ color: "var(--foreground)", opacity: 0.2 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardContent({ wallet, initialOracleId }: { wallet: string; initialOracleId?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [modal, setModal]   = useState(false);
  const [tab, setTab]           = useState<"oracles" | "analytics" | "oracle">(initialOracleId ? "oracle" : "oracles");
  const [oracleId, setOracleId] = useState<string>(initialOracleId ?? "");
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");

  const goToOracle = (id: string) => { setSlideDir("right"); setOracleId(id); setTab("oracle"); };
  const goBack     = ()           => { setSlideDir("left");  setTab("oracles"); };
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 20); return () => clearTimeout(t); }, []);
  const [oracles, setOracles] = useState<Oracle[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOracles = useCallback(async () => {
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      setOracles(data.requests ?? []);
    } catch {
      setOracles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOracles();
    // Poll every 2s to get updated balances from server cache
    intervalRef.current = setInterval(fetchOracles, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchOracles]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/");
  };

  const short = wallet.slice(0, 4) + "..." + wallet.slice(-4);
  const sidebarBg  = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <div className="relative h-screen flex overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Blobs */}
      <div className="pointer-events-none absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-[0.15]"
        style={{ background: "#5470FE", top: "-10%", left: "10%", animation: "blobFloat1 18s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-[90px] opacity-[0.12]"
        style={{ background: "#5470FE", bottom: "-5%", right: "5%", animation: "blobFloat2 22s ease-in-out infinite" }} />

      {/* Sidebar */}
      <aside className="relative z-10 flex flex-col w-56 h-full shrink-0 border-r"
        style={{
          background: sidebarBg, borderColor,
          opacity:    mounted ? 1 : 0,
          transform:  mounted ? "none" : "translateX(-12px)",
          filter:     mounted ? "none" : "blur(6px)",
          transition: "opacity 0.5s ease, transform 0.5s ease, filter 0.5s ease",
        }}>
        <div className="px-5 py-5 border-b" style={{ borderColor }}>
          <a href="/" className="font-[family-name:var(--font-akony)] text-lg tracking-widest" style={{ color: "var(--foreground)" }}>
            LUMA
          </a>
        </div>

        <nav className="flex flex-col gap-1 p-3 flex-1">
          <button
            onClick={() => setTab("oracles")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-[family-name:var(--font-outfit)] transition-colors text-left w-full"
            style={{ color: "var(--foreground)", background: (tab === "oracles" || tab === "oracle") ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)") : "transparent" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            My oracles
          </button>

          <button
            onClick={() => setTab("analytics")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-[family-name:var(--font-outfit)] transition-colors text-left w-full"
            style={{ color: "var(--foreground)", background: tab === "analytics" ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)") : "transparent" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Analytics
          </button>

          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-[family-name:var(--font-outfit)] transition-colors text-left w-full"
            style={{ color: "#5470FE" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Create new
          </button>
        </nav>

        <div className="p-3 border-t flex flex-col gap-2" style={{ borderColor }}>
          <ThemeToggle />
          <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
            <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: "var(--foreground)", opacity: 0.45 }}>{short}</span>
            <button onClick={logout} className="font-[family-name:var(--font-outfit)] text-xs transition-colors" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col p-8 overflow-y-auto overflow-x-hidden"
        style={{
          opacity:    mounted ? 1 : 0,
          transform:  mounted ? "none" : "translateY(16px)",
          filter:     mounted ? "none" : "blur(6px)",
          transition: "opacity 0.55s ease 80ms, transform 0.55s ease 80ms, filter 0.55s ease 80ms",
        }}>

        {tab === "analytics" && <AnalyticsContent onNavigateOracle={goToOracle} />}
        {tab === "oracle" && <OracleContent id={oracleId} onBack={goBack} slideDir={slideDir} />}

        {tab === "oracles" && (
          <OraclesList
            oracles={oracles}
            loading={loading}
            isDark={isDark}
            borderColor={borderColor}
            onOpen={goToOracle}
            onCreate={() => setModal(true)}
            slideDir={slideDir}
          />
        )}
      </main>

      {modal && (
        <CreateOracleModal
          onClose={() => setModal(false)}
          onCreated={() => { setModal(false); fetchOracles(); }}
        />
      )}
    </div>
  );
}
