"use client";

const HIDDEN_LINES = [
  {
    id: "pocket-floor",
    label: "hidden line showing the floor of the internal pocket",
    view: "front",
    x1: 168,
    y1: 198,
    x2: 312,
    y2: 198,
    calloutX: 340,
    calloutY: 188,
  },
  {
    id: "hole-back",
    label: "hidden line on the back wall of the through hole",
    view: "front",
    x1: 238,
    y1: 268,
    x2: 238,
    y2: 332,
    calloutX: 258,
    calloutY: 300,
  },
  {
    id: "slot-bottom",
    label: "hidden line at the bottom of the milled slot",
    view: "top",
    x1: 548,
    y1: 278,
    x2: 678,
    y2: 278,
    calloutX: 708,
    calloutY: 268,
  },
];

function HiddenLine({ line, found, highlightId, onLineClick }) {
  const isFound = found.includes(line.id);
  const isHighlight = highlightId === line.id;

  let stroke = "rgba(186, 230, 253, 0.75)";
  let width = 1.4;
  if (isFound) {
    stroke = "#4ade80";
    width = 2.2;
  } else if (isHighlight) {
    stroke = "#fbbf24";
    width = 2.8;
  }

  return (
    <g>
      {isHighlight && (
        <line
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="#fbbf24"
          strokeWidth="8"
          strokeDasharray="10 6"
          opacity="0.35"
          className="line-glow"
        />
      )}
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke={stroke}
        strokeWidth={width}
        strokeDasharray="10 6"
        className={isHighlight ? "line-pulse" : ""}
      />
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke="transparent"
        strokeWidth="22"
        style={{ cursor: "pointer" }}
        onClick={() => onLineClick(line)}
      />
    </g>
  );
}

function Callout({ line }) {
  const mx = (line.x1 + line.x2) / 2;
  const my = (line.y1 + line.y2) / 2;

  return (
    <g className="callout" pointerEvents="none">
      <line
        x1={line.calloutX}
        y1={line.calloutY}
        x2={mx}
        y2={my}
        stroke="#fbbf24"
        strokeWidth="1.5"
      />
      <circle cx={line.calloutX} cy={line.calloutY} r="4" fill="#fbbf24" />
      <rect
        x={line.calloutX + 8}
        y={line.calloutY - 14}
        width="108"
        height="22"
        rx="3"
        fill="rgba(251, 191, 36, 0.15)"
        stroke="#fbbf24"
        strokeWidth="1"
      />
      <text
        x={line.calloutX + 14}
        y={line.calloutY + 1}
        fill="#fde68a"
        fontSize="10"
        fontFamily="Arial, sans-serif"
        fontWeight="600"
      >
        Hidden line
      </text>
    </g>
  );
}

