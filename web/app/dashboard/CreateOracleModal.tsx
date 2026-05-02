"use client";

import { useState, useEffect, useRef } from "react";
import { JsonTree } from "./JsonTree";
import { useTheme } from "@/app/context/ThemeContext";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  Connection,
  SystemProgram,
} from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("LUMApBfHYJyS8cykrVKxCZgkTeHkS8t1TDiHwynT96C");
const RPC = process.env.NEXT_PUBLIC_RPC_URL ?? "https://solana-rpc.publicnode.com";

async function buildCreateFeedTx(
  creator: PublicKey,
  name: string,
  maxDataSize: number
): Promise<{ tx: Transaction; feedPda: PublicKey }> {
  // Anchor discriminator = sha256("global:create_feed")[0:8]
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("global:create_feed"));
  const disc = new Uint8Array(hash).slice(0, 8);

  // Borsh-encode args: name (string LE-length-prefixed) + maxDataSize (u32 LE)
  const nameBytes = new TextEncoder().encode(name);
  const nameLenBuf = new Uint8Array(4);
  new DataView(nameLenBuf.buffer).setUint32(0, nameBytes.length, true);
  const maxDataBuf = new Uint8Array(4);
  new DataView(maxDataBuf.buffer).setUint32(0, maxDataSize, true);

  const data = Buffer.from([...disc, ...nameLenBuf, ...nameBytes, ...maxDataBuf]);

  // Derive PDA: seeds = ["feed", creator, name]
  const [feedPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("feed"), creator.toBuffer(), Buffer.from(name)],
    PROGRAM_ID
  );

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: feedPda,                    isSigner: false, isWritable: true  },
      { pubkey: creator,                    isSigner: true,  isWritable: true  },
      { pubkey: SystemProgram.programId,    isSigner: false, isWritable: false },
    ],
    data,
  });

  const conn = new Connection(RPC, "confirmed");
  const { blockhash } = await conn.getLatestBlockhash();
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = creator;
  tx.add(ix);

  return { tx, feedPda };
}

type KV = { key: string; value: string };

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const STEPS = ["Build request", "Schedule", "Format & Test", "Review"];

function getValueAtPath(data: unknown, pathStr: string): unknown {
  if (data == null || !pathStr) return undefined;
  const parts: (string | number)[] = [];
  const regex = /([^.[[\]]+)|\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(pathStr)) !== null) {
    parts.push(m[1] !== undefined ? m[1] : parseInt(m[2]));
  }
  let cur: unknown = data;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[p];
  }
  return cur;
}

function calcRent(dataBytes: number): { lamports: number; sol: number } {
  // Solana rent exemption: (128 account overhead + dataBytes) * 6960 lamports/byte
  const lamports = (128 + dataBytes) * 6960;
  return { lamports, sol: lamports / 1e9 };
}

function buildUrl(base: string, params: KV[]): string {
  const filled = params.filter(p => p.key);
  if (!filled.length) return base;
  try {
    const url = new URL(base);
    filled.forEach(p => url.searchParams.set(p.key, p.value));
    return url.toString();
  } catch {
    const qs = filled.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&");
    return base + (base.includes("?") ? "&" : "?") + qs;
  }
}

