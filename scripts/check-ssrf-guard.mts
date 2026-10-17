/**
 * Verifies the SSRF guard in lib/safe-fetch.ts.
 *
 *   npx tsx scripts/check-ssrf-guard.mts
 *
 * Run this after touching safe-fetch.ts. The guard is the only thing standing
 * between /api/analyze and "fetch any address reachable from the server", and a
 * regression there is invisible until someone exploits it.
 *
 * Note on the second half: in a sandbox with no outbound DNS every hostname
 * fails to resolve and will be reported as a guard failure. That is expected
 * off-network — the block list is the half that matters and it needs no DNS.
 */
import { safeFetchHtml, BlockedUrlError } from "../lib/safe-fetch";

const MUST_BLOCK = [
  "http://169.254.169.254/latest/meta-data/", // cloud instance metadata
  "http://127.0.0.1:3000/",
  "http://localhost:5432/",
  "http://10.0.0.5/admin",
  "http://192.168.1.1/",
  "http://172.16.0.1/",
  "http://100.64.0.1/",                       // CGNAT
  "http://0.0.0.0/",
  "http://192.0.0.1/",
  "http://198.18.0.1/",                       // benchmarking
  "http://239.1.1.1/",                        // multicast
  "http://[::1]:8080/",
  "http://[::]/",
  "http://[fe80::1]/",                        // link-local
  "http://[fc00::1]/",                        // unique-local
  "http://[::ffff:127.0.0.1]/",               // IPv4-mapped, dotted
  "http://[0:0:0:0:0:ffff:7f00:1]/",          // same address, hex form
  "http://[::ffff:10.0.0.1]/",
  "file:///etc/passwd",
  "gopher://evil/"
];

const MUST_PASS = ["https://example.com/", "https://news.ycombinator.com/", "https://8.8.8.8/"];

async function main() {
  let failures = 0;

  console.log("Addresses that must be refused:\n");
  for (const url of MUST_BLOCK) {
    try {
      await safeFetchHtml(url);
      console.log(`  LEAK     ${url}`);
      failures++;
    } catch (err) {
      if (err instanceof BlockedUrlError) {
        console.log(`  blocked  ${url}`);
      } else {
        // Blocked only by a network error is NOT a guarantee — the guard
        // itself has to be the thing that refuses.
        console.log(`  LEAK     ${url}  (guard allowed it; network failed instead)`);
        failures++;
      }
    }
  }

  console.log("\nPublic addresses that must be allowed through the guard:\n");
  let dnsless = 0;
  for (const url of MUST_PASS) {
    try {
      await safeFetchHtml(url);
      console.log(`  ok       ${url}`);
    } catch (err) {
      if (err instanceof BlockedUrlError) {
        if (/could not resolve/.test(err.message)) {
          console.log(`  skipped  ${url}  (no DNS in this environment)`);
          dnsless++;
        } else {
          console.log(`  BLOCKED  ${url}  ->  ${err.message}`);
          failures++;
        }
      } else {
        console.log(`  ok       ${url}  (guard passed; network failed)`);
      }
    }
  }

  if (dnsless > 0) {
    console.log(`\n${dnsless} host check(s) skipped: this environment has no outbound DNS.`);
  }
  console.log(failures === 0 ? "\nPASS: the guard holds." : `\nFAIL: ${failures} problem(s).`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
