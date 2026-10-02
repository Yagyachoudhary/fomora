"use client";
import { useState } from "react";
import { FomoraMascot } from "./FomoraMascot";

/**
 * The full-colour Fomora parrot.
 *
 * Uses /parrot.png from the public folder when it exists, and falls back to the
 * hand-built SVG mascot if the file is missing or fails to load — so the page
 * never renders a broken image, even before the asset is added.
 */
export function BrandParrot({
  size = 260,
  animate = true,
  className = ""
}: {
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`${animate ? "parrot-float" : ""} ${className}`} style={{ display: "inline-flex" }}>
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
