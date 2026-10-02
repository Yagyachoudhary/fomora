"use client";
import { useState } from "react";
import { FomoraMascot } from "./FomoraMascot";

/**
 * The Fomora parrot.
 *
 * Defaults to the SVG mascot because it has NO background — it composites
 * cleanly onto cream, white or dark, at any size, the way Duolingo's flat owl
 * does. The supplied PNG has a white box baked in, which needs blend-mode
 * trickery and still tints the colours.
 *
 * Pass `usePng` once you have a transparent, wordmark-free export at
 * /parrot.png — then it switches over with an automatic SVG fallback.
 */
export function BrandParrot({
  size = 260,
  animate = true,
  usePng = false,
  className = ""
}: {
  size?: number;
  animate?: boolean;
  usePng?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!usePng || failed) {
    return (
      <span
        className={`${animate ? "parrot-float" : ""} ${className}`}
        style={{ display: "inline-flex", lineHeight: 0 }}
      >
        <FomoraMascot size={size} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/parrot.png"
      alt="Fomora"
      width={size}
      height={size}
      className={`${animate ? "parrot-float" : ""} ${className}`}
      style={{ width: size, height: "auto", display: "block" }}
      onError={() => setFailed(true)}
    />
  );
}
