"use client";

import { useTheme } from "@/app/context/ThemeContext";
import ThemeToggle from "@/app/components/ThemeToggle";
import Link from "next/link";

const PROGRAM_ID = "LUMApBfHYJyS8cykrVKxCZgkTeHkS8t1TDiHwynT96C";

const IconLink = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5470FE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5470FE" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconChain = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5470FE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="6" height="10" rx="1"/><rect x="9" y="7" width="6" height="10" rx="1"/><rect x="16" y="7" width="6" height="10" rx="1"/>
    <line x1="8" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="16" y2="12"/>
  </svg>
);

export default function DocsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const fg = (op: number) => isDark ? `rgba(255,255,255,${op})` : `rgba(0,0,0,${op})`;
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const surfaceBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const codeBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <section id={id} className="flex flex-col gap-4 pt-2 pb-8" style={{ borderBottom: `1px solid ${borderColor}` }}>
      <h2 className="font-[family-name:var(--font-akony)] text-xl tracking-wide" style={{ color: "#5470FE" }}>{title}</h2>
      {children}
    </section>
  );

  const P = ({ children }: { children: React.ReactNode }) => (
    <p className="font-[family-name:var(--font-outfit)] text-sm leading-relaxed" style={{ color: fg(0.65) }}>{children}</p>
  );

  const Code = ({ children }: { children: React.ReactNode }) => (
    <code className="font-mono text-xs px-1.5 py-0.5 rounded-md" style={{ background: codeBg, color: isDark ? "#a5b4fc" : "#5470FE" }}>{children}</code>
  );

  const Block = ({ children }: { children: React.ReactNode }) => (
    <pre className="font-mono text-xs leading-relaxed p-4 rounded-xl overflow-x-auto" style={{ background: codeBg, color: isDark ? "#a5b4fc" : "#4338ca" }}>{children}</pre>
  );

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "create-feed", label: "Creating a feed" },
    { id: "how-it-works", label: "How it works" },
    { id: "reading-data", label: "Reading on-chain data" },
    { id: "feed-structure", label: "Feed structure" },
    { id: "scheduling", label: "Scheduling" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Blob */}
      <div className="pointer-events-none fixed w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.07]"
        style={{ background: "#5470FE", top: "-10%", left: "20%", animation: "blobFloat1 20s ease-in-out infinite" }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b overflow-hidden"
        style={{
          background: isDark ? "rgba(0,0,0,0.5)" : "rgba(245,245,247,0.6)",
          borderColor,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}>
        <div className="flex items-center gap-6">
          <Link href="/" className="font-[family-name:var(--font-akony)] text-lg tracking-widest" style={{ color: "var(--foreground)" }}>
            LUMA
          </Link>
          <span className="font-[family-name:var(--font-outfit)] text-sm" style={{ color: fg(0.3) }}>/</span>
          <span className="font-[family-name:var(--font-outfit)] text-sm" style={{ color: fg(0.5) }}>Docs</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/dashboard"
            className="font-[family-name:var(--font-outfit)] text-sm px-4 py-1.5 rounded-full border transition-colors"
            style={{ borderColor, color: "var(--foreground)" }}>
            Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-12 flex gap-12">

        {/* Sidebar nav */}
        <aside className="hidden lg:flex flex-col gap-1 w-48 shrink-0 sticky top-24 self-start">
          <p className="font-[family-name:var(--font-outfit)] text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: fg(0.25) }}>Contents</p>
          {navItems.map(item => (
            <button key={item.id} onClick={() => scrollTo(item.id)}
              className="font-[family-name:var(--font-outfit)] text-sm py-1 text-left transition-colors hover:text-[#5470FE]"
              style={{ color: fg(0.45) }}>
              {item.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 flex flex-col gap-8 min-w-0">

          {/* Hero */}
          <div className="pb-8" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 font-[family-name:var(--font-outfit)] text-xs font-semibold"
              style={{ background: "rgba(84,112,254,0.12)", color: "#5470FE" }}>
              Developer Docs
            </div>
            <h1 className="font-[family-name:var(--font-akony)] text-3xl tracking-wide mb-3" style={{ color: "var(--foreground)" }}>
              LUMA Oracle
            </h1>
            <P>LUMA lets you push any external API data directly onto Solana. You configure a feed once — LUMA fetches, parses, and writes it on-chain automatically on your schedule.</P>
          </div>

          <Section id="overview" title="Overview">
            <P>Each <strong style={{ color: "var(--foreground)" }}>feed</strong> is a Solana program account (PDA) that stores a JSON payload. LUMA's backend fetches a URL you specify, extracts the fields you select, and calls the <Code>write_data</Code> instruction on your feed account. The data is then publicly readable on-chain by any program or client.</P>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              {[
                { icon: <IconLink />, title: "Any API", desc: "REST endpoints, crypto prices, weather, sports — anything that returns JSON." },
                { icon: <IconClock />, title: "Automated", desc: "Runs on your schedule. Loop every N seconds or trigger at an exact UTC time." },
                { icon: <IconChain />, title: "On-chain", desc: "Data lands in a Solana account — verifiable by any smart contract." },
              ].map(c => (
                <div key={c.title} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
                  {c.icon}
                  <span className="font-[family-name:var(--font-outfit)] text-sm font-semibold" style={{ color: "var(--foreground)" }}>{c.title}</span>
                  <span className="font-[family-name:var(--font-outfit)] text-xs leading-relaxed" style={{ color: fg(0.45) }}>{c.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="create-feed" title="Creating a feed">
            <P>Open the <strong style={{ color: "var(--foreground)" }}>Dashboard</strong>, connect your Solana wallet, and click <strong style={{ color: "var(--foreground)" }}>Create new</strong>. Fill in the form:</P>

            <div className="flex flex-col gap-3">
              {[
                { field: "Name", desc: "A unique identifier for your feed. Becomes part of the on-chain PDA seed — cannot be changed later." },
                { field: "URL", desc: "The API endpoint to fetch. Supports GET and POST requests." },
                { field: "Headers / Body", desc: "Optional. Add auth tokens, API keys, or POST body parameters." },
                { field: "JSON path(s)", desc: "Dot-notation paths to the fields you want stored. Run the request inline and click fields directly in the response tree." },
                { field: "Schedule", desc: "Loop mode runs every N seconds. Daily mode triggers once at a fixed UTC time." },
              ].map(r => (
                <div key={r.field} className="flex gap-3">
                  <div className="shrink-0 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#5470FE" }} />
                  </div>
                  <div>
                    <span className="font-[family-name:var(--font-outfit)] text-sm font-semibold" style={{ color: "var(--foreground)" }}>{r.field} — </span>
                    <span className="font-[family-name:var(--font-outfit)] text-sm" style={{ color: fg(0.55) }}>{r.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4 flex gap-3" style={{ background: "rgba(84,112,254,0.08)", border: "1px solid rgba(84,112,254,0.2)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5470FE" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <P>Your wallet pays a small one-time SOL rent to create the on-chain account, plus ongoing transaction fees for each write. Keep your wallet topped up to avoid pausing the feed.</P>
            </div>
          </Section>

          <Section id="how-it-works" title="How it works">
            <P>Once a feed is active, LUMA's scheduler checks it every second and executes the following pipeline:</P>

            <div className="flex flex-col gap-3 mt-1">
              {[
                { num: "01", title: "Fetch", desc: "LUMA calls your URL with the configured method, headers, and body." },
                { num: "02", title: "Parse", desc: "The JSON response is traversed using your selected dot-notation paths. Only the selected values are extracted." },
                { num: "03", title: "Sign & write", desc: "A write_data transaction is built and signed by both LUMA's admin key and your payer wallet key, then submitted to Solana." },
                { num: "04", title: "Confirm", desc: "After confirmation, the transaction signature and fee are logged in the dashboard under Recent Writes." },
              ].map(s => (
                <div key={s.num} className="flex gap-4 p-4 rounded-xl" style={{ background: surfaceBg }}>
                  <span className="font-[family-name:var(--font-outfit)] text-xs font-bold shrink-0 mt-0.5" style={{ color: "#5470FE" }}>{s.num}</span>
                  <div>
                    <span className="font-[family-name:var(--font-outfit)] text-sm font-semibold" style={{ color: "var(--foreground)" }}>{s.title} — </span>
                    <span className="font-[family-name:var(--font-outfit)] text-sm" style={{ color: fg(0.55) }}>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="reading-data" title="Reading on-chain data">
            <P>Each feed is stored in a PDA (Program Derived Address) owned by the LUMA program. You can read the latest data at any time — from a smart contract or an off-chain client.</P>

            <P>The feed PDA is derived from three seeds:</P>
            <Block>{`seeds = ["feed", owner_pubkey, feed_name]
program_id = ${PROGRAM_ID}`}</Block>

            <P>From a TypeScript / JavaScript client using <Code>@solana/web3.js</Code>:</P>
            <Block>{`import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("${PROGRAM_ID}");

const [feedPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("feed"),
    ownerPublicKey.toBuffer(),
    Buffer.from(feedName),          // the name you gave the feed
  ],
  PROGRAM_ID
);

const accountInfo = await connection.getAccountInfo(feedPda);
// accountInfo.data contains the raw account bytes`}</Block>

            <P>The data payload starts at byte offset <Code>8</Code> (after the 8-byte Anchor discriminator). The next 4 bytes are a little-endian <Code>u32</Code> length prefix, followed by the UTF-8 encoded JSON string:</P>
            <Block>{`const raw  = accountInfo.data;
const len  = raw.readUInt32LE(8);           // 4 bytes after discriminator
const json = raw.slice(12, 12 + len).toString("utf8");
const data = JSON.parse(json);
// e.g. { "price": 68412, "volume": 1234567 }`}</Block>

            <P>From a Solana program (Rust / Anchor), pass the feed account as a remaining account and deserialize the data field directly from the account bytes.</P>
          </Section>

          <Section id="feed-structure" title="Feed structure">
            <P>The on-chain account layout (Anchor account):</P>
            <Block>{`pub struct Feed {
    pub owner:   Pubkey,    // wallet that created the feed
    pub name:    String,    // feed name (PDA seed, max 32 chars)
    pub data:    String,    // latest JSON payload (UTF-8)
    pub bump:    u8,        // PDA bump seed
}`}</Block>

            <P>The <Code>data</Code> field is a JSON object whose keys are the paths you selected when creating the feed:</P>
            <Block>{`// Example — paths selected: "bitcoin.usd", "bitcoin.usd_24h_change"
{
  "bitcoin.usd": 68412,
  "bitcoin.usd_24h_change": 2.14
}`}</Block>

            <div className="rounded-xl p-4 flex gap-3" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
              <P>The LUMA dashboard shows you the exact Feed PDA address for each feed. Copy it from the feed detail page.</P>
            </div>
          </Section>

          <Section id="scheduling" title="Scheduling">
            <P>LUMA supports two scheduling modes:</P>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
              <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5470FE" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  <span className="font-[family-name:var(--font-outfit)] text-sm font-semibold" style={{ color: "var(--foreground)" }}>Loop</span>
                </div>
                <P>Runs every <strong style={{ color: "var(--foreground)" }}>N seconds</strong> continuously. Good for real-time price feeds or frequently updated data. Minimum interval: 1 second.</P>
                <Code>mode: loop, time: 30  → every 30 seconds</Code>
              </div>
              <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: surfaceBg, border: `1px solid ${borderColor}` }}>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5470FE" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span className="font-[family-name:var(--font-outfit)] text-sm font-semibold" style={{ color: "var(--foreground)" }}>Daily</span>
                </div>
                <P>Triggers <strong style={{ color: "var(--foreground)" }}>once per day</strong> at a fixed UTC time. Good for daily settlement prices, sports results, or low-frequency data.</P>
                <Code>mode: date, time: 14:00  → every day at 14:00 UTC</Code>
              </div>
            </div>

            <P>You can pause or resume any feed from the dashboard at any time. Paused feeds stop making requests but keep their on-chain account and data intact.</P>
          </Section>

          {/* Footer */}
          <div className="pt-4 pb-12 flex items-center justify-between">
            <p className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: fg(0.2) }}>© {new Date().getFullYear()} LUMA. Built on Solana.</p>
            <a href="https://x.com/LUMAoracle" target="_blank" rel="noopener noreferrer"
              className="font-[family-name:var(--font-outfit)] text-xs transition-opacity hover:opacity-60"
              style={{ color: fg(0.3) }}>@LUMAoracle</a>
          </div>

        </main>
      </div>
    </div>
  );
}
