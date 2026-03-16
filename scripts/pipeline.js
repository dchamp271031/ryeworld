#!/usr/bin/env node

/**
 * RYEWORLD CONTENT PIPELINE
 *
 * Daily engine for autonomous content generation.
 * Fetches sources, evaluates newsworthiness, generates articles via Claude API.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/pipeline.js
 *   ANTHROPIC_API_KEY=sk-... node scripts/pipeline.js --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";
import slugify from "slugify";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  town: {
    id: "rye-ny",
    name: "Rye",
    state: "NY",
    full_name: "City of Rye",
  },

  paths: {
    articles: path.join(ROOT, "src/content/articles"),
    processed: path.join(ROOT, "data/processed.json"),
    logs: path.join(ROOT, "logs"),
  },

  sources: [
    {
      id: "patch-rye",
      type: "rss",
      url: "https://patch.com/new-york/rye/rss",
      category: "local_news",
      quality: "low",
    },
    {
      id: "rye-city-news",
      type: "web",
      url: "https://www.ryeny.gov/news",
      category: "government",
      quality: "medium",
    },
    {
      id: "weather",
      type: "api",
      url: "https://api.weather.gov/gridpoints/OKX/40,60/forecast",
      category: "weather",
      quality: "high",
    },
  ],

  claude: {
    model: "claude-sonnet-4-20250514",
    temperature_content: 0.7,
    temperature_editorial: 0.3,
    max_tokens: 2000,
  },
};

// ============================================================
// CATEGORY NORMALIZATION
// ============================================================

const CATEGORY_MAP = {
  news: "news",
  "local news": "news",
  food: "food",
  "food & drink": "food",
  "food and drink": "food",
  events: "events",
  "things to do": "things-to-do",
  sports: "sports",
  community: "community",
  guide: "guide",
  ranked: "ranked",
  history: "history",
};

function normalizeCategory(cat) {
  return CATEGORY_MAP[cat.toLowerCase()] || "news";
}

// ============================================================
// SYSTEM PROMPT
// ============================================================

const SYSTEM_PROMPT = `You are the editorial agent for RYEWORLD, a hyper-local digital media property covering Rye, New York.

VOICE: Refined but not stuffy. Think: the Rye parent who volunteers at the Nature Center, knows every restaurant on Purchase Street by the chef's first name, and texts you when the Garnets win a playoff game. Knowledgeable, community-rooted, with a dry wit.

Write for people who LIVE here. Assume the reader knows where the Square House is, knows that parking on Purchase Street is a nightmare on Saturdays, and has an opinion about the best slice in town.

CONTENT RULES:
- Never publish unverified factual claims
- Every article must cite at least one data source
- Never fabricate quotes, statistics, dates, or details
- Lead with the news, not the setup
- No "hidden gem," "vibrant community," "bustling downtown," "nestled," "rich tapestry"
- Reference specific streets and landmarks by name (Purchase Street, Milton Rd, Memorial Field)
- Articles should be 200-600 words. Don't pad.
- Include town name in the title for SEO
- Restaurant/business coverage should be honest, not promotional

OUTPUT FORMAT: Respond with a JSON object containing:
{
  "title": "Article title (include Rye for SEO)",
  "slug": "url-friendly-slug",
  "excerpt": "1-2 sentence summary for cards and social",
  "category": "news|food|events|things-to-do|sports|community|guide|ranked|history",
  "content": "Full article in Markdown format",
  "instagram_caption": "Instagram caption with hashtags (or null if not social-worthy)",
  "tiktok_script": "30-45 second script (or null if not video-worthy)",
  "quality_score": 1-10,
  "publish_recommendation": "publish|hold|skip"
}

IMPORTANT: The "category" field must be one of these exact lowercase values: news, food, events, things-to-do, sports, community, guide, ranked, history.`;

// ============================================================
// DATA FETCHING
// ============================================================

async function fetchRSS(source) {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(source.url);
    return feed.items.map((item) => ({
      source_id: source.id,
      source_type: "rss",
      category: source.category,
      title: item.title,
      link: item.link,
      content: item.contentSnippet || item.content || "",
      date: item.pubDate || item.isoDate,
      id: item.guid || item.link,
    }));
  } catch (err) {
    console.error(`[RSS ERROR] ${source.id}: ${err.message}`);
    return [];
  }
}

async function fetchWeather() {
  try {
    const res = await fetch(
      "https://api.weather.gov/gridpoints/OKX/40,60/forecast",
      { headers: { "User-Agent": "RYEWORLD/1.0 (hello@ryeworld.world)" } }
    );
    const data = await res.json();
    const periods = data.properties?.periods?.slice(0, 6) || [];
    return [
      {
        source_id: "weather",
        source_type: "api",
        category: "weather",
        title: `Rye Weather: ${periods[0]?.shortForecast || "N/A"}`,
        content: periods
          .map((p) => `${p.name}: ${p.temperature}°${p.temperatureUnit} — ${p.shortForecast}`)
          .join("\n"),
        date: new Date().toISOString(),
        id: `weather-${new Date().toISOString().split("T")[0]}`,
      },
    ];
  } catch (err) {
    console.error(`[WEATHER ERROR]: ${err.message}`);
    return [];
  }
}

async function fetchAllSources() {
  console.log("\n📥 Fetching data sources...");
  let allItems = [];

  for (const source of CONFIG.sources) {
    if (source.type === "rss") {
      const items = await fetchRSS(source);
      console.log(`  ✓ ${source.id}: ${items.length} items`);
      allItems = allItems.concat(items);
    } else if (source.id === "weather") {
      const items = await fetchWeather();
      console.log(`  ✓ weather: ${items.length} items`);
      allItems = allItems.concat(items);
    }
  }

  return allItems;
}

// ============================================================
// DEDUPLICATION
// ============================================================

function loadProcessed() {
  try {
    const data = fs.readFileSync(CONFIG.paths.processed, "utf-8");
    return JSON.parse(data);
  } catch {
    return { processed_ids: [], last_run: null };
  }
}

function saveProcessed(db) {
  const dir = path.dirname(CONFIG.paths.processed);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG.paths.processed, JSON.stringify(db, null, 2));
}

function dedup(items, processed) {
  const newItems = items.filter((item) => !processed.processed_ids.includes(item.id));
  console.log(`\n🔍 Dedup: ${items.length} total → ${newItems.length} new items`);
  return newItems;
}

// ============================================================
// EDITORIAL EVALUATION (via Claude)
// ============================================================

async function evaluateItems(items) {
  if (items.length === 0) return [];

  console.log("\n🧠 Evaluating newsworthiness...");

  const itemSummaries = items
    .map((item, i) => `[${i}] "${item.title}" (${item.category}) — ${item.content?.slice(0, 200)}`)
    .join("\n\n");

  try {
    const client = new Anthropic();

    const response = await client.messages.create({
      model: CONFIG.claude.model,
      max_tokens: 1000,
      temperature: CONFIG.claude.temperature_editorial,
      system: `You evaluate local news items for Rye, NY. For each item, decide: is this worth covering on a local community site? Score 1-10.

Respond ONLY with a JSON array of objects: [{"index": 0, "score": 7, "reason": "new restaurant opening", "format": "article"}, ...]

Score guide:
- 8-10: Definitely cover (new restaurant, major event, sports result, school news)
- 5-7: Maybe cover (minor event, routine government, weather update)
- 1-4: Skip (crime blotter from other towns, national news, ads)`,
      messages: [
        {
          role: "user",
          content: `Evaluate these items for RYEWORLD:\n\n${itemSummaries}`,
        },
      ],
    });

    const text = response.content[0].text;
    const clean = text.replace(/```json|```/g, "").trim();
    const evaluations = JSON.parse(clean);

    const worthy = evaluations
      .filter((e) => e.score >= 6)
      .map((e) => ({ ...items[e.index], eval_score: e.score, eval_reason: e.reason, eval_format: e.format }));

    console.log(`  ✓ ${worthy.length} items pass threshold (score ≥ 6)`);
    return worthy;
  } catch (err) {
    console.error(`[EVAL ERROR]: ${err.message}`);
    return [];
  }
}

// ============================================================
// CONTENT GENERATION (via Claude)
// ============================================================

async function generateContent(item) {
  console.log(`\n✍️  Generating content for: "${item.title}"`);

  try {
    const client = new Anthropic();

    const response = await client.messages.create({
      model: CONFIG.claude.model,
      max_tokens: CONFIG.claude.max_tokens,
      temperature: CONFIG.claude.temperature_content,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Write content based on this source material:

Title: ${item.title}
Source: ${item.source_id}
Category: ${item.category}
Original content: ${item.content}
Source URL: ${item.link || "N/A"}
Date: ${item.date}

Generate a RYEWORLD article based on this. Remember to write in Rye's voice, include Purchase Street / local landmarks where relevant, and keep it between 200-500 words. Include an Instagram caption if this is social-worthy.

Respond with ONLY a JSON object matching the schema described in your system prompt. No markdown fences.`,
        },
      ],
    });

    const text = response.content[0].text;
    const clean = text.replace(/```json|```/g, "").trim();
    const content = JSON.parse(clean);

    // Normalize the category to match our schema
    content.category = normalizeCategory(content.category);

    console.log(`  ✓ Generated: "${content.title}" (quality: ${content.quality_score}/10, rec: ${content.publish_recommendation})`);
    return content;
  } catch (err) {
    console.error(`[GENERATE ERROR]: ${err.message}`);
    return null;
  }
}

// ============================================================
// OUTPUT — Save as Markdown
// ============================================================

function saveArticle(content, isDraft = false) {
  const slug = content.slug || slugify(content.title, { lower: true, strict: true });
  const date = new Date().toISOString().split("T")[0];
  const filename = `${date}-${slug}.md`;
  const filepath = path.join(CONFIG.paths.articles, filename);

  const frontmatter = `---
title: "${content.title.replace(/"/g, '\\"')}"
slug: "${slug}"
date: "${date}"
category: "${content.category}"
excerpt: "${content.excerpt.replace(/"/g, '\\"')}"
town: "${CONFIG.town.id}"
quality_score: ${content.quality_score}${isDraft ? "\ndraft: true" : ""}
---

${content.content}
`;

  if (!fs.existsSync(CONFIG.paths.articles)) {
    fs.mkdirSync(CONFIG.paths.articles, { recursive: true });
  }

  fs.writeFileSync(filepath, frontmatter);
  console.log(`  📄 Saved: ${filepath}${isDraft ? " (DRAFT)" : ""}`);

  // Save social content alongside if it exists
  if (content.instagram_caption) {
    const socialPath = filepath.replace(".md", ".social.json");
    fs.writeFileSync(
      socialPath,
      JSON.stringify(
        {
          instagram: content.instagram_caption,
          tiktok: content.tiktok_script,
          article_slug: slug,
          generated_at: new Date().toISOString(),
        },
        null,
        2
      )
    );
    console.log(`  📸 Social content saved: ${socialPath}`);
  }

  return filepath;
}

// ============================================================
// MAIN PIPELINE
// ============================================================

async function runPipeline() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("═══════════════════════════════════════════");
  console.log(`  RYEWORLD PIPELINE — ${CONFIG.town.name}, ${CONFIG.town.state}`);
  console.log(`  ${new Date().toISOString()}`);
  console.log(`  Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log("═══════════════════════════════════════════");

  // 1. Fetch data
  const items = await fetchAllSources();

  // 2. Deduplicate
  const processed = loadProcessed();
  const newItems = dedup(items, processed);

  if (newItems.length === 0) {
    console.log("\n✅ No new items to process. Pipeline complete.");
    return;
  }

  // 3. Evaluate
  const worthy = await evaluateItems(newItems);

  if (worthy.length === 0) {
    console.log("\n✅ No items passed editorial threshold. Pipeline complete.");
    processed.processed_ids.push(...newItems.map((i) => i.id));
    processed.last_run = new Date().toISOString();
    if (!dryRun) saveProcessed(processed);
    return;
  }

  // 4. Generate content (limit to 3 per run to control API costs)
  const results = [];
  for (const item of worthy.slice(0, 3)) {
    const content = await generateContent(item);
    if (content && content.publish_recommendation !== "skip") {
      results.push({ item, content });
    }
  }

  // 5. Save articles with quality gate
  let published = 0;
  let drafts = 0;
  let skipped = 0;

  if (!dryRun) {
    for (const { item, content } of results) {
      const score = content.quality_score || 0;

      if (score >= 8) {
        // High confidence — auto-publish
        saveArticle(content, false);
        published++;
      } else if (score >= 6) {
        // Medium confidence — save as draft
        saveArticle(content, true);
        drafts++;
      } else {
        // Low confidence — skip
        console.log(`  ✗ Skipping: "${content.title}" (quality: ${score})`);
        skipped++;
      }

      processed.processed_ids.push(item.id);
    }

    // Mark non-worthy items as processed too
    processed.processed_ids.push(
      ...newItems.filter((i) => !worthy.includes(i)).map((i) => i.id)
    );
    processed.last_run = new Date().toISOString();
    saveProcessed(processed);
  } else {
    console.log("\n🔍 DRY RUN — would have saved:");
    results.forEach(({ content }) => {
      const score = content.quality_score || 0;
      const tier = score >= 8 ? "PUBLISH" : score >= 6 ? "DRAFT" : "SKIP";
      console.log(`  - "${content.title}" (${content.category}, quality: ${score}, ${tier})`);
    });
  }

  // 6. Summary
  console.log("\n═══════════════════════════════════════════");
  console.log("  PIPELINE SUMMARY");
  console.log("═══════════════════════════════════════════");
  console.log(`  Items fetched:     ${items.length}`);
  console.log(`  New items:         ${newItems.length}`);
  console.log(`  Passed editorial:  ${worthy.length}`);
  console.log(`  Content generated: ${results.length}`);
  console.log(`  Auto-published:    ${published}`);
  console.log(`  Saved as draft:    ${drafts}`);
  console.log(`  Skipped:           ${skipped}`);
  console.log("═══════════════════════════════════════════\n");
}

// ============================================================
// RUN
// ============================================================

runPipeline().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
