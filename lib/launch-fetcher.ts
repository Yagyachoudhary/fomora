// Naive URL fetcher — fetches HTML, strips tags, extracts a title.
// Good enough for an MVP. Swap for a proper scraper (e.g. Mozilla Readability or a
// dedicated extraction API) when accuracy matters.
//
// The network call goes through safeFetchHtml, NOT bare fetch(): this runs on a
// URL any signed-in user can supply, and the body comes back to them. See
// lib/safe-fetch.ts for what that guards against.

import { safeFetchHtml, BlockedUrlError } from "./safe-fetch";

export type FetchedLaunch = {
  name: string;
  text: string;
  /** Set when the URL was refused rather than merely unreachable. */
  blocked?: string;
};

export async function fetchLaunchContent(url: string): Promise<FetchedLaunch> {
  try {
    const { html } = await safeFetchHtml(url);

    // Pull a usable title — prefer Open Graph, then <title>.
    const og = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)/i);
    const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const name = (og?.[1] ?? t?.[1] ?? "Unknown").trim();

    // Strip scripts/styles, then tags, then collapse whitespace.
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return { name, text: text.slice(0, 8000) };
  } catch (err) {
    // A blocked URL is a user error worth reporting, not a scrape failure to
    // paper over — otherwise someone probing internal addresses just sees the
    // same "couldn't read that" as a genuine 404.
    if (err instanceof BlockedUrlError) {
      return { name: "Unknown", text: "", blocked: err.message };
    }
    return { name: "Unknown", text: "" };
  }
}
