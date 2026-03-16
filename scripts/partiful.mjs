#!/usr/bin/env node

/**
 * Partiful Event Scraper
 *
 * Extracts structured event data from public Partiful event URLs.
 * No auth required — reads og: meta tags and structured HTML.
 *
 * Usage:
 *   node scripts/partiful.mjs https://partiful.com/e/qdFeSYSXmeVfui2PGVdv
 *   node scripts/partiful.mjs --json https://partiful.com/e/...
 *   echo "https://partiful.com/e/abc123" | node scripts/partiful.mjs --stdin
 */

const PARTIFUL_URL_RE = /^https?:\/\/(www\.)?partiful\.com\/e\/[\w-]+\/?$/;

// --- Fetch & parse a single Partiful event URL ---

async function scrapeEvent(url) {
  if (!PARTIFUL_URL_RE.test(url)) {
    throw new Error(`Not a valid Partiful event URL: ${url}`);
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent": "RYEWORLD/1.0 (local news bot)",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }

  const html = await res.text();
  return parseEventHTML(html, url);
}

// --- Extract structured data from HTML ---

function parseEventHTML(html, url) {
  const meta = (name) => {
    // Try og: first, then twitter:, then plain meta
    for (const attr of ["property", "name"]) {
      for (const prefix of [`og:${name}`, `twitter:${name}`, name]) {
        const re = new RegExp(
          `<meta\\s+${attr}=["']${prefix}["']\\s+content=["']([^"']*?)["']`,
          "i"
        );
        const match = html.match(re);
        if (match) return decodeHTMLEntities(match[1]);
      }
      // Also try content-first ordering
      for (const prefix of [`og:${name}`, `twitter:${name}`, name]) {
        const re = new RegExp(
          `<meta\\s+content=["']([^"']*?)["']\\s+${attr}=["']${prefix}["']`,
          "i"
        );
        const match = html.match(re);
        if (match) return decodeHTMLEntities(match[1]);
      }
    }
    return null;
  };

  const rawTitle = meta("title") || extractTitle(html);
  const title = rawTitle?.replace(/\s*\|?\s*Partiful\s*$/, "").trim() || null;
  const description = meta("description");
  const image = meta("image");

  // Try to extract structured date/location from the page body
  const dateInfo = extractDate(html);
  const location = extractLocation(html);

  return {
    source: "partiful",
    url,
    title,
    description,
    image,
    date: dateInfo,
    location,
    scraped_at: new Date().toISOString(),
  };
}

function decodeHTMLEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? decodeHTMLEntities(match[1]).replace(/\s*\|\s*Partiful$/, "").trim() : null;
}

function extractDate(html) {
  // Partiful renders date info in various formats — try JSON-LD first
  const jsonLd = extractJsonLd(html);
  if (jsonLd?.startDate) {
    return {
      start: jsonLd.startDate,
      end: jsonLd.endDate || null,
    };
  }

  // Fallback: look for common date patterns in meta or visible text
  // Partiful often includes date in description
  return null;
}

function extractLocation(html) {
  const jsonLd = extractJsonLd(html);
  if (jsonLd?.location) {
    const loc = jsonLd.location;
    return {
      name: loc.name || null,
      address: loc.address?.streetAddress || loc.address || null,
      city: loc.address?.addressLocality || null,
      state: loc.address?.addressRegion || null,
    };
  }
  return null;
}

function extractJsonLd(html) {
  const re = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      // Could be an Event or array of things
      if (data["@type"] === "Event" || data["@type"] === "SocialEvent") {
        return data;
      }
      if (Array.isArray(data)) {
        const event = data.find((d) => d["@type"] === "Event" || d["@type"] === "SocialEvent");
        if (event) return event;
      }
    } catch {
      // malformed JSON-LD, skip
    }
  }
  return null;
}

// --- CLI ---

async function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const stdinMode = args.includes("--stdin");
  const urls = args.filter((a) => !a.startsWith("--"));

  if (stdinMode) {
    // Read URLs from stdin, one per line
    const input = await readStdin();
    urls.push(
      ...input
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => PARTIFUL_URL_RE.test(l))
    );
  }

  if (urls.length === 0) {
    console.error("Usage: node scripts/partiful.mjs <partiful-url> [--json]");
    console.error("       echo '<url>' | node scripts/partiful.mjs --stdin");
    process.exit(1);
  }

  const results = [];

  for (const url of urls) {
    try {
      const event = await scrapeEvent(url);
      results.push(event);

      if (!jsonMode) {
        printEvent(event);
      }
    } catch (err) {
      console.error(`✗ ${url}: ${err.message}`);
    }
  }

  if (jsonMode) {
    console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
  }
}

function printEvent(event) {
  console.log("\n─────────────────────────────────────");
  console.log(`  ${event.title || "(no title)"}`);
  console.log("─────────────────────────────────────");
  if (event.date?.start) console.log(`  when:  ${event.date.start}${event.date.end ? ` → ${event.date.end}` : ""}`);
  if (event.location?.name) console.log(`  where: ${event.location.name}`);
  if (event.location?.address) console.log(`         ${event.location.address}`);
  if (event.description) console.log(`  desc:  ${event.description.slice(0, 200)}${event.description.length > 200 ? "…" : ""}`);
  if (event.image) console.log(`  image: ${event.image}`);
  console.log(`  url:   ${event.url}`);
  console.log();
}

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

// --- Exportable for use in pipeline.js ---

export { scrapeEvent, parseEventHTML, PARTIFUL_URL_RE };

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
