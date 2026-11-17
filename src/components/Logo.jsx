export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo-mark">
      <rect width="64" height="64" rx="16" fill="var(--ink)" />
      <path
        d="M20 16h11.5C42.3 16 49 22.6 49 32s-6.7 16-17.5 16H20V16Zm8 7v18h3.3c6.2 0 9.7-3.5 9.7-9s-3.5-9-9.7-9H28Z"
        fill="var(--bg)"
      />
      <circle cx="48" cy="17" r="5" fill="var(--accent)" />
    </svg>
  );
}

export function Logo({ size = 28 }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo-word">Dispatch</span>
    </span>
  );
}
