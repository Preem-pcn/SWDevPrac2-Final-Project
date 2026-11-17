// A string of lanterns hanging on a curve, drawn for the night market.
export default function Lanterns({ count = 9, className = "", depth = 120 }: { count?: number; className?: string; depth?: number }) {
  const w = 600;
  const p0 = [40, 20];
  const p1 = [w / 2, depth];
  const p2 = [w - 40, 20];
  const at = (t: number, i: number) => (1 - t) ** 2 * p0[i] + 2 * (1 - t) * t * p1[i] + t * t * p2[i];
  return (
    <svg viewBox={`0 0 ${w} 140`} className={className} aria-hidden="true">
      <path d={`M ${p0[0]} ${p0[1]} Q ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`} stroke="#8ACFF8" strokeWidth="3" fill="none" />
      {Array.from({ length: count }, (_, k) => {
        const t = 0.06 + (k * 0.88) / (count - 1);
        const x = at(t, 0);
        const y = at(t, 1);
        return (
          <g key={k} transform={`translate(${x} ${y})`}>
            <circle r="24" cy="14" fill="#F4EB6C" className="lantern-glow" style={{ animationDelay: `${k * 0.3}s` }} />
            <g className="lantern" style={{ animationDelay: `${k * 0.25}s` }}>
              <ellipse cy="15" rx="13" ry="15" fill={k % 2 ? "#F4EB6C" : "#FFD444"} />
            </g>
          </g>
        );
      })}
    </svg>
  );
}
