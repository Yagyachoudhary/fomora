"use client";
import { useState } from "react";

/**
 * Real product favicon with a typographic fallback.
 *
 * Uses Google's public favicon service — no API key, no rate limit worth worrying
 * about, and it already has almost every domain cached. If the domain has no
 * favicon (or the request fails) we fall back to the lettermark, so the layout
 * never breaks.
 *
 * Note: models hosted on huggingface.co or github.com will all show that host's
 * icon. That's intentional — "this lives on Hugging Face" is useful information,
 * not noise.
 */
export function LaunchIcon({
  url,
  name,
  size = 40
}: {
  url: string;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // malformed URL — fall through to the lettermark
  }

  if (!domain || failed) {
    return (
      <div className="logo-box" style={{ width: size, height: size, fontSize: size * 0.45 }}>
        {(name || "?").slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt=""
      width={size}
      height={size}
      className="logo-img"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
