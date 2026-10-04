// The Fomora parrot. Two sizes: "sm" for the header, "lg" for landing/empty states.
// Parts carry classes (m-wing, m-eyes, m-body, m-crest) so CSS can animate them —
// see the parrot-* keyframes in globals.css.

export function FomoraMascot({ size = 40, animated = false }: { size?: number; animated?: boolean }) {
  if (size <= 60) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#6FAA5C" />
        <path d="M28 38 Q40 22 50 36 Q60 22 72 38 Q66 42 50 44 Q34 42 28 38 Z" fill="#5B9648" />
        <circle cx="36" cy="48" r="13" fill="#1A1714" />
        <circle cx="36" cy="48" r="10" fill="#fff" />
        <circle cx="37" cy="49" r="4.5" fill="#1A1714" />
        <circle cx="64" cy="48" r="13" fill="#1A1714" />
        <circle cx="64" cy="48" r="10" fill="#fff" />
        <circle cx="63" cy="49" r="4.5" fill="#1A1714" />
        <rect x="46" y="46" width="8" height="4" fill="#1A1714" />
        <path d="M42 62 Q50 68 58 62 L54 78 Q50 80 46 78 Z" fill="#F4A82B" />
        <path d="M68 56 Q82 68 78 88 Q70 80 66 64 Q66 58 68 56 Z" fill="#E63946" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? "m-svg" : undefined}
    >
      {/* perch */}
      <g className="m-perch">
        <ellipse cx="40" cy="208" rx="6" ry="11" fill="#6FAA5C" transform="rotate(-30 40 208)" />
        <ellipse cx="52" cy="200" rx="6" ry="11" fill="#6FAA5C" transform="rotate(-15 52 200)" />
        <rect x="35" y="212" width="170" height="10" rx="2" fill="#8B5A3C" />
      </g>

      {/* body group — bobs */}
      <g className="m-body">
        {/* far wing, behind body — counter-flaps */}
        <path className="m-wing-back" d="M72 120 Q40 142 50 192 Q70 176 80 136 Z" fill="#5B9648" />

        <ellipse cx="120" cy="130" rx="78" ry="86" fill="#6FAA5C" />

        <g className="m-crest">
          <path d="M82 58 Q102 28 120 50 Q138 28 158 58 Q150 70 120 72 Q90 70 82 58 Z" fill="#5B9648" />
          <path d="M115 30 Q120 22 125 30 Q122 25 120 18 Q118 25 115 30 Z" fill="#5B9648" />
        </g>

        <path d="M82 145 Q120 218 158 145 Q152 122 120 119 Q88 122 82 145 Z" fill="#F5D547" />
        <path d="M100 168 Q120 198 140 168 Q132 158 120 157 Q108 158 100 168 Z" fill="#F0C040" opacity="0.55" />

        {/* glasses bridge */}
        <rect x="113" y="98" width="14" height="7" fill="#1A1714" />

        {/* eyes — blink */}
        <g className="m-eyes">
          <circle cx="88" cy="100" r="29" fill="#1A1714" />
          <circle cx="88" cy="100" r="24" fill="#fff" />
          <circle cx="92" cy="103" r="10" fill="#3A2820" />
          <circle cx="94" cy="100" r="3.5" fill="#fff" />
          <circle cx="152" cy="100" r="29" fill="#1A1714" />
          <circle cx="152" cy="100" r="24" fill="#fff" />
          <circle cx="148" cy="103" r="10" fill="#3A2820" />
          <circle cx="150" cy="100" r="3.5" fill="#fff" />
        </g>

        {/* beak */}
        <path d="M104 124 Q120 132 136 124 L130 154 Q120 160 110 154 Z" fill="#F4A82B" />
        <path d="M115 124 Q120 132 125 124 Q123 132 120 132 Q117 132 115 124" fill="#1A1714" opacity="0.2" />

        {/* near wing — flaps */}
        <path
          className="m-wing"
          d="M168 110 Q210 138 198 198 Q172 178 162 132 Q160 115 168 110 Z"
          fill="#E63946"
        />
        <path
          className="m-wing"
          d="M174 132 Q198 152 192 188 Q176 172 168 142 Q166 132 174 132 Z"
          fill="#C0392B"
          opacity="0.4"
        />

        {/* feet */}
        <path d="M99 215 L97 222 M104 215 L106 222 M109 215 L111 222" stroke="#E67E22" strokeWidth="3" strokeLinecap="round" />
        <path d="M133 215 L131 222 M138 215 L140 222 M143 215 L145 222" stroke="#E67E22" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
