// Naive URL fetcher — fetches HTML, strips tags, extracts a title.
// Good enough for an MVP. Swap for a proper scraper (e.g. Mozilla Readability or a
// dedicated extraction API) when accuracy matters.

export async function fetchLaunchContent(url: string): Promise<{ name: string; text: string }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Fomora/1.0; +https://fomora.app)" },
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error(`fetch failed ${res.status}`);

    const html = await res.text();

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
  } catch {
    return { name: "Unknown", text: "" };
  }
}
