// The Fomora parrot. Two sizes: "sm" for the header, "lg" for onboarding/empty states.

export function FomoraMascot({ size = 40 }: { size?: number }) {
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
    <svg width={size} height={size} viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="208" rx="6" ry="11" fill="#6FAA5C" transform="rotate(-30 40 208)" />
      <ellipse cx="52" cy="200" rx="6" ry="11" fill="#6FAA5C" transform="rotate(-15 52 200)" />
      <rect x="35" y="212" width="170" height="10" rx="2" fill="#8B5A3C" />
      <ellipse cx="120" cy="130" rx="78" ry="86" fill="#6FAA5C" />
      <path d="M82 58 Q102 28 120 50 Q138 28 158 58 Q150 70 120 72 Q90 70 82 58 Z" fill="#5B9648" />
      <path d="M82 145 Q120 218 158 145 Q152 122 120 119 Q88 122 82 145 Z" fill="#F5D547" />
      <rect x="113" y="98" width="14" height="7" fill="#1A1714" />
      <circle cx="88" cy="100" r="29" fill="#1A1714" />
      <circle cx="88" cy="100" r="24" fill="#fff" />
      <circle cx="92" cy="103" r="10" fill="#3A2820" />
      <circle cx="94" cy="100" r="3.5" fill="#fff" />
      <circle cx="152" cy="100" r="29" fill="#1A1714" />
      <circle cx="152" cy="100" r="24" fill="#fff" />
      <circle cx="148" cy="103" r="10" fill="#3A2820" />
      <circle cx="150" cy="100" r="3.5" fill="#fff" />
      <path d="M104 124 Q120 132 136 124 L130 154 Q120 160 110 154 Z" fill="#F4A82B" />
      <path d="M168 110 Q210 138 198 198 Q172 178 162 132 Q160 115 168 110 Z" fill="#E63946" />
      <path d="M99 215 L97 222 M104 215 L106 222 M109 215 L111 222" stroke="#E67E22" strokeWidth="3" strokeLinecap="round" />
      <path d="M133 215 L131 222 M138 215 L140 222 M143 215 L145 222" stroke="#E67E22" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
