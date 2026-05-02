"use client";

export function JsonTree({ data, path, selected, onSelect }: {
  data: unknown; path: string; selected: string[]; onSelect: (p: string) => void;
}) {
  if (data === null) return <span className="text-white/30">null</span>;
  if (typeof data === "boolean") return <span className="text-purple-400">{String(data)}</span>;
  if (typeof data === "number") return <span className="text-yellow-400">{data}</span>;
  if (typeof data === "string") return <span className="text-green-400">"{data}"</span>;

  if (Array.isArray(data)) {
    return (
      <span>
        {"["}
        <div className="pl-4">
          {data.map((item, i) => {
            const p = path ? `${path}[${i}]` : `[${i}]`;
            const isLeaf = typeof item !== "object" || item === null;
            return (
              <div key={i} className="flex items-start gap-1">
                <button
                  onClick={() => isLeaf && onSelect(p)}
                  className={`text-white/40 transition-colors ${isLeaf ? "hover:text-accent cursor-pointer" : "cursor-default"}`}
                  style={selected.includes(p) ? { color: "#5470FE" } : {}}
                >
                  [{i}]:
                </button>
                <JsonTree data={item} path={p} selected={selected} onSelect={onSelect} />
                {i < data.length - 1 && <span className="text-white/20">,</span>}
              </div>
            );
          })}
        </div>
        {"]"}
      </span>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    return (
      <span>
        {"{"}
        <div className="pl-4">
          {entries.map(([k, v], i) => {
            const p = path ? `${path}.${k}` : k;
            const isLeaf = typeof v !== "object" || v === null;
            return (
              <div key={k} className="flex items-start gap-1 group">
                <button
                  onClick={() => onSelect(p)}
                  className="shrink-0 transition-all font-semibold rounded px-1 -mx-1"
                  style={selected.includes(p)
                    ? { color: "#5470FE", background: "rgba(84,112,254,0.15)" }
                    : { color: "rgba(255,255,255,0.6)", background: "transparent" }}
                  onMouseEnter={e => { if (!selected.includes(p)) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={e => { if (!selected.includes(p)) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  title={`Click to select: ${p}`}
                >
                  {k}:
                </button>
                <span className={`transition-colors ${isLeaf && !selected.includes(p) ? "group-hover:text-white/80" : ""}`}>
                  <JsonTree data={v} path={p} selected={selected} onSelect={onSelect} />
                </span>
                {i < entries.length - 1 && <span className="text-white/20">,</span>}
              </div>
            );
          })}
        </div>
        {"}"}
      </span>
    );
  }

  return <span className="text-white/50">{String(data)}</span>;
}
