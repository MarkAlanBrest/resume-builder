"use client";

export default function LineIntro() {
  return (
    <svg viewBox="0 0 700 420" className="line-intro-svg" role="img" aria-label="Hidden line example">
      <rect width="700" height="420" fill="#0f4c81" rx="6" />

      <text x="350" y="48" textAnchor="middle" fill="#e0f2fe" fontSize="18" fontWeight="700" fontFamily="Arial, sans-serif">
        What is a Hidden Line?
      </text>
      <text x="350" y="72" textAnchor="middle" fill="rgba(186, 230, 253, 0.8)" fontSize="12" fontFamily="Arial, sans-serif">
        Learn the line type first — then we open the print
      </text>

      {/* Visible line example */}
      <g transform="translate(80, 110)">
        <rect x="0" y="0" width="220" height="220" fill="rgba(10, 58, 102, 0.5)" stroke="rgba(186, 230, 253, 0.3)" />
        <text x="110" y="28" textAnchor="middle" fill="#bae6fd" fontSize="13" fontWeight="600" fontFamily="Arial, sans-serif">
          VISIBLE LINE
        </text>
        <rect x="50" y="60" width="120" height="100" fill="none" stroke="#f8fafc" strokeWidth="3" />
        <text x="110" y="195" textAnchor="middle" fill="rgba(186, 230, 253, 0.75)" fontSize="11" fontFamily="Arial, sans-serif">
          Solid — edges you can see
        </text>
      </g>

      {/* Hidden line example */}
      <g transform="translate(400, 110)">
        <rect x="0" y="0" width="220" height="220" fill="rgba(10, 58, 102, 0.5)" stroke="rgba(186, 230, 253, 0.3)" />
        <text x="110" y="28" textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="600" fontFamily="Arial, sans-serif">
          HIDDEN LINE
        </text>
        <rect x="50" y="60" width="120" height="100" fill="none" stroke="#f8fafc" strokeWidth="3" />
        <line
          x1="50"
          y1="110"
          x2="170"
          y2="110"
          stroke="#fbbf24"
          strokeWidth="3"
          strokeDasharray="10 6"
          className="line-pulse"
        />
        <text x="110" y="195" textAnchor="middle" fill="rgba(251, 191, 36, 0.9)" fontSize="11" fontFamily="Arial, sans-serif">
          Dashed — edges you cannot see
        </text>
      </g>

      <text x="350" y="370" textAnchor="middle" fill="#e0f2fe" fontSize="13" fontFamily="Arial, sans-serif">
        A hidden line shows what is behind or inside the part
      </text>
      <text x="350" y="392" textAnchor="middle" fill="rgba(186, 230, 253, 0.7)" fontSize="11" fontFamily="Arial, sans-serif">
        When you are ready, open the print and find them on the real drawing
      </text>
    </svg>
  );
}
