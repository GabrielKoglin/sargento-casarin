// Divisa de sargento (3 chevrons) — usada no lugar do "A" de CASARIN.
// Chevrons AMARELOS com contorno VERDE. aria-hidden: decorativa; o nome
// acessível vem do texto ao redor.
export function SgtBadge({ className }: { className?: string }) {
  const d = ["M14 50 L50 16 L86 50", "M14 71 L50 37 L86 71", "M14 92 L50 58 L86 92"];
  return (
    <i className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        {/* contorno verde (do logo) */}
        <g fill="none" stroke="#2f9e42" strokeWidth={20} strokeLinejoin="miter">
          {d.map((p) => (
            <path key={`o-${p}`} d={p} />
          ))}
        </g>
        {/* chevrons amarelos (do logo) */}
        <g fill="none" stroke="#f5df00" strokeWidth={13} strokeLinejoin="miter">
          {d.map((p) => (
            <path key={`b-${p}`} d={p} />
          ))}
        </g>
      </svg>
    </i>
  );
}
