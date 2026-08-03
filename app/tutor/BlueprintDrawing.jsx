"use client";

const HIDDEN_LINES = [
  {
    id: "pocket-floor",
    label: "hidden line showing the floor of the internal pocket",
    view: "front",
    x1: 155,
    y1: 168,
    x2: 285,
    y2: 168,
  },
  {
    id: "hole-back",
    label: "hidden line on the back wall of the through hole",
    view: "front",
    x1: 218,
    y1: 228,
    x2: 218,
    y2: 292,
  },
  {
    id: "slot-bottom",
    label: "hidden line at the bottom of the milled slot",
    view: "top",
    x1: 518,
    y1: 248,
    x2: 648,
    y2: 248,
  },
];

function HiddenLine({ line, found, highlightId, onLineClick }) {
  const isFound = found.includes(line.id);
  const isHighlight = highlightId === line.id;

  return (
    <g>
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke={isFound ? "#16a34a" : isHighlight ? "#ea580c" : "#555"}
        strokeWidth={isHighlight ? 2.5 : 1.2}
        strokeDasharray="10 6"
        className={isHighlight ? "line-pulse" : ""}
      />
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke="transparent"
        strokeWidth="18"
        style={{ cursor: "pointer" }}
        onClick={() => onLineClick(line)}
      />
    </g>
  );
}

function DimLine({ x1, y1, x2, y2, label, offset = 14 }) {
  const horizontal = Math.abs(y2 - y1) < 2;
  if (horizontal) {
    const y = y1 - offset;
    return (
      <g stroke="#222" strokeWidth="0.8" fill="#222" fontSize="11" fontFamily="Arial, sans-serif">
        <line x1={x1} y1={y1} x2={x1} y2={y} />
        <line x1={x2} y1={y2} x2={x2} y2={y} />
        <line x1={x1} y1={y} x2={x2} y2={y} />
        <text x={(x1 + x2) / 2} y={y - 5} textAnchor="middle">
          {label}
        </text>
      </g>
    );
  }
  const x = x1 - offset;
  return (
    <g stroke="#222" strokeWidth="0.8" fill="#222" fontSize="11" fontFamily="Arial, sans-serif">
      <line x1={x1} y1={y1} x2={x} y2={y1} />
      <line x1={x2} y1={y2} x2={x} y2={y2} />
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <text x={x - 8} y={(y1 + y2) / 2 + 4} textAnchor="end">
        {label}
      </text>
    </g>
  );
}

export { HIDDEN_LINES };

