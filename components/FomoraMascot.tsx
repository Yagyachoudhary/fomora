/**
 * The Fomora parrot — redrawn from Yagya's original design, with proportions
 * measured off that artwork rather than eyeballed.
 *
 * Vector rather than the source PNG for three reasons: it stays crisp from the
 * 40px nav mark to the 260px hero, it has no white box to hide against the
 * cream page, and its parts can move independently.
 *
 * The proportions that make it read as *this* bird, in viewBox units:
 *   body        166 wide x 230 tall (taller than wide, widest at mid-belly)
 *   glasses     span 173 — fractionally WIDER than the head, so the frames
 *               break the silhouette on both sides. This is the whole look.
 *   beak        short and high, tucked into the bridge gap, not a long nose
 *   wing        starts at the chest's right edge, overhangs the branch
 * Change the viewBox and the transform-origins in globals.css must change too.
 */
export function FomoraMascot({
  size = 240,
  animated = true,
  className = ""
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const TOES = [133, 145, 157, 181, 193, 205];

  return (
    <svg
      width={size}
      height={size * (310 / 330)}
      viewBox="0 0 330 310"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`fomora-parrot${animated ? "" : " m-still"} ${className}`}
      role="img"
      aria-label="Fomora parrot"
    >
      <defs>
        {/* Top-lit: lighter crown fading to a deeper belly. A flat fill loses
            the roundness the original has. */}
        <linearGradient id="fp-body" x1="165" y1="46" x2="165" y2="276" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#90D75A" />
          <stop offset="0.55" stopColor="#74C446" />
          <stop offset="1" stopColor="#5DAD36" />
        </linearGradient>
        <linearGradient id="fp-chest" x1="150" y1="173" x2="150" y2="250" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FCDC63" />
          <stop offset="1" stopColor="#F6C32C" />
        </linearGradient>
        <linearGradient id="fp-wing" x1="196" y1="178" x2="266" y2="282" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ED675A" />
          <stop offset="1" stopColor="#D64338" />
        </linearGradient>
        <linearGradient id="fp-beak" x1="165" y1="130" x2="168" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FBC23A" />
          <stop offset="1" stopColor="#EEA012" />
        </linearGradient>
      </defs>

      {/* ── Leaves, behind the branch ── */}
      <g className="m-perch">
        <path d="M95 266 C80 256 68 246 56 240" stroke="#5CA836" strokeWidth="6" strokeLinecap="round" />
        <path d="M72 252 C59 242 59 226 72 220 C85 227 85 245 72 252 Z" fill="#6FBE44" />
        <path d="M87 261 C75 250 78 233 91 231 C100 239 98 256 87 261 Z" fill="#55A331" />
      </g>

      {/* ── Rear crest tuft, tucked behind the head ── */}
      <path
        className="m-crest"
        d="M190 76 C206 54 226 46 238 54 C234 74 214 88 194 86 Z"
        fill="#5CAF3A"
      />

      {/* ── Body ── */}
      <path
        className="m-body"
        d="M165 46 C124 46 90 84 86 140 C82 196 108 276 165 276 C222 276 248 196 244 140 C240 84 206 46 165 46 Z"
        fill="url(#fp-body)"
      />

      {/* ── Folded far wing: the darker crescent *inside* the left edge. Drawn
           after the body, because in the original it's a shaded region of the
           bird, not a shape poking out of its silhouette. ── */}
      <path
        className="m-wing-back"
        d="M100 168 C90 198 92 236 106 262 C116 252 116 210 114 188 C112 174 107 166 100 168 Z"
        fill="#54A331"
      />

      {/* ── Front crest tuft, over the head ── */}
      <path
        className="m-crest"
        d="M156 72 C150 44 170 20 194 28 C204 50 184 70 164 80 Z"
        fill="#7ACE4C"
      />

      {/* ── Chest patch, three scalloped lobes along the bottom ── */}
      <path
        d="M112 194
           C112 179 130 173 150 173
           C170 173 188 179 188 194
           C188 207 185 219 180 228
           C176 252 163 252 161 224
           C159 251 146 251 144 224
           C142 250 129 248 126 222
           C118 212 112 203 112 194 Z"
        fill="url(#fp-chest)"
      />

      {/* ── Glasses: the one feature that makes this bird read as Fomora ── */}
      <g className="m-specs">
        <rect x="153" y="135" width="24" height="10" rx="5" fill="#161616" />
        <circle cx="120" cy="140" r="36" fill="#FFFDF5" stroke="#161616" strokeWidth="11" />
        <circle cx="210" cy="140" r="36" fill="#FFFDF5" stroke="#161616" strokeWidth="11" />
        {/* temple arms vanishing behind the head */}
        <path d="M84 132 C76 128 70 128 66 131" stroke="#161616" strokeWidth="10" strokeLinecap="round" />
        <path d="M246 132 C254 128 260 128 264 131" stroke="#161616" strokeWidth="10" strokeLinecap="round" />
      </g>

      <g className="m-eyes">
        <circle cx="127" cy="145" r="19" fill="#43291A" />
        <circle cx="203" cy="145" r="19" fill="#43291A" />
        <circle cx="120" cy="137" r="6.5" fill="#FFFFFF" />
        <circle cx="196" cy="137" r="6.5" fill="#FFFFFF" />
      </g>

      {/* ── Beak: short, high, sitting in the bridge gap ── */}
      <path
        d="M165 130 C181 134 189 160 182 180 C176 194 158 194 152 180 C145 160 150 134 165 130 Z"
        fill="url(#fp-beak)"
      />
      <path d="M174 164 C182 167 184 178 178 183 C172 180 171 169 174 164 Z" fill="#4A2F12" />
      <ellipse cx="174" cy="148" rx="3.2" ry="4" fill="#DE9710" />

      {/* ── Branch, crossing in front of the belly ── */}
      <g className="m-perch">
        <rect x="58" y="262" width="189" height="24" rx="11" fill="#8B5A2B" />
        <rect x="58" y="276" width="189" height="10" rx="5" fill="#6E4420" />
      </g>

      {/* ── Feet, gripping over the branch ── */}
      <g>
        {TOES.map(x => (
          <rect key={x} x={x - 6} y={256} width="12" height="22" rx="6" fill="#F5A623" />
        ))}
        {TOES.map(x => (
          <rect key={`hl-${x}`} x={x - 6} y={256} width="12" height="10" rx="5" fill="#FFC14D" />
        ))}
      </g>

      {/* ── Red wing, last so it sits over body and branch alike ── */}
      <g className="m-wing">
        {/* Left edge starts at 197, clear of the beak — in the original there
            is always green visible between beak and wing. */}
        <path
          d="M204 176 C238 178 272 208 278 244 C283 272 261 288 237 282 C212 274 198 240 197 208 C196 186 198 176 204 176 Z"
          fill="url(#fp-wing)"
        />
        <g stroke="#F3867A" strokeWidth="4" strokeLinecap="round" opacity="0.7">
          <path d="M219 202 C232 224 240 252 241 274" />
          <path d="M236 200 C251 222 261 248 262 268" />
          <path d="M252 207 C264 225 270 243 270 258" />
        </g>
      </g>
    </svg>
  );
}
