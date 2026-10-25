/** Hero illustration: a milk bottle and glass at sunrise (sky = the milk line; gold = a thin sun arc). */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label="A bottle and a glass of fresh milk at sunrise"
      className={className}
    >
      <defs>
        <linearGradient id="hero-milk" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6f4fd" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="32" fill="#0D4C3C" />
      {/* Sunrise: thin gold arcs (accent only, no fill). */}
      <circle cx="200" cy="300" r="150" fill="none" stroke="#C5A253" strokeWidth="2" opacity="0.9" />
      <circle cx="200" cy="300" r="118" fill="none" stroke="#C5A253" strokeWidth="1" opacity="0.5" />
      <path d="M0 300 H400 V400 H0 Z" fill="#0b4033" />
      {/* Bottle */}
      <g transform="translate(118 92)">
        <rect x="34" y="0" width="44" height="22" rx="6" fill="#F4EADE" />
        <path
          d="M30 22 h52 v26 c0 10 18 20 18 44 v118 c0 12-10 22-22 22 h-44 c-12 0-22-10-22-22 V92 c0-24 18-34 18-44 z"
          fill="url(#hero-milk)"
          stroke="#F4EADE"
          strokeWidth="3"
        />
        <rect x="18" y="120" width="76" height="54" rx="8" fill="#0D4C3C" />
        <text
          x="56"
          y="146"
          textAnchor="middle"
          fill="#F4EADE"
          fontSize="17"
          fontWeight="600"
          letterSpacing="2"
        >
          DRS
        </text>
        <text x="56" y="164" textAnchor="middle" fill="#6FC5F4" fontSize="9" letterSpacing="3">
          A2 MILK
        </text>
      </g>
      {/* Glass */}
      <g transform="translate(236 196)">
        <path d="M0 0 h62 l-8 108 c-1 8-7 12-14 12 h-18 c-7 0-13-4-14-12 z" fill="#F4EADE" opacity="0.25" />
        <path d="M5 26 h52 l-6 78 c-1 6-5 9-10 9 h-20 c-5 0-9-3-10-9 z" fill="url(#hero-milk)" />
      </g>
      {/* Leaves */}
      <path d="M70 300 c10-40 40-60 70-62 c-6 30-30 56-70 62z" fill="#F4EADE" opacity="0.18" />
      <path d="M330 300 c-10-36-36-54-62-56 c5 28 26 50 62 56z" fill="#F4EADE" opacity="0.14" />
    </svg>
  );
}
