/**
 * Line icons for the coverage strip, replacing the emoji that were there.
 *
 * Emoji were doing real damage: they render differently on every OS, they
 * carry Apple/Google's house style rather than Fomora's, and at 17px against
 * Playfair they read as clipart on an otherwise editorial page. These are
 * drawn on one grid with one stroke weight, so the row scans as a set.
 *
 * Each icon is mostly `currentColor` so it inherits the label's ink, with a
 * single accent in the brand red or leaf green. One accent per icon — more
 * than that and twelve of them side by side turn into confetti.
 */

const RED = "#D63B2D";
const GREEN = "#6FAA5C";
const AMBER = "#E8A33D";

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Image AI": (
    <Svg>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.6 16.8 9 11.2l3.9 4 3.4-3.2 4.1 4" />
      <circle cx="16" cy="9" r="1.5" fill={RED} stroke="none" />
    </Svg>
  ),

  "Video AI": (
    <Svg>
      <path d="M3 8V5.6A1.6 1.6 0 0 1 4.6 4h14.8A1.6 1.6 0 0 1 21 5.6V8Z" />
      <path d="M8.2 4 6 8M13.2 4 11 8M18.2 4 16 8" />
      <path d="M3 8h18v10.4a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 18.4Z" />
      <path d="M10.6 11.6 15 14.1l-4.4 2.5Z" fill={RED} stroke={RED} />
    </Svg>
  ),

  "Voice AI": (
    <Svg>
      <rect x="9.4" y="2.8" width="5.2" height="10.4" rx="2.6" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v3.2M9.2 20.2h5.6" />
      <path d="M3.4 9.2v3.4M20.6 9.2v3.4" stroke={RED} />
    </Svg>
  ),

  "AI Coding": (
    <Svg>
      <rect x="3" y="4.4" width="18" height="12.2" rx="2" />
      <path d="M1.6 19.6h20.8" />
      <path d="M9.6 8.6 7.1 10.5l2.5 2" />
      <path d="M14.4 8.6l2.5 1.9-2.5 2" stroke={RED} />
    </Svg>
  ),

  Agents: (
    <Svg>
      <rect x="4" y="7.2" width="16" height="11.6" rx="3" />
      <path d="M12 7.2V4.4" />
      <circle cx="12" cy="3.2" r="1.3" />
      <circle cx="9.2" cy="12.4" r="1.5" fill={GREEN} stroke="none" />
      <circle cx="14.8" cy="12.4" r="1.5" fill={GREEN} stroke="none" />
      <path d="M9.4 16h5.2" />
    </Svg>
  ),

  "Music AI": (
    <Svg>
      <path d="M9.2 17V5.6l8.4-1.8V15" />
      <path d="M9.2 8.6 17.6 6.8" />
      <ellipse cx="7.1" cy="17.3" rx="2.3" ry="1.9" fill={RED} stroke={RED} />
      <ellipse cx="15.5" cy="15.3" rx="2.3" ry="1.9" fill={RED} stroke={RED} />
    </Svg>
  ),

  "Design Tools": (
    <Svg>
      <path d="M12 3.4c-5 0-9 3.8-9 8.6s4 8.6 9 8.6c1.3 0 2-.8 2-1.7 0-.8-.5-1.3-.5-2 0-.9.7-1.5 1.6-1.5H17c2.2 0 4-1.8 4-4 0-4.3-4-8-9-8Z" />
      <circle cx="7.6" cy="11.4" r="1.3" fill={RED} stroke="none" />
      <circle cx="10.4" cy="7.6" r="1.3" fill={AMBER} stroke="none" />
      <circle cx="15" cy="8.2" r="1.3" fill={GREEN} stroke="none" />
    </Svg>
  ),

  "Writing AI": (
    <Svg>
      <path d="M5 19.2 6.6 13.8 16.3 4.1a2.5 2.5 0 0 1 3.6 3.6L10.2 17.4Z" />
      <path d="M14.6 5.8l3.6 3.6" />
      <path d="M4.2 21.4h9.4" stroke={RED} />
    </Svg>
  ),

  "AI Search": (
    <Svg>
      <circle cx="10.6" cy="10.6" r="6.6" />
      <path d="M15.4 15.4 20.8 20.8" stroke={RED} strokeWidth={2.1} />
    </Svg>
  ),

  "3D & Animation": (
    <Svg>
      <path d="M12 2.6 20.8 7.6 12 12.6 3.2 7.6Z" />
      <path d="M3.2 7.6v8.8L12 21.4v-8.8" />
      <path d="M20.8 7.6v8.8L12 21.4" fill={GREEN} fillOpacity={0.18} />
    </Svg>
  ),

  "AI Infra": (
    <Svg>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1.2" fill={AMBER} fillOpacity={0.25} />
      <path d="M9.2 5V2.2M14.8 5V2.2M9.2 19v2.8M14.8 19v2.8" />
      <path d="M5 9.2H2.2M5 14.8H2.2M19 9.2h2.8M19 14.8h2.8" />
    </Svg>
  ),

  "Open Source": (
    <Svg>
      <circle cx="12" cy="4.6" r="2.5" fill={GREEN} fillOpacity={0.2} />
      <circle cx="5.6" cy="18" r="2.5" fill={GREEN} fillOpacity={0.2} />
      <circle cx="18.4" cy="18" r="2.5" fill={GREEN} fillOpacity={0.2} />
      <path d="M10.9 6.9 6.8 15.6M13.1 6.9l4.1 8.7M8.1 18h7.8" />
    </Svg>
  )
};

/** Order the strip renders in — grouped by what people actually make. */
export const CATEGORY_ORDER = [
  "Image AI",
  "Video AI",
  "Voice AI",
  "AI Coding",
  "Agents",
  "Music AI",
  "Design Tools",
  "Writing AI",
  "AI Search",
  "3D & Animation",
  "AI Infra",
  "Open Source"
] as const;