export default function CreateOracleModal({ onClose, onCreated }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const fg    = (op: number) => isDark ? `rgba(255,255,255,${op})` : `rgba(0,0,0,${op})`;
  const modalBg     = isDark ? "#0f0f0f" : "#ffffff";
  const borderC     = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const surfaceC    = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const optionBg    = isDark ? "#0f0f0f" : "#ffffff";

  const [step, setStep] = useState(0);
  const dragOrigin = useRef<"inside" | "outside" | null>(null);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const [animKey, setAnimKey] = useState(0);

  const goTo = (next: number) => {
    setDir(next > step ? "forward" : "back");
    setStep(next);
    setAnimKey(k => k + 1);
  };

  // Step 1 — Build request
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [method, setMethod] = useState<"GET" | "POST">("GET");
  const [headers, setHeaders] = useState<KV[]>([{ key: "", value: "" }]);
  const [params, setParams] = useState<KV[]>([{ key: "", value: "" }]);
  const [bodyFields, setBodyFields] = useState<KV[]>([{ key: "", value: "" }]);

  // Step 2 — Schedule
  const [mode, setMode] = useState<"loop" | "date">("loop");
  const [time, setTime] = useState("");
  const [dateHour, setDateHour] = useState("12");
  const [dateMin, setDateMin] = useState("00");

  // Step 3 — Format & Test
  const [format, setFormat] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Final
  const [saving, setSaving] = useState(false);
  const [savingStep, setSavingStep] = useState<"signing" | "sending" | "saving" | "">("");
  const [error, setError] = useState("");

  const finalUrl = method === "GET" ? buildUrl(baseUrl, params) : baseUrl;

  const addKV = (list: KV[], set: (v: KV[]) => void) => set([...list, { key: "", value: "" }]);
  const updateKV = (list: KV[], set: (v: KV[]) => void, i: number, field: "key" | "value", val: string) => {
    const next = [...list]; next[i] = { ...next[i], [field]: val }; set(next);
  };
  const removeKV = (list: KV[], set: (v: KV[]) => void, i: number) => set(list.filter((_, idx) => idx !== i));

  const scheduleValue = mode === "loop" ? time : `${dateHour}:${dateMin}`;

  const canNext = () => {
    if (step === 0) return name.trim() && baseUrl.trim();
    if (step === 1) return mode === "loop" ? time.trim() : true;
    if (step === 2) return format.trim();
    return true;
  };

  const testRequest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const hdrs = Object.fromEntries(headers.filter(h => h.key).map(h => [h.key, h.value]));
      const opts: RequestInit = { method, headers: hdrs };
      if (method === "POST") {
        const bd = Object.fromEntries(bodyFields.filter(b => b.key).map(b => [b.key, b.value]));
        opts.headers = { ...hdrs, "Content-Type": "application/json" };
        opts.body = JSON.stringify(bd);
      }
      const res = await fetch(finalUrl, opts);
      const text = await res.text();
      try { setTestResult(JSON.stringify(JSON.parse(text), null, 2)); } catch { setTestResult(text); }
    } catch (e: unknown) {
      setTestResult("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally { setTesting(false); }
  };

  const save = async () => {
    setSaving(true); setError(""); setSavingStep("signing");
    try {
      if (!window.solana?.isPhantom) throw new Error("Phantom not found");
      if (!window.solana.signTransaction) throw new Error("Wallet does not support signTransaction");

      // 1. Get connected wallet
      const { publicKey } = await window.solana.connect();
      const creator = new PublicKey(publicKey.toString());

      // 2. Estimate max_data_size for the feed account.
      // Scheduler stores JSON of shape {"path1":<value>,"path2":<value>,...}.
      // Per-path overhead = quotes(2) + path + colon(1) + value reserve + comma(1).
      // Cap at 4 KB (~0.028 SOL rent) so runaway selections don't drain the wallet.
      const selectedPaths = format.split(",").map(s => s.trim()).filter(Boolean);
      const VALUE_RESERVE = 128; // bytes reserved per value (numbers, short strings)
      const perPathBytes = selectedPaths.reduce(
        (sum, p) => sum + p.length + 2 + 1 + VALUE_RESERVE + 1,
        0
      );
      const estimatedBytes = perPathBytes + 2; // {} wrappers
      const maxDataSize = Math.min(4096, Math.max(256, Math.ceil(estimatedBytes * 1.5)));
      console.log(`[CreateOracle] paths=${selectedPaths.length} estimated=${estimatedBytes}B maxDataSize=${maxDataSize}B`);

      // 3. Build transaction
      const { tx, feedPda } = await buildCreateFeedTx(creator, name, maxDataSize);

      // 4. Sign via Phantom
      const signedTx = await window.solana.signTransaction(tx);

      // 5. Send & confirm
      setSavingStep("sending");
      const conn = new Connection(RPC, "confirmed");
      const sig = await conn.sendRawTransaction(signedTx.serialize());
      await conn.confirmTransaction(sig, "confirmed");

      // 6. Save to DB
      setSavingStep("saving");
      const hdrsObj = Object.fromEntries(headers.filter(h => h.key).map(h => [h.key, h.value]));
      const bodyObj = method === "POST"
        ? Object.fromEntries(bodyFields.filter(b => b.key).map(b => [b.key, b.value]))
        : {};
      const res = await fetch("/api/create-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url: finalUrl, method, headers: hdrsObj, body: bodyObj, format, mode, time: scheduleValue, pda: feedPda.toString() }),
      });
      if (!res.ok) {
        let msg = "Failed to save oracle";
        try { msg = (await res.json()).error || msg; } catch { /* empty body */ }
        throw new Error(msg);
      }

      onCreated(); onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally { setSaving(false); setSavingStep(""); }
  };

  const inp = "w-full rounded-lg px-3 py-2.5 text-sm font-[family-name:var(--font-outfit)] outline-none";
  const inpStyle = { background: surfaceC, border: `1px solid ${borderC}`, color: "var(--foreground)" };
  const lbl = "font-[family-name:var(--font-outfit)] text-xs mb-1.5 block";
  const lblStyle = { color: fg(0.4) };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={() => { dragOrigin.current = "outside"; }}
      onMouseUp={() => { if (dragOrigin.current === "outside") onClose(); dragOrigin.current = null; }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 flex flex-col rounded-2xl overflow-hidden"
        style={{ background: modalBg, border: `1px solid ${borderC}`, width: "860px", height: "640px", maxWidth: "96vw", maxHeight: "96vh" }}
        onMouseDown={e => { dragOrigin.current = "inside"; e.stopPropagation(); }}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5">
          <div className="flex items-start justify-between mb-5">
            <h2 className="font-[family-name:var(--font-akony)] text-2xl md:text-3xl tracking-wide" style={{ color: "var(--foreground)" }}>
              New Oracle
            </h2>
            <button onClick={onClose} className="transition-colors text-2xl leading-none mt-1" style={{ color: fg(0.2) }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={e => (e.currentTarget.style.color = fg(0.2))}>×</button>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-[family-name:var(--font-outfit)] transition-colors"
                    style={{
                      background: i <= step ? "#5470FE" : surfaceC,
                      color: i <= step ? "#fff" : fg(0.3),
                    }}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className="font-[family-name:var(--font-outfit)] text-xs hidden sm:block transition-colors"
                    style={{ color: i === step ? "var(--foreground)" : fg(0.35) }}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-3" style={{ background: i < step ? "#5470FE" : borderC }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-7 pb-5 overflow-hidden" style={{ flex: "1 1 0", minHeight: 0 }}>
        <div
          key={animKey}
          className="flex flex-col gap-5 h-full overflow-y-auto"
          style={{ animation: `${dir === "forward" ? "slideInRight" : "slideInLeft"} 0.28s cubic-bezier(0.4,0,0.2,1) both` }}
        >

          {/* STEP 0 — Build request */}
          {step === 0 && (
            <>
              <div className="font-[family-name:var(--font-outfit)] text-sm -mt-1" style={{ color: fg(0.45) }}>
                Define your API endpoint and parameters.
              </div>

              <div>
                <label className={lbl} style={lblStyle}>Feed name *</label>
                <input className={inp} style={inpStyle} placeholder="BTC price feed" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div>
                <label className={lbl} style={lblStyle}>URL *</label>
                <div className="flex gap-2">
                  <select className="rounded-lg px-2.5 py-2.5 text-sm font-[family-name:var(--font-outfit)] outline-none shrink-0"
                    style={{ ...inpStyle, width: 85 }} value={method} onChange={e => setMethod(e.target.value as "GET" | "POST")}>
                    <option>GET</option>
                    <option>POST</option>
                  </select>
                  <input className={inp} style={inpStyle} placeholder="https://api.example.com/v1/price"
                    value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
                </div>
                {/* Preview */}
                {(baseUrl || params.some(p => p.key) || headers.some(h => h.key)) && (
                  <div className="mt-2 rounded-lg overflow-hidden text-xs font-mono"
                    style={{ border: "1px solid rgba(84,112,254,0.2)" }}>
                    {/* URL line */}
                    <div className="px-3 py-2 break-all flex gap-2"
                      style={{ background: "rgba(84,112,254,0.08)", color: "#5470FE" }}>
                      <span className="shrink-0" style={{ color: fg(0.3) }}>{method}</span>
                      <span>{finalUrl || baseUrl}</span>
                    </div>
                    {/* Headers */}
                    {headers.filter(h => h.key).length > 0 && (
                      <div className="px-3 py-2 flex flex-col gap-0.5"
                        style={{ background: surfaceC, borderTop: "1px solid rgba(84,112,254,0.1)" }}>
                        {headers.filter(h => h.key).map((h, i) => (
                          <div key={i} className="flex gap-2">
                            <span style={{ color: fg(0.3) }}>{h.key}:</span>
                            <span style={{ color: fg(0.5) }}>{h.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Query params / Body params */}
              <div>
                <label className={lbl} style={lblStyle}>{method === "GET" ? "Query params" : "Body params"}</label>
                <div className="flex flex-col gap-2">
                  {(method === "GET" ? params : bodyFields).map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input className={inp} style={inpStyle} placeholder="key"
                        value={p.key} onChange={e => updateKV(method === "GET" ? params : bodyFields, method === "GET" ? setParams : setBodyFields, i, "key", e.target.value)} />
                      <input className={inp} style={inpStyle} placeholder="value"
                        value={p.value} onChange={e => updateKV(method === "GET" ? params : bodyFields, method === "GET" ? setParams : setBodyFields, i, "value", e.target.value)} />
                      <button onClick={() => removeKV(method === "GET" ? params : bodyFields, method === "GET" ? setParams : setBodyFields, i)}
                        className="hover:text-red-400 transition-colors px-1.5 text-lg" style={{ color: fg(0.2) }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => addKV(method === "GET" ? params : bodyFields, method === "GET" ? setParams : setBodyFields)}
                    className="text-xs hover:text-accent transition-colors text-left" style={{ color: fg(0.3) }}>
                    + Add {method === "GET" ? "param" : "field"}
                  </button>
                </div>
              </div>

              {/* Headers */}
              <div>
                <label className={lbl} style={lblStyle}>Headers</label>
                <div className="flex flex-col gap-2">
                  {headers.map((h, i) => (
                    <div key={i} className="flex gap-2">
                      <input className={inp} style={inpStyle} placeholder="Authorization"
                        value={h.key} onChange={e => updateKV(headers, setHeaders, i, "key", e.target.value)} />
                      <input className={inp} style={inpStyle} placeholder="Bearer ..."
                        value={h.value} onChange={e => updateKV(headers, setHeaders, i, "value", e.target.value)} />
                      <button onClick={() => removeKV(headers, setHeaders, i)}
                        className="hover:text-red-400 transition-colors px-1.5 text-lg" style={{ color: fg(0.2) }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => addKV(headers, setHeaders)} className="text-xs hover:text-accent transition-colors text-left" style={{ color: fg(0.3) }}>+ Add header</button>
                </div>
              </div>
            </>
          )}

          {/* STEP 1 — Schedule */}
          {step === 1 && (
            <>
              <div className="font-[family-name:var(--font-outfit)] text-sm -mt-1" style={{ color: fg(0.45) }}>
                When should this oracle run?
              </div>
              <div className="flex gap-3">
                <button onClick={() => setMode("loop")}
                  className="flex-1 py-3 rounded-xl text-sm font-[family-name:var(--font-outfit)] font-semibold transition-all flex items-center justify-center gap-2"
                  style={{ background: mode === "loop" ? "#5470FE" : surfaceC, color: mode === "loop" ? "#fff" : fg(0.4), border: `1px solid ${mode === "loop" ? "#5470FE" : borderC}` }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                  Loop
                </button>
                <button onClick={() => setMode("date")}
                  className="flex-1 py-3 rounded-xl text-sm font-[family-name:var(--font-outfit)] font-semibold transition-all flex items-center justify-center gap-2"
                  style={{ background: mode === "date" ? "#5470FE" : surfaceC, color: mode === "date" ? "#fff" : fg(0.4), border: `1px solid ${mode === "date" ? "#5470FE" : borderC}` }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Daily
                </button>
              </div>

              {mode === "loop" && (
                <div className="flex flex-col items-center gap-5 py-4">
                  <div className="flex flex-col items-center gap-2 w-52">
                    <label className={lbl + " text-center"} style={lblStyle}>Interval in seconds *</label>
                    <input
                      className={inp}
                      style={{ ...inpStyle, textAlign: "center", fontSize: "1.5rem", fontWeight: 600, padding: "0.75rem 1rem" }}
                      placeholder="60"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                    />
                  </div>
                  <p className="text-sm font-[family-name:var(--font-outfit)] text-center min-h-[1.25rem]" style={{ color: fg(0.3) }}>
                    {time && !isNaN(+time) && +time > 0
                      ? <>Runs every <span className="font-semibold" style={{ color: "#5470FE" }}>{
                          +time >= 3600
                            ? `${Math.floor(+time / 3600)}h ${Math.floor((+time % 3600) / 60)}m`
                            : +time >= 60
                              ? `${Math.floor(+time / 60)}m ${+time % 60}s`
                              : `${time}s`
                        }</span></>
                      : <span className="opacity-0">_</span>
                    }
                  </p>
                </div>
              )}

              {mode === "date" && (
                <div className="flex flex-col items-center gap-5 py-4">
                  <div className="relative flex items-center justify-center">
                    <div className="flex items-center gap-2 rounded-2xl overflow-hidden"
                      style={{ background: surfaceC, border: `1px solid ${borderC}` }}>
                      <select
                        value={dateHour}
                        onChange={e => setDateHour(e.target.value)}
                        onWheel={e => {
                          e.preventDefault();
                          setDateHour(h => String((((+h + (e.deltaY > 0 ? 1 : -1)) % 24) + 24) % 24).padStart(2, "0"));
                        }}
                        className="px-5 py-4 text-3xl font-[family-name:var(--font-outfit)] font-semibold outline-none bg-transparent appearance-none cursor-pointer"
                        style={{ color: "var(--foreground)", width: 88, textAlign: "center" }}
                      >
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(h => (
                          <option key={h} value={h} style={{ background: optionBg }}>{h}</option>
                        ))}
                      </select>
                      <span className="text-3xl font-bold select-none -mx-1" style={{ color: fg(0.3) }}>:</span>
                      <select
                        value={dateMin}
                        onChange={e => setDateMin(e.target.value)}
                        onWheel={e => {
                          e.preventDefault();
                          setDateMin(m => String((((+m + (e.deltaY > 0 ? 1 : -1)) % 60) + 60) % 60).padStart(2, "0"));
                        }}
                        className="px-5 py-4 text-3xl font-[family-name:var(--font-outfit)] font-semibold outline-none bg-transparent appearance-none cursor-pointer"
                        style={{ color: "var(--foreground)", width: 88, textAlign: "center" }}
                      >
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map(m => (
                          <option key={m} value={m} style={{ background: optionBg }}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <span className="absolute -right-10 font-[family-name:var(--font-outfit)] text-base font-semibold" style={{ color: fg(0.3) }}>UTC</span>
                  </div>
                  <p className="text-sm font-[family-name:var(--font-outfit)] text-center" style={{ color: fg(0.3) }}>
                    Runs every day at <span className="font-semibold" style={{ color: "#5470FE" }}>{dateHour}:{dateMin} UTC</span>
                  </p>
                </div>
              )}
            </>
          )}

          {/* STEP 2 — Format & Test */}
          {step === 2 && (
            <div className="flex gap-4 min-h-[380px]">
              {/* Left panel */}
              <div className="flex flex-col gap-4 w-48 shrink-0">
                <div className="font-[family-name:var(--font-outfit)] text-sm" style={{ color: fg(0.45) }}>
                  Run the request, then click keys to select what to store.
                </div>

                <button onClick={testRequest} disabled={testing}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-[family-name:var(--font-outfit)] font-semibold disabled:opacity-50 transition-all"
                  style={{ background: "#5470FE", color: "#fff" }}>
                  {testing
                    ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : <svg width="10" height="12" viewBox="0 0 10 12" fill="white"><path d="M0 0l10 6-10 6V0z" /></svg>}
                  {testing ? "Running…" : "Run"}
                </button>

                <div>
                  <label className={lbl} style={lblStyle}>Selected path(s)</label>
                  <input className={inp} style={inpStyle}
                    placeholder="click keys →"
                    value={format}
                    onChange={e => setFormat(e.target.value)} />
                  {format && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {format.split(",").map(f => f.trim()).filter(Boolean).map((f, i) => (
                        <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-[family-name:var(--font-outfit)]"
                          style={{ background: "rgba(84,112,254,0.2)", color: "#5470FE" }}>
                          {f}
                          <button onClick={() => setFormat(format.split(",").map(s => s.trim()).filter(s => s && s !== f).join(", "))}
                            className="opacity-50 hover:opacity-100">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cost estimation */}
                {(() => {
                  const selectedPaths = format.split(",").map(s => s.trim()).filter(Boolean);
                  const parsed = (() => { try { return testResult ? JSON.parse(testResult) : null; } catch { return null; } })();
                  if (!selectedPaths.length) return null;

                  const obj: Record<string, unknown> = {};
                  selectedPaths.forEach(p => { obj[p] = parsed ? getValueAtPath(parsed, p) : "…"; });
                  const json = JSON.stringify(obj, null, 2);
                  const bytes = new TextEncoder().encode(json).length;
                  const { lamports, sol } = calcRent(bytes);

                  return (
                    <div className="rounded-xl p-3 flex flex-col gap-2.5 text-xs font-[family-name:var(--font-outfit)]"
                      style={{ background: "rgba(84,112,254,0.07)", border: "1px solid rgba(84,112,254,0.18)" }}>
                      <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider" style={{ fontSize: 10, color: fg(0.4) }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16.5" strokeWidth="2.5"/></svg>
                        PDA rent cost
                      </div>

                      <div className="rounded-lg overflow-hidden font-mono leading-relaxed"
                        style={{ background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)", color: fg(0.5), fontSize: 10, padding: "6px 8px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                        {json}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between">
                          <span style={{ color: fg(0.3) }}>Size</span>
                          <span style={{ color: fg(0.5) }}>{bytes} bytes</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: fg(0.3) }}>Lamports</span>
                          <span style={{ color: fg(0.5) }}>{lamports.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t" style={{ borderColor: "rgba(84,112,254,0.2)" }}>
                          <span className="font-semibold" style={{ color: fg(0.4) }}>SOL</span>
                          <span className="font-semibold" style={{ color: "#5470FE" }}>{sol.toFixed(6)} SOL</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right panel — JSON tree */}
              <div className="flex-1 rounded-xl overflow-auto"
                style={{ background: surfaceC, border: `1px solid ${borderC}`, minHeight: 380 }}>
                {!testResult && !testing && (
                  <div className="h-full flex items-center justify-center text-xs font-[family-name:var(--font-outfit)]" style={{ color: fg(0.2) }}>
                    Response will appear here
                  </div>
                )}
                {testing && (
                  <div className="h-full flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  </div>
                )}
                {testResult && !testing && (
                  <div className="p-4 text-xs font-mono">
                    <JsonTree
                      data={(() => { try { return JSON.parse(testResult); } catch { return testResult; } })()}
                      path=""
                      selected={format.split(",").map(s => s.trim()).filter(Boolean)}
                      onSelect={(path) => {
                        const parts = format.split(",").map(s => s.trim()).filter(Boolean);
                        if (parts.includes(path)) {
                          setFormat(parts.filter(p => p !== path).join(", "));
                        } else {
                          setFormat([...parts, path].join(", "));
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <>
              <div className="font-[family-name:var(--font-outfit)] text-sm -mt-1" style={{ color: fg(0.45) }}>
                Review and create your oracle.
              </div>
              {[
                ["Name", name],
                ["URL", finalUrl],
                ["Method", method],
                ["Mode", mode === "loop" ? `Loop every ${scheduleValue}s` : `Every day at ${scheduleValue} UTC`],
                ["JSON path", format],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 items-start py-2 border-b" style={{ borderColor: fg(0.06) }}>
                  <span className="font-[family-name:var(--font-outfit)] text-xs w-20 shrink-0 pt-0.5" style={{ color: fg(0.3) }}>{k}</span>
                  <span className="font-[family-name:var(--font-outfit)] text-sm break-all" style={{ color: "var(--foreground)" }}>{v}</span>
                </div>
              ))}

              {/* Rent cost row */}
              {(() => {
                const selectedPaths = format.split(",").map(s => s.trim()).filter(Boolean);
                if (!selectedPaths.length) return null;
                const obj: Record<string, unknown> = {};
                selectedPaths.forEach(p => { obj[p] = "…"; });
                const bytes = new TextEncoder().encode(JSON.stringify(obj, null, 2)).length;
                const { sol } = calcRent(bytes);
                return (
                  <div className="flex gap-3 items-center py-3 rounded-xl px-4 mt-1"
                    style={{ background: "rgba(84,112,254,0.08)", border: "1px solid rgba(84,112,254,0.18)" }}>
                    <span className="font-[family-name:var(--font-outfit)] text-xs w-20 shrink-0" style={{ color: fg(0.3) }}>PDA rent</span>
                    <span className="font-[family-name:var(--font-outfit)] text-sm font-semibold flex-1" style={{ color: "#5470FE" }}>
                      {sol.toFixed(6)} SOL
                    </span>
                    <span className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: fg(0.25) }}>one-time rent</span>
                  </div>
                );
              })()}

              {error && <p className="text-xs text-red-400 font-[family-name:var(--font-outfit)]">{error}</p>}
            </>
          )}
        </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 flex items-center justify-between border-t" style={{ borderColor: borderC }}>
          <button
            onClick={() => step > 0 ? goTo(step - 1) : onClose()}
            className="px-4 py-2 rounded-lg text-sm font-[family-name:var(--font-outfit)] transition-colors"
            style={{ color: fg(0.3) }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
            onMouseLeave={e => (e.currentTarget.style.color = fg(0.3))}
          >
            {step === 0 ? "Cancel" : "← Back"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => goTo(step + 1)}
              disabled={!canNext()}
              className="px-6 py-2 rounded-lg text-sm font-[family-name:var(--font-outfit)] font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: "#5470FE" }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={save} disabled={saving}
              className="px-6 py-2 rounded-lg text-sm font-[family-name:var(--font-outfit)] font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2"
              style={{ background: "#5470FE" }}
            >
              {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              {savingStep === "signing"  ? "Sign in Phantom…" :
               savingStep === "sending"  ? "Sending tx…" :
               savingStep === "saving"   ? "Saving…" :
               "Create Oracle"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
