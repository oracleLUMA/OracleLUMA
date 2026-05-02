"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { JsonTree } from "@/app/dashboard/JsonTree";
import { useTheme } from "@/app/context/ThemeContext";

type KV = { key: string; value: string };

type Oracle = {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, string>;
  mode: "loop" | "date";
  time: string;
  format: string;
  active: boolean;
  pda: string | null;
  walletPubkey: string;
  balance: { lamports: number; sol: number } | null;
  timestamp: string;
};

type Tx = {
  id: number;
  ts: string;
  data: Record<string, unknown>;
  sig: string | null;
  fee: number;
  status: string;
};

type OracleStats = { total_txs: number; success_txs: number; total_fee_sol: number };


export default function OracleContent({ id, onBack, slideDir = "right" }: { id: string; onBack: () => void; slideDir?: "left" | "right" }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const fg         = (op: number) => isDark ? `rgba(255,255,255,${op})` : `rgba(0,0,0,${op})`;
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const surfaceBg   = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
  const modalBg     = isDark ? "#0f0f0f" : "#ffffff";
  const inpSt       = { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: `1px solid ${borderColor}`, color: "var(--foreground)" } as React.CSSProperties;

  const ease = "cubic-bezier(0.22,1,0.36,1)";
  const anim = slideDir === "right" ? "slideInRight" : "slideInLeft";
  const wrapStyle: React.CSSProperties = {
    animation: `${anim} 0.38s ${ease} both`,
  };

  const [oracle, setOracle] = useState<Oracle | null>(null);
  const [txs, setTxs]       = useState<Tx[]>([]);
  const [stats, setStats]   = useState<OracleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [editing, setEditing]   = useState(false);

  const [editUrl, setEditUrl]         = useState("");
  const [editMethod, setEditMethod]   = useState<"GET" | "POST">("GET");
  const [editHeaders, setEditHeaders] = useState<KV[]>([{ key: "", value: "" }]);
  const [editBody, setEditBody]       = useState<KV[]>([{ key: "", value: "" }]);
  const [editFormat, setEditFormat]   = useState("");
  const [editMode, setEditMode]       = useState<"loop" | "date">("loop");
  const [editTime, setEditTime]       = useState("");
  const [editHour, setEditHour]       = useState("12");
  const [editMin, setEditMin]         = useState("00");
  const [editTestResult, setEditTestResult] = useState<string | null>(null);
  const [editTesting, setEditTesting] = useState(false);
  const [saving, setSaving]           = useState(false);
  const dragOrigin = useRef<"inside" | "outside" | null>(null);

  const addKV    = (list: KV[], set: (v: KV[]) => void) => set([...list, { key: "", value: "" }]);
  const updateKV = (list: KV[], set: (v: KV[]) => void, i: number, field: "key" | "value", val: string) => {
    const next = [...list]; next[i] = { ...next[i], [field]: val }; set(next);
  };
  const removeKV = (list: KV[], set: (v: KV[]) => void, i: number) => set(list.filter((_, idx) => idx !== i));

  const runEditTest = async () => {
    setEditTesting(true); setEditTestResult(null);
    try {
      const hdrs = Object.fromEntries(editHeaders.filter(h => h.key).map(h => [h.key, h.value]));
      const opts: RequestInit = { method: editMethod, headers: hdrs };
      if (editMethod === "POST") {
        const bd = Object.fromEntries(editBody.filter(b => b.key).map(b => [b.key, b.value]));
        opts.headers = { ...hdrs, "Content-Type": "application/json" };
        opts.body = JSON.stringify(bd);
      }
      const res = await fetch(editUrl, opts);
      const text = await res.text();
      try { setEditTestResult(JSON.stringify(JSON.parse(text), null, 2)); }
      catch { setEditTestResult(text); }
    } catch (e: unknown) {
      setEditTestResult("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally { setEditTesting(false); }
  };

  const fetchOracle = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      const d = await res.json();
      setOracle(d.oracle);
      setTxs(d.txs ?? []);
      setStats(d.stats ?? null);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOracle();
    const interval = setInterval(fetchOracle, 2000);
    return () => clearInterval(interval);
  }, [fetchOracle]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={wrapStyle}>
      <span className="w-7 h-7 rounded-full border-2 border-[#5470FE] border-t-transparent animate-spin" />
    </div>
  );

  if (!oracle) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4" style={wrapStyle}>
      <p className="font-[family-name:var(--font-outfit)] text-sm" style={{ color: "var(--foreground)", opacity: 0.4 }}>Oracle not found.</p>
      <button onClick={onBack} className="text-sm font-[family-name:var(--font-outfit)]" style={{ color: "#5470FE" }}>← Back</button>
    </div>
  );

  const Field = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
    <div className="flex flex-col gap-1">
      <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: "var(--foreground)", opacity: 0.3 }}>{label}</span>
      <span className={`text-sm break-all ${mono ? "font-mono" : "font-[family-name:var(--font-outfit)]"}`} style={{ color: "var(--foreground)" }}>{value}</span>
    </div>
  );

  const divider = <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />;

  const openEdit = () => {
    setEditUrl(oracle.url);
    setEditMethod((oracle.method as "GET" | "POST") ?? "GET");
    const hEntries = Object.entries(oracle.headers ?? {}).map(([k, v]) => ({ key: k, value: v }));
    setEditHeaders(hEntries.length ? hEntries : [{ key: "", value: "" }]);
    const bEntries = Object.entries(oracle.body ?? {}).map(([k, v]) => ({ key: k, value: String(v) }));
    setEditBody(bEntries.length ? bEntries : [{ key: "", value: "" }]);
    setEditFormat(oracle.format);
    setEditMode(oracle.mode);
    if (oracle.mode === "date") {
      const [h, m] = oracle.time.split(":");
      setEditHour(h ?? "12"); setEditMin(m ?? "00");
    } else {
      setEditTime(oracle.time);
    }
    setEditTestResult(null);
    setEditing(true);
  };

  return (
    <>
    <div className="w-full pb-10 flex flex-col gap-5 max-w-3xl mx-auto" style={wrapStyle}>

      {/* Back */}
      <button onClick={onBack}
        className="self-start font-[family-name:var(--font-outfit)] text-sm transition-opacity hover:opacity-100"
        style={{ color: "var(--foreground)", opacity: 0.4 }}>
        ← My oracles
      </button>

      {/* ── Main info block ─────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: surfaceBg }}>

        {/* Header */}
        <div className="px-7 pt-7 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: oracle.active ? "#22c55e" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                boxShadow: oracle.active ? "0 0 8px #22c55e88" : "none" }} />
            <h1 className="font-[family-name:var(--font-akony)] text-2xl tracking-widest" style={{ color: "var(--foreground)" }}>
              {oracle.name}
            </h1>
            <span className="font-mono text-xs" style={{ color: "var(--foreground)", opacity: 0.2 }}>{oracle.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: "var(--foreground)", opacity: oracle.active ? 0.5 : 0.25 }}>
              {oracle.active ? "Active" : "Paused"}
            </span>
            <button
              disabled={toggling}
              onClick={async () => {
                setToggling(true);
                try {
                  await fetch("/api/edit-request", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: oracle.id, active: !oracle.active }),
                  });
                  setOracle(o => o ? { ...o, active: !o.active } : o);
                } finally { setToggling(false); }
              }}
              className="relative shrink-0 transition-opacity disabled:opacity-50"
              style={{ width: 44, height: 24 }}
            >
              <div className="absolute inset-0 rounded-full transition-colors"
                style={{ background: oracle.active ? "#22c55e" : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)" }} />
              <div className="absolute top-0.5 transition-transform rounded-full bg-white shadow"
                style={{ width: 20, height: 20, transform: oracle.active ? "translateX(22px)" : "translateX(2px)" }} />
            </button>
            <button onClick={openEdit} className="p-1.5 rounded-lg transition-all"
              style={{ color: "var(--foreground)", opacity: 0.25 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.25")}
              title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        </div>

        {divider}

        {/* Wallet balance */}
        <div className="px-7 py-5 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: fg(0.3) }}>Payer wallet</span>
            <span className="font-mono text-xs break-all" style={{ color: fg(0.45) }}>{oracle.walletPubkey}</span>
          </div>
          <div className="shrink-0 ml-6 text-right">
            {oracle.balance === null ? (
              <span className="w-4 h-4 rounded-full border-2 border-[#5470FE] border-t-transparent animate-spin inline-block" />
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-outfit)] text-2xl font-bold" style={{ color: "#5470FE" }}>{oracle.balance.sol.toFixed(4)}</span>
                <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: fg(0.3) }}>SOL</span>
              </div>
            )}
          </div>
        </div>

        {stats && (<>
          {divider}
          {/* Stats */}
          <div className="px-7 py-5 grid grid-cols-3 gap-6">
            {[
              { label: "Total calls", value: String(stats.total_txs) },
              { label: "Successful", value: `${stats.success_txs} (${stats.total_txs > 0 ? Math.round((stats.success_txs / stats.total_txs) * 100) : 100}%)` },
              { label: "SOL spent",  value: `${stats.total_fee_sol.toFixed(6)} SOL` },
            ].map(s => (
              <div key={s.label} className="flex flex-col gap-0.5">
                <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: fg(0.3) }}>{s.label}</span>
                <span className="font-[family-name:var(--font-outfit)] text-base font-semibold" style={{ color: "var(--foreground)" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </>)}

        {divider}

        {/* Info fields */}
        <div className="px-7 py-6 grid grid-cols-2 gap-x-8 gap-y-5">
          <Field label="URL"      value={oracle.url} />
          <Field label="Method"   value={oracle.method ?? "GET"} />
          <Field label="Schedule" value={oracle.mode === "loop" ? `Every ${oracle.time}s` : `Daily at ${oracle.time} UTC`} />
          <Field label="JSON path" value={oracle.format} mono />
          {oracle.pda && <Field label="Feed PDA" value={oracle.pda} mono />}
          <Field label="Created"  value={new Date(oracle.timestamp).toLocaleString()} />
        </div>
      </div>

      {/* ── Recent writes block ──────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: surfaceBg }}>
        <div className="px-7 py-4">
          <span className="font-[family-name:var(--font-outfit)] text-xs font-semibold" style={{ color: fg(0.4) }}>
            Recent writes
          </span>
        </div>
        {divider}

        {txs.length === 0 ? (
          <div className="px-7 py-8 text-center font-[family-name:var(--font-outfit)] text-sm" style={{ color: fg(0.25) }}>
            No data written yet
          </div>
        ) : (
          txs.map((tx, i) => (
            <div key={tx.id}>
              {i > 0 && divider}
              <div className="px-7 py-4 flex items-start gap-4">
                <div className="shrink-0 flex flex-col items-start gap-1.5 w-28">
                  <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: fg(0.25) }}>
                    {new Date(tx.ts).toLocaleTimeString()}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-[family-name:var(--font-outfit)]"
                    style={{ background: tx.status === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: tx.status === "success" ? "#22c55e" : "#ef4444" }}>
                    {tx.status}
                  </span>
                  {tx.fee > 0 && (
                    <span className="font-mono text-xs" style={{ color: fg(0.2) }}>
                      {(tx.fee / 1e9).toFixed(6)} SOL
                    </span>
                  )}
                </div>
                <pre className="text-xs font-mono flex-1 overflow-x-auto" style={{ color: fg(0.7) }}>
                  {JSON.stringify(tx.data, null, 2)}
                </pre>
                {tx.sig && (
                  <a href={`https://explorer.solana.com/tx/${tx.sig}`} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 mt-0.5 opacity-20 hover:opacity-60 transition-opacity" title="View on explorer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {/* Edit modal */}
    {editing && oracle && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onMouseDown={() => { dragOrigin.current = "outside"; }}
        onMouseUp={() => { if (dragOrigin.current === "outside") setEditing(false); dragOrigin.current = null; }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative z-10 rounded-2xl overflow-hidden flex flex-col"
          style={{ background: modalBg, border: `1px solid ${borderColor}`, width: 1060, height: 640, maxWidth: "96vw", maxHeight: "96vh" }}
          onMouseDown={e => { dragOrigin.current = "inside"; e.stopPropagation(); }}>

          {/* Header */}
          <div className="px-7 pt-6 pb-4 flex items-center justify-between border-b" style={{ borderColor }}>
            <div>
              <h2 className="font-[family-name:var(--font-akony)] text-2xl tracking-wide" style={{ color: "var(--foreground)" }}>Edit oracle</h2>
              <p className="font-[family-name:var(--font-outfit)] text-xs mt-0.5" style={{ color: fg(0.25) }}>
                Name is immutable — it&apos;s part of the on-chain PDA seed
              </p>
            </div>
            <button onClick={() => setEditing(false)} className="text-2xl leading-none transition-colors"
              style={{ color: fg(0.2) }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={e => (e.currentTarget.style.color = fg(0.2))}>×</button>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">

            {/* Left column */}
            <div className="flex flex-col gap-4 p-6 w-96 shrink-0 border-r overflow-y-auto" style={{ borderColor }}>

              <div>
                <label className="font-[family-name:var(--font-outfit)] text-xs block mb-1.5" style={{ color: fg(0.4) }}>URL</label>
                <div className="flex gap-2">
                  <select value={editMethod} onChange={e => { setEditMethod(e.target.value as "GET" | "POST"); setEditTestResult(null); }}
                    className="rounded-lg px-2 py-2.5 text-sm font-[family-name:var(--font-outfit)] outline-none shrink-0 appearance-none"
                    style={{ ...inpSt, width: 70 }}>
                    <option style={{ background: modalBg }}>GET</option>
                    <option style={{ background: modalBg }}>POST</option>
                  </select>
                  <input className="flex-1 rounded-lg px-3 py-2.5 text-sm font-[family-name:var(--font-outfit)] outline-none"
                    style={inpSt}
                    value={editUrl} onChange={e => { setEditUrl(e.target.value); setEditTestResult(null); }} />
                </div>
              </div>

              <div>
                <label className="font-[family-name:var(--font-outfit)] text-xs block mb-1.5" style={{ color: fg(0.4) }}>Headers</label>
                <div className="flex flex-col gap-1.5">
                  {editHeaders.map((h, i) => (
                    <div key={i} className="flex gap-1.5">
                      <input className="flex-1 rounded-lg px-2 py-2 text-xs font-[family-name:var(--font-outfit)] outline-none min-w-0"
                        style={inpSt} placeholder="Key" value={h.key} onChange={e => updateKV(editHeaders, setEditHeaders, i, "key", e.target.value)} />
                      <input className="flex-1 rounded-lg px-2 py-2 text-xs font-[family-name:var(--font-outfit)] outline-none min-w-0"
                        style={inpSt} placeholder="Value" value={h.value} onChange={e => updateKV(editHeaders, setEditHeaders, i, "value", e.target.value)} />
                      <button onClick={() => removeKV(editHeaders, setEditHeaders, i)}
                        className="hover:text-red-400 transition-colors px-1 text-base shrink-0" style={{ color: fg(0.2) }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => addKV(editHeaders, setEditHeaders)} className="text-xs hover:text-accent transition-colors text-left" style={{ color: fg(0.3) }}>+ Add header</button>
                </div>
              </div>

              {editMethod === "POST" && (
                <div>
                  <label className="font-[family-name:var(--font-outfit)] text-xs block mb-1.5" style={{ color: fg(0.4) }}>Body params</label>
                  <div className="flex flex-col gap-1.5">
                    {editBody.map((b, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input className="flex-1 rounded-lg px-2 py-2 text-xs font-[family-name:var(--font-outfit)] outline-none min-w-0"
                          style={inpSt} placeholder="Key" value={b.key} onChange={e => updateKV(editBody, setEditBody, i, "key", e.target.value)} />
                        <input className="flex-1 rounded-lg px-2 py-2 text-xs font-[family-name:var(--font-outfit)] outline-none min-w-0"
                          style={inpSt} placeholder="Value" value={b.value} onChange={e => updateKV(editBody, setEditBody, i, "value", e.target.value)} />
                        <button onClick={() => removeKV(editBody, setEditBody, i)}
                          className="hover:text-red-400 transition-colors px-1 text-base shrink-0" style={{ color: fg(0.2) }}>×</button>
                      </div>
                    ))}
                    <button onClick={() => addKV(editBody, setEditBody)} className="text-xs hover:text-accent transition-colors text-left" style={{ color: fg(0.3) }}>+ Add field</button>
                  </div>
                </div>
              )}

              <button onClick={runEditTest} disabled={editTesting || !editUrl.trim()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-[family-name:var(--font-outfit)] font-semibold disabled:opacity-50 transition-all"
                style={{ background: "#5470FE", color: "#fff" }}>
                {editTesting
                  ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <svg width="10" height="12" viewBox="0 0 10 12" fill="white"><path d="M0 0l10 6-10 6V0z" /></svg>}
                {editTesting ? "Running…" : "Run"}
              </button>

              <div>
                <label className="font-[family-name:var(--font-outfit)] text-xs block mb-1.5" style={{ color: fg(0.4) }}>Selected path(s)</label>
                <input className="w-full rounded-lg px-3 py-2.5 text-xs font-mono outline-none"
                  style={inpSt} value={editFormat} onChange={e => setEditFormat(e.target.value)} placeholder="click keys →" />
                {editFormat && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {editFormat.split(",").map(f => f.trim()).filter(Boolean).map((f, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-[family-name:var(--font-outfit)]"
                        style={{ background: "rgba(84,112,254,0.2)", color: "#5470FE" }}>
                        {f}
                        <button onClick={() => setEditFormat(editFormat.split(",").map(s => s.trim()).filter(s => s && s !== f).join(", "))}
                          className="opacity-50 hover:opacity-100">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="font-[family-name:var(--font-outfit)] text-xs block mb-1.5" style={{ color: fg(0.4) }}>Schedule</label>
                <div className="flex gap-2 mb-2">
                  {(["loop", "date"] as const).map(m => (
                    <button key={m} onClick={() => setEditMode(m)}
                      className="flex-1 py-2 rounded-xl text-xs font-[family-name:var(--font-outfit)] font-semibold transition-all"
                      style={{ background: editMode === m ? "#5470FE" : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"), color: editMode === m ? "#fff" : fg(0.4), border: `1px solid ${editMode === m ? "#5470FE" : borderColor}` }}>
                      {m === "loop" ? "Loop" : "Daily"}
                    </button>
                  ))}
                </div>
                {editMode === "loop" && (
                  <input className="w-full rounded-lg px-3 py-2 text-sm font-[family-name:var(--font-outfit)] outline-none"
                    style={inpSt} placeholder="Seconds" value={editTime} onChange={e => setEditTime(e.target.value)} />
                )}
                {editMode === "date" && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: `1px solid ${borderColor}`, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                      <select value={editHour} onChange={e => setEditHour(e.target.value)}
                        onWheel={e => { e.preventDefault(); setEditHour(h => String((((+h + (e.deltaY > 0 ? 1 : -1)) % 24) + 24) % 24).padStart(2, "0")); }}
                        className="px-2 py-2 text-lg font-[family-name:var(--font-outfit)] font-semibold outline-none bg-transparent appearance-none cursor-pointer"
                        style={{ width: 52, textAlign: "center", color: "var(--foreground)" }}>
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(h => (
                          <option key={h} value={h} style={{ background: modalBg }}>{h}</option>
                        ))}
                      </select>
                      <span className="text-lg font-bold select-none" style={{ color: fg(0.3) }}>:</span>
                      <select value={editMin} onChange={e => setEditMin(e.target.value)}
                        onWheel={e => { e.preventDefault(); setEditMin(m => String((((+m + (e.deltaY > 0 ? 1 : -1)) % 60) + 60) % 60).padStart(2, "0")); }}
                        className="px-2 py-2 text-lg font-[family-name:var(--font-outfit)] font-semibold outline-none bg-transparent appearance-none cursor-pointer"
                        style={{ width: 52, textAlign: "center", color: "var(--foreground)" }}>
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map(m => (
                          <option key={m} value={m} style={{ background: modalBg }}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <span className="font-[family-name:var(--font-outfit)] text-sm" style={{ color: fg(0.3) }}>UTC</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right column — JSON tree */}
            <div className="flex-1 overflow-auto p-4"
              style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
              {!editTestResult && !editTesting && (
                <div className="h-full flex items-center justify-center text-xs font-[family-name:var(--font-outfit)]" style={{ color: fg(0.2) }}>
                  Run the request to see the response
                </div>
              )}
              {editTesting && (
                <div className="h-full flex items-center justify-center">
                  <span className="w-5 h-5 rounded-full border-2 border-[#5470FE] border-t-transparent animate-spin" />
                </div>
              )}
              {editTestResult && !editTesting && (
                <div className="text-xs font-mono">
                  <JsonTree
                    data={(() => { try { return JSON.parse(editTestResult); } catch { return editTestResult; } })()}
                    path=""
                    selected={editFormat.split(",").map(s => s.trim()).filter(Boolean)}
                    onSelect={path => {
                      const parts = editFormat.split(",").map(s => s.trim()).filter(Boolean);
                      setEditFormat(parts.includes(path)
                        ? parts.filter(p => p !== path).join(", ")
                        : [...parts, path].join(", "));
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-4 flex justify-end gap-2 border-t" style={{ borderColor }}>
            <button onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-lg text-sm font-[family-name:var(--font-outfit)] transition-colors"
              style={{ color: fg(0.3) }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={e => (e.currentTarget.style.color = fg(0.3))}>
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                const timeValue = editMode === "date" ? `${editHour}:${editMin}` : editTime;
                const newHeaders = Object.fromEntries(editHeaders.filter(h => h.key).map(h => [h.key, h.value]));
                const newBody    = editMethod === "POST"
                  ? Object.fromEntries(editBody.filter(b => b.key).map(b => [b.key, b.value]))
                  : {};
                const patch: Record<string, unknown> = { id: oracle.id };
                if (editUrl.trim()    !== oracle.url)    patch.url    = editUrl.trim();
                if (editMethod        !== oracle.method) patch.method = editMethod;
                if (JSON.stringify(newHeaders) !== JSON.stringify(oracle.headers ?? {})) patch.headers = newHeaders;
                if (JSON.stringify(newBody)    !== JSON.stringify(oracle.body ?? {}))    patch.body    = newBody;
                if (editFormat.trim() !== oracle.format) patch.format = editFormat.trim();
                if (editMode          !== oracle.mode)   patch.mode   = editMode;
                if (timeValue         !== oracle.time)   patch.time   = timeValue;
                try {
                  if (Object.keys(patch).length > 1) {
                    await fetch("/api/edit-request", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(patch),
                    });
                    setOracle(o => o ? { ...o, url: editUrl.trim(), method: editMethod, headers: newHeaders, body: newBody, format: editFormat.trim(), mode: editMode, time: timeValue } : o);
                  }
                  setEditing(false);
                } finally { setSaving(false); }
              }}
              className="px-6 py-2 rounded-lg text-sm font-[family-name:var(--font-outfit)] font-semibold text-white disabled:opacity-40 transition-all"
              style={{ background: "#5470FE" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
