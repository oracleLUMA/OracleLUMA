"use client";

import { useState, useEffect } from "react";
import ThemeToggle from "@/app/components/ThemeToggle";

type Step = "idle" | "connecting" | "signing" | "verifying" | "error";

export default function WalletGate({ onAuth, showCard = true }: { onAuth: (wallet: string) => void; showCard?: boolean }) {
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");

  const [blobsVisible, setBlobsVisible] = useState(false);
  const [cardVisible,  setCardVisible]  = useState(false);

  // Blobs appear immediately on mount
  useEffect(() => {
    let r2: number;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setBlobsVisible(true)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, []);

  // Card appears only once auth check is done (showCard = true)
  useEffect(() => {
    if (!showCard) return;
    let r2: number;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setCardVisible(true)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [showCard]);

  const connect = async () => {
    setError("");
    if (!window.solana?.isPhantom) {
      setError("Phantom wallet not found. Install it at phantom.app");
      return;
    }
    if (!window.solana.signMessage) {
      setError("This wallet does not support signMessage");
      return;
    }
    try {
      setStep("connecting");
      const { publicKey } = await window.solana.connect();
      const wallet = publicKey.toString();

      const nonceRes = await fetch(`/api/auth/nonce?wallet=${wallet}`);
      const { message, nonce } = await nonceRes.json();

      setStep("signing");
      const msgBytes = new TextEncoder().encode(message);
      const { signature } = await window.solana.signMessage(msgBytes, "utf8");

      setStep("verifying");
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, nonce, signature: Array.from(signature) }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || "Verification failed");
      }

      onAuth(wallet);
    } catch (e: unknown) {
      setStep("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const labels: Record<Step, string> = {
    idle: "Connect Wallet",
    connecting: "Connecting...",
    signing: "Sign in Phantom...",
    verifying: "Verifying...",
    error: "Try again",
  };

  const ease = "cubic-bezier(0.22,1,0.36,1)";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--background)" }}>

      {/* Blob 1 */}
      <div className="pointer-events-none absolute w-[600px] h-[600px] rounded-full blur-[100px]"
        style={{
          background: "#5470FE", top: "-10%", left: "10%",
          opacity:   blobsVisible ? 0.22 : 0,
          transform: blobsVisible ? "scale(1)" : "scale(0.5)",
          transition: `opacity 1.4s ${ease}, transform 1.4s ${ease}`,
          animation: blobsVisible ? "blobFloat1 18s ease-in-out infinite 1.4s" : "none",
        }} />

      {/* Blob 2 */}
      <div className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-[90px]"
        style={{
          background: "#5470FE", bottom: "-5%", right: "5%",
          opacity:   blobsVisible ? 0.18 : 0,
          transform: blobsVisible ? "scale(1)" : "scale(0.5)",
          transition: `opacity 1.6s ${ease} 0.15s, transform 1.6s ${ease} 0.15s`,
          animation: blobsVisible ? "blobFloat2 22s ease-in-out infinite 1.6s" : "none",
        }} />

      <div className="fixed bottom-6 right-6 z-50"><ThemeToggle /></div>

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 py-10 rounded-2xl text-center"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          maxWidth: 360, width: "100%",
          opacity:    cardVisible ? 1 : 0,
          transform:  cardVisible ? "none" : "translateY(28px) scale(0.97)",
          filter:     cardVisible ? "none" : "blur(12px)",
          transition: `opacity 0.65s ${ease}, transform 0.65s ${ease}, filter 0.65s ${ease}`,
        }}>

        <span className="font-[family-name:var(--font-akony)] text-2xl tracking-widest"
          style={{ color: "var(--foreground)" }}>
          LUMA
        </span>

        <div className="flex flex-col gap-1">
          <p className="font-[family-name:var(--font-outfit)] text-base font-semibold"
            style={{ color: "var(--foreground)" }}>
            Connect your wallet
          </p>
          <p className="font-[family-name:var(--font-outfit)] text-sm"
            style={{ color: "var(--foreground)", opacity: 0.4 }}>
            Sign a message to access your dashboard
          </p>
        </div>

        <button
          onClick={connect}
          disabled={step === "connecting" || step === "signing" || step === "verifying"}
          className="w-full py-3 rounded-xl font-[family-name:var(--font-outfit)] text-sm font-semibold text-white transition-all disabled:opacity-60"
          style={{ background: "#5470FE" }}
        >
          {labels[step]}
        </button>

        {error && (
          <p className="font-[family-name:var(--font-outfit)] text-xs text-red-400 text-center">{error}</p>
        )}

        <p className="font-[family-name:var(--font-outfit)] text-xs" style={{ color: "var(--foreground)", opacity: 0.25 }}>
          Works with Phantom on Solana
        </p>
      </div>
    </div>
  );
}
