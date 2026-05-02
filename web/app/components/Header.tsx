"use client";

import ThemeToggle from "./ThemeToggle";
import { useTheme } from "@/app/context/ThemeContext";

export default function Header() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const extra = id === "how-it-works" ? window.innerHeight * 0.35 : 0;
    const top = el.getBoundingClientRect().top + window.scrollY + extra - 72;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 overflow-hidden">
      {/* Gradient fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)"
            : "linear-gradient(to bottom, rgba(245,245,247,0.85) 0%, transparent 100%)",
        }}
      />

      {/* Logo */}
      <span
        className="relative font-[family-name:var(--font-akony)] text-lg tracking-widest cursor-pointer transition-colors"
        style={{ color: "var(--foreground)" }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        LUMA
      </span>

      {/* Nav links */}
      <nav className="relative hidden sm:flex items-center gap-8">
        {[
          { label: "Features", id: "features" },
          { label: "How it works", id: "how-it-works" },
        ].map(({ label, id }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className="font-[family-name:var(--font-outfit)] text-sm transition-colors"
            style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)")}
          >
            {label}
          </button>
        ))}
        <a
          href="/docs"
          className="font-[family-name:var(--font-outfit)] text-sm transition-colors"
          style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)")}
        >
          Docs
        </a>
      </nav>

      {/* Right side */}
      <div className="relative flex items-center gap-3">
        <ThemeToggle />
        <a
          href="/dashboard"
          className="font-[family-name:var(--font-outfit)] text-sm px-5 py-2 rounded-full border transition-colors"
          style={{
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          Dashboard
        </a>
      </div>
    </header>
  );
}
