// Divisa de sargento (3 chevrons dourados) — usada no lugar do "A" de CASARIN.
// aria-hidden: é decorativa; o nome acessível vem do texto ao redor.
export function SgtBadge({ className }: { className?: string }) {
  return (
    <i className={className} aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        <path d="M14 50 L50 16 L86 50" fill="none" stroke="#ffd500" strokeWidth={13} strokeLinejoin="miter" />
        <path d="M14 71 L50 37 L86 71" fill="none" stroke="#ffd500" strokeWidth={13} strokeLinejoin="miter" />
        <path d="M14 92 L50 58 L86 92" fill="none" stroke="#ffd500" strokeWidth={13} strokeLinejoin="miter" />
      </svg>
    </i>
  );
}