export default function BlueprintDrawing({ found, highlightId, onLineClick }) {
  return (
    <svg
      viewBox="0 0 800 560"
      className="blueprint-svg"
      role="img"
      aria-label="Mechanical bracket engineering drawing"
    >
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8edf2" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Paper */}
      <rect width="800" height="560" fill="#f8fafc" />
      <rect x="20" y="20" width="760" height="520" fill="url(#grid)" stroke="#1e293b" strokeWidth="2" />

      {/* FRONT VIEW label */}
      <text x="220" y="52" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1e293b" fontFamily="Arial, sans-serif">
        FRONT VIEW
      </text>
      <text x="220" y="68" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="Arial, sans-serif">
        SCALE 1:2
      </text>

      {/* Front view — mounting bracket */}
      <g stroke="#111" fill="none" strokeLinecap="square" strokeLinejoin="miter">
        {/* Main body outline */}
        <rect x="120" y="120" width="200" height="130" strokeWidth="2.2" />
        {/* Vertical flange */}
        <rect x="120" y="250" width="200" height="55" strokeWidth="2.2" />
        {/* Through hole */}
        <circle cx="220" cy="260" r="32" strokeWidth="2.2" />
        {/* Pocket opening (visible top edge) */}
        <line x1="155" y1="120" x2="285" y2="120" strokeWidth="2.2" />
        <line x1="155" y1="120" x2="155" y2="168" strokeWidth="2.2" />
        <line x1="285" y1="120" x2="285" y2="168" strokeWidth="2.2" />
        {/* Mounting holes */}
        <circle cx="145" cy="280" r="8" strokeWidth="1.8" />
        <circle cx="295" cy="280" r="8" strokeWidth="1.8" />
      </g>

      {/* Center lines — front */}
      <g stroke="#2563eb" strokeWidth="0.9" strokeDasharray="24 6 4 6" fill="none">
        <line x1="220" y1="90" x2="220" y2="320" />
        <line x1="90" y1="260" x2="350" y2="260" />
      </g>

      {/* Hidden lines — front view */}
      <g>
        {HIDDEN_LINES.filter((l) => l.view === "front").map((line) => (
          <HiddenLine
            key={line.id}
            line={line}
            found={found}
            highlightId={highlightId}
            onLineClick={onLineClick}
          />
        ))}
      </g>

      {/* Front view dimensions */}
      <DimLine x1={120} y1={120} x2={320} y2={120} label='4.000"' offset={18} />
      <DimLine x1={320} y1={120} x2={320} y2={305} label='3.000"' offset={18} />

      {/* TOP VIEW label */}
      <text x="583" y="52" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1e293b" fontFamily="Arial, sans-serif">
        TOP VIEW
      </text>
      <text x="583" y="68" textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="Arial, sans-serif">
        SCALE 1:2
      </text>

      {/* Top view */}
      <g stroke="#111" fill="none" strokeLinecap="square">
        <rect x="483" y="140" width="200" height="180" strokeWidth="2.2" />
        {/* Milled slot — visible edges */}
        <rect x="518" y="170" width="130" height="50" strokeWidth="2.2" />
        <circle cx="533" cy="290" r="8" strokeWidth="1.8" />
        <circle cx="633" cy="290" r="8" strokeWidth="1.8" />
      </g>

      {/* Center lines — top */}
      <g stroke="#2563eb" strokeWidth="0.9" strokeDasharray="24 6 4 6" fill="none">
        <line x1="583" y1="110" x2="583" y2="340" />
        <line x1="453" y1="230" x2="713" y2="230" />
      </g>

      {/* Hidden lines — top view */}
      <g>
        {HIDDEN_LINES.filter((l) => l.view === "top").map((line) => (
          <HiddenLine
            key={line.id}
            line={line}
            found={found}
            highlightId={highlightId}
            onLineClick={onLineClick}
          />
        ))}
      </g>

      {/* Top view dimension */}
      <DimLine x1={483} y1={140} x2={683} y2={140} label='4.000"' offset={18} />

      {/* Section indicator */}
      <g stroke="#111" strokeWidth="1.2" fill="none">
        <line x1="380" y1="200" x2="420" y2="200" />
        <text x="400" y="192" textAnchor="middle" fontSize="11" fill="#111" fontFamily="Arial, sans-serif">
          A
        </text>
      </g>

      {/* Line type legend */}
      <g fontFamily="Arial, sans-serif" fontSize="11" fill="#334155">
        <line x1="40" y1="490" x2="80" y2="490" stroke="#111" strokeWidth="2" />
        <text x="88" y="494">Visible line</text>

        <line x1="40" y1="510" x2="80" y2="510" stroke="#555" strokeWidth="1.2" strokeDasharray="10 6" />
        <text x="88" y="514">Hidden line</text>

        <line x1="200" y1="510" x2="240" y2="510" stroke="#2563eb" strokeWidth="0.9" strokeDasharray="24 6 4 6" />
        <text x="248" y="514">Center line</text>
      </g>

      {/* Title block */}
      <g>
        <rect x="560" y="460" width="200" height="70" fill="#fff" stroke="#1e293b" strokeWidth="1.5" />
        <line x1="560" y1="485" x2="760" y2="485" stroke="#1e293b" strokeWidth="0.8" />
        <line x1="560" y1="505" x2="760" y2="505" stroke="#1e293b" strokeWidth="0.8" />
        <line x1="660" y1="460" x2="660" y2="530" stroke="#1e293b" strokeWidth="0.8" />
        <text x="570" y="478" fontSize="10" fill="#1e293b" fontFamily="Arial, sans-serif" fontWeight="600">
          MOUNTING BRACKET
        </text>
        <text x="570" y="498" fontSize="9" fill="#475569" fontFamily="Arial, sans-serif">
          DWG NO: BR-2847-A
        </text>
        <text x="570" y="518" fontSize="9" fill="#475569" fontFamily="Arial, sans-serif">
          MATL: 6061-T6 AL
        </text>
        <text x="670" y="478" fontSize="9" fill="#475569" fontFamily="Arial, sans-serif">
          REV: A
        </text>
        <text x="670" y="498" fontSize="9" fill="#475569" fontFamily="Arial, sans-serif">
          SHEET: 1 OF 1
        </text>
        <text x="670" y="518" fontSize="9" fill="#475569" fontFamily="Arial, sans-serif">
          UNLESS NOTED: IN
        </text>
      </g>
    </svg>
  );
}