function DimLine({ x1, y1, x2, y2, label, offset = 16 }) {
  const horizontal = Math.abs(y2 - y1) < 2;
  const stroke = "rgba(224, 242, 254, 0.9)";
  const fill = "rgba(224, 242, 254, 0.9)";

  if (horizontal) {
    const y = y1 - offset;
    return (
      <g stroke={stroke} strokeWidth="0.9" fill={fill} fontSize="11" fontFamily="Arial, sans-serif">
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
    <g stroke={stroke} strokeWidth="0.9" fill={fill} fontSize="11" fontFamily="Arial, sans-serif">
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
  const highlighted = HIDDEN_LINES.find((l) => l.id === highlightId);

  return (
    <svg
      viewBox="0 0 900 620"
      className="blueprint-svg"
      role="img"
      aria-label="Mechanical bracket blueprint"
    >
      <defs>
        <pattern id="bp-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(147, 197, 253, 0.12)" strokeWidth="0.6" />
        </pattern>
        <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f4c81" />
          <stop offset="100%" stopColor="#0a3a66" />
        </linearGradient>
      </defs>

      <rect width="900" height="620" fill="url(#paper)" />
      <rect x="24" y="24" width="852" height="572" fill="url(#bp-grid)" stroke="rgba(186, 230, 253, 0.5)" strokeWidth="2" />

      <text x="250" y="58" textAnchor="middle" fontSize="14" fontWeight="700" fill="#e0f2fe" fontFamily="Arial, sans-serif" letterSpacing="2">
        FRONT VIEW
      </text>
      <text x="250" y="76" textAnchor="middle" fontSize="10" fill="rgba(186, 230, 253, 0.7)" fontFamily="Arial, sans-serif">
        SCALE 1:2
      </text>

      <g stroke="#f8fafc" fill="none" strokeLinecap="square" strokeLinejoin="miter">
        <rect x="130" y="140" width="220" height="140" strokeWidth="2.4" />
        <rect x="130" y="280" width="220" height="60" strokeWidth="2.4" />
        <circle cx="240" cy="290" r="34" strokeWidth="2.4" />
        <line x1="168" y1="140" x2="312" y2="140" strokeWidth="2.4" />
        <line x1="168" y1="140" x2="168" y2="198" strokeWidth="2.4" />
        <line x1="312" y1="140" x2="312" y2="198" strokeWidth="2.4" />
        <circle cx="155" cy="310" r="9" strokeWidth="2" />
        <circle cx="325" cy="310" r="9" strokeWidth="2" />
        <path d="M 130 340 L 110 360 L 130 360 Z" strokeWidth="1.5" />
      </g>

      <g stroke="rgba(96, 165, 250, 0.9)" strokeWidth="1" strokeDasharray="28 8 6 8" fill="none">
        <line x1="240" y1="100" x2="240" y2="360" />
        <line x1="100" y1="290" x2="380" y2="290" />
      </g>

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

      <DimLine x1={130} y1={140} x2={350} y2={140} label='4.000"' offset={20} />
      <DimLine x1={350} y1={140} x2={350} y2={340} label='3.000"' offset={20} />

      <text x="650" y="58" textAnchor="middle" fontSize="14" fontWeight="700" fill="#e0f2fe" fontFamily="Arial, sans-serif" letterSpacing="2">
        TOP VIEW
      </text>
      <text x="650" y="76" textAnchor="middle" fontSize="10" fill="rgba(186, 230, 253, 0.7)" fontFamily="Arial, sans-serif">
        SCALE 1:2
      </text>

      <g stroke="#f8fafc" fill="none" strokeLinecap="square">
        <rect x="530" y="160" width="220" height="190" strokeWidth="2.4" />
        <rect x="565" y="195" width="150" height="55" strokeWidth="2.4" />
        <circle cx="580" cy="320" r="9" strokeWidth="2" />
        <circle cx="700" cy="320" r="9" strokeWidth="2" />
      </g>

      <g stroke="rgba(96, 165, 250, 0.9)" strokeWidth="1" strokeDasharray="28 8 6 8" fill="none">
        <line x1="640" y1="120" x2="640" y2="370" />
        <line x1="500" y1="255" x2="780" y2="255" />
      </g>

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

      <DimLine x1={530} y1={160} x2={750} y2={160} label='4.000"' offset={20} />

      {highlighted && <Callout line={highlighted} />}

      <g fontFamily="Arial, sans-serif" fontSize="11" fill="rgba(224, 242, 254, 0.85)">
        <line x1="48" y1="540" x2="88" y2="540" stroke="#f8fafc" strokeWidth="2.2" />
        <text x="96" y="544">Visible</text>
        <line x1="48" y1="562" x2="88" y2="562" stroke="rgba(186, 230, 253, 0.75)" strokeWidth="1.4" strokeDasharray="10 6" />
        <text x="96" y="566">Hidden</text>
        <line x1="180" y1="562" x2="220" y2="562" stroke="rgba(96, 165, 250, 0.9)" strokeWidth="1" strokeDasharray="28 8 6 8" />
        <text x="228" y="566">Center</text>
      </g>

      <g>
        <rect x="620" y="500" width="230" height="78" fill="rgba(10, 58, 102, 0.6)" stroke="rgba(186, 230, 253, 0.5)" strokeWidth="1.5" />
        <line x1="620" y1="528" x2="850" y2="528" stroke="rgba(186, 230, 253, 0.35)" />
        <line x1="620" y1="552" x2="850" y2="552" stroke="rgba(186, 230, 253, 0.35)" />
        <line x1="735" y1="500" x2="735" y2="578" stroke="rgba(186, 230, 253, 0.35)" />
        <text x="632" y="518" fontSize="11" fill="#e0f2fe" fontFamily="Arial, sans-serif" fontWeight="700">
          MOUNTING BRACKET
        </text>
        <text x="632" y="544" fontSize="9.5" fill="rgba(186, 230, 253, 0.8)" fontFamily="Arial, sans-serif">
          DWG: BR-2847-A
        </text>
        <text x="632" y="566" fontSize="9.5" fill="rgba(186, 230, 253, 0.8)" fontFamily="Arial, sans-serif">
          6061-T6 ALUMINUM
        </text>
        <text x="748" y="518" fontSize="9.5" fill="rgba(186, 230, 253, 0.8)" fontFamily="Arial, sans-serif">
          REV A
        </text>
        <text x="748" y="544" fontSize="9.5" fill="rgba(186, 230, 253, 0.8)" fontFamily="Arial, sans-serif">
          SHEET 1 OF 1
        </text>
        <text x="748" y="566" fontSize="9.5" fill="rgba(186, 230, 253, 0.8)" fontFamily="Arial, sans-serif">
          UNITS: INCHES
        </text>
      </g>
    </svg>
  );
}
