// Realistic SVG civic map — roads, zones, markers, clusters, heatmap overlay

interface MarkerData {
  x: number; y: number; priority: "Critical" | "High" | "Medium" | "Low"; id: string; category: string;
}

interface ClusterData {
  x: number; y: number; count: number; radius: number; label: string;
}

interface HeatZone {
  x: number; y: number; w: number; h: number; level: "low" | "moderate" | "high" | "critical"; zone: string;
}

const MARKERS: MarkerData[] = [
  { x: 320, y: 180, priority: "Critical", id: "NV-1084", category: "Water Supply" },
  { x: 280, y: 260, priority: "Critical", id: "NV-1079", category: "Electricity" },
  { x: 420, y: 220, priority: "High", id: "NV-1072", category: "Sanitation" },
  { x: 510, y: 300, priority: "High", id: "NV-1065", category: "Roads" },
  { x: 360, y: 340, priority: "Medium", id: "NV-1058", category: "Street Lighting" },
  { x: 200, y: 190, priority: "Medium", id: "NV-1051", category: "Roads" },
  { x: 460, y: 140, priority: "Low", id: "NV-1044", category: "Water Supply" },
  { x: 580, y: 200, priority: "High", id: "NV-1039", category: "Roads" },
  { x: 240, y: 340, priority: "Critical", id: "NV-1033", category: "Water Supply" },
  { x: 550, y: 380, priority: "Medium", id: "NV-1028", category: "Electricity" },
];

const CLUSTERS: ClusterData[] = [
  { x: 305, y: 220, count: 187, radius: 38, label: "Water\nZone 4" },
  { x: 490, y: 260, count: 64, radius: 26, label: "Roads" },
  { x: 240, y: 310, count: 42, radius: 20, label: "Elec." },
];

const HEAT_ZONES: HeatZone[] = [
  { x: 160, y: 120, w: 200, h: 160, level: "moderate", zone: "Zone 1" },
  { x: 360, y: 100, w: 180, h: 140, level: "low", zone: "Zone 2" },
  { x: 230, y: 200, w: 220, h: 200, level: "critical", zone: "Zone 4" },
  { x: 460, y: 170, w: 180, h: 200, level: "high", zone: "Zone 3" },
  { x: 160, y: 340, w: 140, h: 120, level: "moderate", zone: "Zone 5" },
  { x: 520, y: 320, w: 120, h: 100, level: "low", zone: "Zone 6" },
];

const HEAT_COLORS: Record<string, string> = {
  low: "rgba(34,197,94,0.18)",
  moderate: "rgba(251,191,36,0.22)",
  high: "rgba(249,115,22,0.28)",
  critical: "rgba(239,68,68,0.32)",
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444", High: "#f59e0b", Medium: "#3b82f6", Low: "#22c55e",
};

type MapMode = "markers" | "heatmap" | "clusters";

interface Props {
  mode?: MapMode;
  height?: number;
  showControls?: boolean;
  showLocationPicker?: boolean;
  selectedZone?: string | null;
  onZoneClick?: (zone: string) => void;
}

