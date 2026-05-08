export default function RadialGauge({ value, min, max, color, unit, label }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = -220 + pct * 260;
  const r = 46, cx = 60, cy = 60;

  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (endAngle) => {
    const s = toXY(-220);
    const e = toXY(endAngle);
    const large = endAngle - -220 > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  return (
    <svg viewBox="0 0 120 90" style={{ width: "100%", maxWidth: 120 }}>
      <path d={arcPath(40)} fill="none" stroke="#1a2535" strokeWidth="8" strokeLinecap="round" />
      <path
        d={arcPath(angle)}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        fill={color}
        style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}
      >
        {value}
      </text>
      <text
        x="60"
        y="73"
        textAnchor="middle"
        fill="#4a6080"
        style={{ fontSize: 7, fontFamily: "'DM Mono', monospace" }}
      >
        {unit || label}
      </text>
    </svg>
  );
}