import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Guarded outbound fetch for URLs supplied by users.
 *
 * WHY THIS EXISTS
 * /api/analyze takes a URL from any signed-in user and the server fetches it,
 * then returns the page text back to that user. Without a guard that is a
 * server-side request forgery primitive: submit http://169.254.169.254/… and
 * the server reads cloud instance metadata (including, on some providers,
 * credentials) and hands it back. Same for http://localhost:5432, any RFC1918
 * address, or anything else reachable from the deploy environment but not from
 * the open internet.
 *
 * WHAT IT ENFORCES
 *  - http/https only (no file:, gopher:, data:, ftp:)
 *  - every DNS answer for the host must be a public address
 *  - redirects are followed manually so each hop is re-validated; a public URL
 *    that 302s to 127.0.0.1 is blocked at the second hop
 *  - a hard timeout and a response size cap
 *  - HTML/text content types only
 *
 * KNOWN LIMITATION (deliberate, documented)
 * There is a TOCTOU window between resolving the host and fetch() resolving it
 * again. A DNS entry with a ~0 TTL could answer public on our check and private
 * on the real connection (DNS rebinding). Closing it properly means connecting
 * to the validated IP with a custom agent and carrying the Host header, which is
 * more machinery than this is worth today. The window is narrow and the payoff
 * for an attacker is one unauthenticated GET. Revisit if this ever fetches
 * anything privileged.
 */

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8000;
const MAX_BYTES = 2_000_000;

export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedUrlError";
  }
}

function ipv4IsPrivate(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return (
    a === 0 ||                            // "this network"
    a === 10 ||                           // RFC1918
    a === 127 ||                          // loopback
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) ||           // link-local — includes cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||  // RFC1918
    (a === 192 && b === 0) ||             // IETF protocol assignments
    (a === 192 && b === 168) ||           // RFC1918
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    a >= 224                              // multicast + reserved
  );
}

/**
 * Expand any IPv6 text form to its eight 16-bit groups.
 *
 * Necessary because matching on the textual form is not safe: the URL parser
 * rewrites "[::ffff:127.0.0.1]" to "::ffff:7f00:1", so a regex looking for a
 * dotted quad sails straight past a loopback address. Expanding first means
 * every notation for the same address is judged identically.
 */
function expandIpv6(input: string): number[] | null {
  let s = input;

  // Fold a trailing dotted quad into two hex groups.
  const dotted = s.match(/^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted) {
    const q = dotted[2].split(".").map(Number);
    if (q.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return null;
    s = `${dotted[1]}${(((q[0] << 8) | q[1]) >>> 0).toString(16)}:${(((q[2] << 8) | q[3]) >>> 0).toString(16)}`;
  }

  const halves = s.split("::");
  if (halves.length > 2) return null;

  const head = halves[0] ? halves[0].split(":").filter(Boolean) : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":").filter(Boolean) : [];

  let groups: string[];
  if (halves.length === 2) {
    const fill = 8 - head.length - tail.length;
    if (fill < 0) return null;
    groups = [...head, ...Array(fill).fill("0"), ...tail];
  } else {
    groups = head;
  }
  if (groups.length !== 8) return null;

  const nums = groups.map(g => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));
  return nums.some(Number.isNaN) ? null : nums;
}

function ipv6IsPrivate(ip: string): boolean {
  const g = expandIpv6(ip.toLowerCase().split("%")[0]); // drop any zone id
  if (!g) return true; // unparseable, so refuse

  // :: (unspecified) and ::1 (loopback)
  if (g.slice(0, 7).every(x => x === 0) && (g[7] === 0 || g[7] === 1)) return true;

  // ::ffff:a.b.c.d (IPv4-mapped) and ::a.b.c.d (IPv4-compatible):
  // judge by the embedded IPv4 address.
  if (g.slice(0, 5).every(x => x === 0) && (g[5] === 0xffff || g[5] === 0)) {
    const v4 = `${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.${g[7] & 0xff}`;
    return ipv4IsPrivate(v4);
  }

  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7  unique-local
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  return false;
}

function addressIsPrivate(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return ipv4IsPrivate(ip);
  if (v === 6) return ipv6IsPrivate(ip);
  return true; // unparseable — refuse
}

/** Throws BlockedUrlError unless every address this host resolves to is public. */
async function assertPublicHost(hostname: string): Promise<void> {
  // URL.hostname keeps the brackets on an IPv6 literal ("[::1]"), which isIP
  // does not accept. Without stripping them these fell through to DNS and were
  // blocked only because the lookup happened to fail — safe by accident, and
  // it would have rejected legitimate public IPv6 hosts too.
  const host = hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;

  // A bare IP in the URL never reaches DNS, so check it directly.
  if (isIP(host)) {
    if (addressIsPrivate(host)) {
      throw new BlockedUrlError(`refusing to fetch a private address (${host})`);
    }
    return;
  }

  let answers: { address: string }[];
  try {
    answers = await lookup(host, { all: true });
  } catch {
    throw new BlockedUrlError(`could not resolve ${host}`);
  }
  if (answers.length === 0) throw new BlockedUrlError(`no DNS answer for ${host}`);

  // ALL answers must be public. One private answer is enough to refuse, since
  // we cannot control which the connection picks.
  for (const { address } of answers) {
    if (addressIsPrivate(address)) {
      throw new BlockedUrlError(`${host} resolves to a private address`);
    }
  }
}

async function assertSafeUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new BlockedUrlError("not a valid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new BlockedUrlError(`unsupported scheme ${u.protocol}`);
  }
  await assertPublicHost(u.hostname);
  return u;
}

export type SafeFetchResult = { url: string; html: string };

/**
 * Fetch a user-supplied URL, validating the target at every redirect hop.
 */
export async function safeFetchHtml(raw: string): Promise<SafeFetchResult> {
  let current = await assertSafeUrl(raw);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Fomora/1.0; +https://fomora.app)",
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.8"
        }
      });
    } finally {
      clearTimeout(timer);
    }

    // Re-validate every hop: a public URL may redirect somewhere internal.
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new BlockedUrlError("redirect without a location");
      if (hop === MAX_REDIRECTS) throw new BlockedUrlError("too many redirects");
      current = await assertSafeUrl(new URL(location, current).toString());
      continue;
    }

    if (!res.ok) throw new Error(`fetch failed ${res.status}`);

    const type = res.headers.get("content-type") ?? "";
    if (!/text\/html|text\/plain|application\/xhtml/i.test(type)) {
      throw new BlockedUrlError(`unsupported content type (${type || "unknown"})`);
    }

    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) throw new BlockedUrlError("response too large");

    // Stream with a cap, because content-length can lie or be absent.
    const reader = res.body?.getReader();
    if (!reader) return { url: current.toString(), html: "" };

    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const buf = new Uint8Array(total > MAX_BYTES ? MAX_BYTES : total);
    let offset = 0;
    for (const c of chunks) {
      if (offset + c.byteLength > buf.length) break;
      buf.set(c, offset);
      offset += c.byteLength;
    }
    return { url: current.toString(), html: new TextDecoder().decode(buf) };
  }

  throw new BlockedUrlError("too many redirects");
}