export default function MapSvg({
  mode = "markers",
  height = 420,
  showControls = true,
  showLocationPicker = false,
  selectedZone = null,
  onZoneClick,
}: Props) {
  const W = 720;
  const H = height;

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-[#e8eff8]" style={{ height }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        {/* Base map background */}
        <rect width={W} height={H} fill="#e8eff8" />

        {/* Water bodies */}
        <ellipse cx={630} cy={100} rx={90} ry={50} fill="#bfd9f0" opacity={0.7} />
        <ellipse cx={80} cy={360} rx={60} ry={35} fill="#bfd9f0" opacity={0.6} />

        {/* Parks / green areas */}
        <rect x={390} y={320} width={80} height={60} rx={8} fill="#c8e6c9" opacity={0.8} />
        <rect x={130} y={140} width={60} height={45} rx={6} fill="#c8e6c9" opacity={0.7} />

        {/* City blocks */}
        {[
          [175,130,85,55],[270,130,70,55],[355,130,80,55],
          [175,200,55,55],[245,200,85,55],[345,200,70,55],[430,200,95,55],
          [175,270,85,55],[275,270,70,55],[360,270,65,55],[440,270,80,55],[535,270,75,55],
          [175,340,55,45],[245,340,80,45],[340,340,60,45],[415,340,55,45],[485,340,65,45],[565,340,70,45],
          [545,130,90,55],[550,200,75,55],
        ].map(([x,y,w,h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx={3} fill="#f0f4f8" stroke="#d1dbe8" strokeWidth={0.5} />
        ))}

        {/* Major roads (horizontal) */}
        {[120,195,265,325,395].map((y, i) => (
          <rect key={i} x={130} y={y} width={560} height={i === 0 ? 10 : 8} fill="white" opacity={0.9} />
        ))}
        {/* Major roads (vertical) */}
        {[160,260,345,430,525,620].map((x, i) => (
          <rect key={i} x={x} y={110} width={i === 0 || i === 5 ? 10 : 8} height={300} fill="white" opacity={0.9} />
        ))}

        {/* Road center dashes */}
        {[120,195,265,325,395].map((y) =>
          Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={145 + i * 46} y1={y + 4} x2={178 + i * 46} y2={y + 4} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="10,8" />
          ))
        )}

        {/* Zone labels */}
        {[
          { x: 215, y: 165, label: "Sector 3" },
          { x: 310, y: 165, label: "Sector 4" },
          { x: 400, y: 165, label: "Sector 5" },
          { x: 215, y: 235, label: "Zone 1" },
          { x: 300, y: 235, label: "Zone 4" },
          { x: 400, y: 235, label: "Zone 3" },
          { x: 500, y: 235, label: "Zone 6" },
          { x: 215, y: 310, label: "Sector 7" },
          { x: 310, y: 310, label: "Sector 8" },
          { x: 400, y: 310, label: "Sector 9" },
          { x: 498, y: 310, label: "Sector 10" },
          { x: 590, y: 310, label: "Zone 6" },
          { x: 590, y: 165, label: "Zone 2" },
        ].map(({ x, y, label }) => (
          <text key={label} x={x} y={y} textAnchor="middle" fontSize={8} fill="#94a3b8" fontFamily="Inter,sans-serif">{label}</text>
        ))}

        {/* Landmark labels */}
        {[
          { x: 205, y: 175, label: "Main Gate Road" },
          { x: 340, y: 200, label: "Civil Hospital" },
          { x: 480, y: 350, label: "Central Park" },
          { x: 618, y: 105, label: "Lake" },
        ].map(({ x, y, label }) => (
          <text key={label} x={x} y={y} textAnchor="middle" fontSize={7} fill="#7c9cc0" fontFamily="Inter,sans-serif" fontStyle="italic">{label}</text>
        ))}

        {/* ── HEATMAP MODE ────────────────────────────────── */}
        {mode === "heatmap" && HEAT_ZONES.map(({ x, y, w, h, level, zone }) => {
          const isSelected = selectedZone === zone;
          return (
            <g key={zone} style={{ cursor: "pointer" }} onClick={() => onZoneClick?.(zone)}>
              <rect x={x} y={y} width={w} height={h} rx={6} fill={HEAT_COLORS[level]}
                stroke={isSelected ? "#1d4ed8" : "transparent"} strokeWidth={isSelected ? 2 : 0} />
              <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central"
                fontSize={10} fontWeight="600" fill={level === "low" ? "#166534" : level === "moderate" ? "#92400e" : level === "high" ? "#9a3412" : "#991b1b"}
                fontFamily="Inter,sans-serif">
                {zone}
              </text>
              <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" dominantBaseline="central"
                fontSize={8} fill="#64748b" fontFamily="Inter,sans-serif">
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </text>
            </g>
          );
        })}

        {/* ── CLUSTER MODE ────────────────────────────────── */}
        {mode === "clusters" && CLUSTERS.map(({ x, y, count, radius, label }) => (
          <g key={label}>
            <circle cx={x} cy={y} r={radius + 12} fill="rgba(239,68,68,0.08)" />
            <circle cx={x} cy={y} r={radius} fill="rgba(239,68,68,0.7)" stroke="white" strokeWidth={2} style={{ cursor: "pointer" }} />
            <text x={x} y={y - 3} textAnchor="middle" fontSize={11} fontWeight="700" fill="white" fontFamily="Inter,sans-serif">{count}</text>
            <text x={x} y={y + 10} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.9)" fontFamily="Inter,sans-serif">{label.split("\n")[0]}</text>
            {/* Lines to individual markers */}
            {MARKERS.filter((_, i) => i % 3 === CLUSTERS.indexOf({ x, y, count, radius, label } as ClusterData) % 3).slice(0, 3).map((m, i) => (
              <line key={i} x1={x} y1={y} x2={m.x} y2={m.y} stroke="rgba(239,68,68,0.3)" strokeWidth={1} strokeDasharray="4,3" />
            ))}
          </g>
        ))}

        {/* ── MARKERS MODE ─────────────────────────────────── */}
        {(mode === "markers" || mode === "clusters") && MARKERS.map((m) => (
          <g key={m.id} style={{ cursor: "pointer" }}>
            <circle cx={m.x} cy={m.y} r={10} fill={PRIORITY_COLORS[m.priority]} opacity={0.2} />
            <circle cx={m.x} cy={m.y} r={6} fill={PRIORITY_COLORS[m.priority]} stroke="white" strokeWidth={1.5} />
            {m.priority === "Critical" && (
              <circle cx={m.x} cy={m.y} r={10} fill="none" stroke={PRIORITY_COLORS[m.priority]} strokeWidth={1} opacity={0.5} />
            )}
          </g>
        ))}

        {/* Location picker pin */}
        {showLocationPicker && (
          <g>
            <circle cx={320} cy={250} r={16} fill="rgba(37,99,235,0.15)" />
            <circle cx={320} cy={250} r={8} fill="#2563eb" stroke="white" strokeWidth={2} />
            <line x1={320} y1={258} x2={320} y2={272} stroke="#2563eb" strokeWidth={2} />
            <circle cx={320} cy={273} r={2} fill="#2563eb" />
          </g>
        )}
      </svg>

      {/* Map controls */}
      {showControls && (
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <button className="w-8 h-8 bg-white border border-slate-200 rounded shadow-sm text-slate-600 text-sm font-bold hover:bg-slate-50 flex items-center justify-center">+</button>
          <button className="w-8 h-8 bg-white border border-slate-200 rounded shadow-sm text-slate-600 text-sm font-bold hover:bg-slate-50 flex items-center justify-center">−</button>
          <button className="w-8 h-8 bg-white border border-slate-200 rounded shadow-sm text-slate-500 text-xs hover:bg-slate-50 flex items-center justify-center">◎</button>
        </div>
      )}

      {/* Legend (heatmap) */}
      {mode === "heatmap" && (
        <div className="absolute bottom-3 left-3 bg-white rounded-lg border border-slate-200 p-2 shadow-sm">
          <p className="text-[9px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Complaint Density</p>
          {[["low","Low","text-green-700"],["moderate","Moderate","text-amber-700"],["high","High","text-orange-700"],["critical","Critical","text-red-700"]].map(([level, label, cls]) => (
            <div key={level} className="flex items-center gap-1.5 mb-0.5">
              <div className="w-3 h-3 rounded" style={{ background: HEAT_COLORS[level] }} />
              <span className={`text-[9px] font-medium ${cls}`}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Legend (markers) */}
      {mode === "markers" && (
        <div className="absolute bottom-3 left-3 bg-white rounded-lg border border-slate-200 p-2 shadow-sm">
          {[["Critical","#ef4444"],["High","#f59e0b"],["Medium","#3b82f6"],["Low","#22c55e"]].map(([p, c]) => (
            <div key={p} className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              <span className="text-[9px] text-slate-600">{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
