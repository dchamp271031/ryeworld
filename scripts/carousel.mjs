#!/usr/bin/env node

/**
 * RYEWORLD TikTok/Universal Carousel Generator
 *
 * Reads each article, generates 5-slide carousel (1080x1920 / 9:16):
 *   Slide 1: Hero photo + bold headline
 *   Slides 2-4: Key highlights / summary (warm craft aesthetic)
 *   Slide 5: CTA for engagement
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/carousel.mjs
 *   ANTHROPIC_API_KEY=sk-... node scripts/carousel.mjs --slug garnets-hockey-state-semis
 *   ANTHROPIC_API_KEY=sk-... node scripts/carousel.mjs --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'src/content/articles');
const IMAGES_DIR = path.join(ROOT, 'public/images');
const OUTPUT_DIR = path.join(ROOT, 'output/carousels');
const LOGO_PATH = path.join(ROOT, 'public/files/ryeworld-logo-white.svg');

const W = 1080;
const H = 1920;
const RED = '#E8222A';
const INK = '#1a1a18';
const PAPER = '#FAF8F4';
const KRAFT = '#d4c5a9';
const OLIVE = '#7a8c6e';
const RUST = '#c4623a';
const MUSTARD = '#d4a843';
const CREAM = '#f5ede3';
const WARM_WHITE = '#FAF8F4';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SLUG_FILTER = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;

// ============================================================
// HELPERS
// ============================================================

function parseArticle(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = {};
  match[1].split('\n').forEach(line => {
    const m = line.match(/^(\w[\w-]*):\s*"?(.+?)"?\s*$/);
    if (m) frontmatter[m[1]] = m[2];
  });

  return { ...frontmatter, body: match[2].trim() };
}

/** Wrap text to fit within a given character width */
function wrapText(text, maxChars = 28) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines;
}

/** Escape XML special chars for SVG */
function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Load the RYEWORLD globe logo as a resized sharp buffer.
 * Returns a PNG buffer at the specified height.
 */
async function loadLogo(height = 70) {
  const svgBuf = fs.readFileSync(LOGO_PATH);
  return sharp(svgBuf, { density: 300 })
    .resize({ height })
    .png()
    .toBuffer();
}

/**
 * Generate a noise/grain texture SVG for overlaying on solid backgrounds.
 * Uses SVG filter turbulence for a subtle film grain effect.
 */
function grainOverlay(opacity = 0.06) {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" filter="url(#grain)" opacity="${opacity}"/>
  </svg>`;
}

/**
 * Extract the first "big word" from text for oversized rendering.
 */
function extractBigWord(text) {
  const cleaned = text.replace(/^slide \d+:\s*/i, '');
  const words = cleaned.split(' ');

  const numIdx = words.findIndex(w => /^\$?[\d,.]+%?$/.test(w));
  if (numIdx !== -1) {
    const bigWord = words[numIdx];
    const rest = [...words.slice(0, numIdx), ...words.slice(numIdx + 1)].join(' ');
    return { bigWord, rest };
  }

  if (words.length > 2) {
    const properIdx = words.slice(1).findIndex(w => /^[A-Z][a-z]/.test(w));
    if (properIdx !== -1) {
      const bigWord = words[properIdx + 1];
      const rest = [...words.slice(0, properIdx + 1), ...words.slice(properIdx + 2)].join(' ');
      return { bigWord, rest };
    }
  }

  if (words[0] && words[0].length <= 3 && words.length > 1) {
    return { bigWord: words.slice(0, 2).join(' '), rest: words.slice(2).join(' ') };
  }
  return { bigWord: words[0] || '', rest: words.slice(1).join(' ') };
}

/**
 * Split body text into first sentence and the rest.
 * First sentence gets italic treatment.
 */
function splitFirstSentence(text) {
  const match = text.match(/^(.*?[.!?])\s+(.*)$/s);
  if (match) {
    return { first: match[1], rest: match[2] };
  }
  return { first: text, rest: '' };
}

/**
 * Compose final slide: takes a base image buffer and outputs JPEG.
 */
async function composeFinal(baseBuffer) {
  return sharp(baseBuffer)
    .jpeg({ quality: 92 })
    .toBuffer();
}

// ============================================================
// DECORATIVE ELEMENTS
// ============================================================

/** Hand-drawn squiggly line between two points — default sharpie weight */
function squiggleLine(x1, y1, x2, y2, amplitude = 10, color = RED, opacity = 0.7, strokeWidth = 5) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const waves = Math.max(3, Math.floor(length / 30));
  let d = `M ${x1} ${y1}`;
  for (let i = 0; i < waves; i++) {
    const t1 = (i + 0.5) / waves;
    const t2 = (i + 1) / waves;
    const cx = x1 + dx * t1;
    const cy = y1 + dy * t1 + (i % 2 === 0 ? -amplitude : amplitude);
    const ex = x1 + dx * t2;
    const ey = y1 + dy * t2;
    d += ` Q ${cx} ${cy} ${ex} ${ey}`;
  }
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round"/>`;
}

/** 8-pointed star/sparkle shape — bolder default */
function starShape(cx, cy, size = 40, color = MUSTARD, opacity = 0.6, rotation = 0) {
  const points = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI * 2) / 16 - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * 0.35;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return `<polygon points="${points.join(' ')}" fill="${color}" opacity="${opacity}" transform="rotate(${rotation} ${cx} ${cy})"/>`;
}

/** Diagonal striped background pattern */
function stripedBg(color1, color2, stripeWidth = 40, angle = -5) {
  return `
    <defs>
      <pattern id="stripes" width="${stripeWidth * 2}" height="${stripeWidth * 2}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})">
        <rect width="${stripeWidth}" height="${stripeWidth * 2}" fill="${color1}"/>
        <rect x="${stripeWidth}" width="${stripeWidth}" height="${stripeWidth * 2}" fill="${color2}"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#stripes)"/>
  `;
}

/** Tape/sticker rectangle */
function tapeStrip(x, y, w, h, color = WARM_WHITE, opacity = 0.7, rotation = -3) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${color}" opacity="${opacity}" transform="rotate(${rotation} ${x + w / 2} ${y + h / 2})"/>`;
}

/** Slightly imperfect circle doodle — sharpie weight */
function doodleCircle(cx, cy, r, color = RED, opacity = 0.15, strokeWidth = 4) {
  const k = r * 0.5522848;
  const wobble = r * 0.03;
  return `<path d="M ${cx - r + wobble} ${cy} C ${cx - r} ${cy - k - wobble}, ${cx - k + wobble} ${cy - r}, ${cx} ${cy - r + wobble} C ${cx + k} ${cy - r - wobble}, ${cx + r + wobble} ${cy - k}, ${cx + r} ${cy + wobble} C ${cx + r - wobble} ${cy + k}, ${cx + k} ${cy + r + wobble}, ${cx + wobble} ${cy + r} C ${cx - k - wobble} ${cy + r}, ${cx - r} ${cy + k + wobble}, ${cx - r + wobble} ${cy}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;
}

// ============================================================
// SUBJECT-SPECIFIC DOODLES
// ============================================================

/** Hockey stick doodle — sharpie hand-drawn style */
function doodleHockeyStick(x, y, size = 60, color = RED, opacity = 0.25, rotation = 0) {
  const s = size / 60;
  return `<g transform="translate(${x},${y}) rotate(${rotation}) scale(${s})" opacity="${opacity}">
    <path d="M 0 -30 L 0 20 Q 0 35 15 35 L 30 35" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

/** Puck doodle */
function doodlePuck(x, y, size = 40, color = RED, opacity = 0.2, rotation = 0) {
  const s = size / 40;
  return `<g transform="translate(${x},${y}) rotate(${rotation}) scale(${s})" opacity="${opacity}">
    <ellipse cx="0" cy="0" rx="20" ry="10" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="-12" y1="0" x2="12" y2="0" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

/** Generic sports ball (circle with cross stitches) */
function doodleBall(x, y, size = 44, color = RED, opacity = 0.2, rotation = 0) {
  const s = size / 44;
  return `<g transform="translate(${x},${y}) rotate(${rotation}) scale(${s})" opacity="${opacity}">
    <circle cx="0" cy="0" r="20" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    <path d="M -20 0 Q -10 -8 0 0 Q 10 8 20 0" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

/** Fork/knife doodle for food stories */
function doodleFork(x, y, size = 60, color = RED, opacity = 0.2, rotation = 0) {
  const s = size / 60;
  return `<g transform="translate(${x},${y}) rotate(${rotation}) scale(${s})" opacity="${opacity}">
    <line x1="-8" y1="-25" x2="-8" y2="25" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    <line x1="-8" y1="-25" x2="-8" y2="-10" stroke="${color}" stroke-width="2"/>
    <line x1="-14" y1="-25" x2="-14" y2="-12" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    <line x1="-2" y1="-25" x2="-2" y2="-12" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    <path d="M 8 -25 Q 18 -10 8 0 L 8 25" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}

/** Star burst / explosion doodle */
function doodleBurst(x, y, size = 50, color = RED, opacity = 0.2) {
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    const r = size * 0.5;
    rays.push(`<line x1="${x}" y1="${y}" x2="${x + r * Math.cos(angle)}" y2="${y + r * Math.sin(angle)}" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="${opacity}"/>`);
  }
  return rays.join('\n');
}

/** Arrow doodle — hand-drawn pointing right */
function doodleArrow(x, y, size = 80, color = RED, opacity = 0.25, rotation = 0) {
  const s = size / 80;
  return `<g transform="translate(${x},${y}) rotate(${rotation}) scale(${s})" opacity="${opacity}">
    <path d="M -35 0 Q -10 -3 30 0" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    <path d="M 20 -12 L 35 0 L 20 12" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

/** Underline scribble — thick hand-drawn double underline */
function scribbleUnderline(x, y, width, color = RED, opacity = 0.5) {
  const x2 = x + width;
  return `
    ${squiggleLine(x, y, x2, y, 6, color, opacity, 5)}
    ${squiggleLine(x + 10, y + 14, x2 - 10, y + 14, 4, color, opacity * 0.5, 3.5)}
  `;
}

/**
 * Get category-specific doodle functions based on article category.
 * Returns an array of positioned doodle SVG strings for scattering.
 */
function getCategoryDoodles(category, positions) {
  const cat = (category || '').toLowerCase();

  let doodleFn;
  if (cat.includes('sport') || cat.includes('hockey') || cat.includes('lacrosse') || cat.includes('football') || cat.includes('soccer') || cat.includes('basketball')) {
    // Sports categories — mix hockey sticks, pucks, balls
    const sportDoodles = [doodleHockeyStick, doodlePuck, doodleBall, doodleHockeyStick];
    doodleFn = (pos, i) => sportDoodles[i % sportDoodles.length](pos.x, pos.y, pos.size || 55, pos.color || RED, pos.opacity || 0.2, pos.rotation || 0);
  } else if (cat.includes('food') || cat.includes('restaurant') || cat.includes('dining')) {
    doodleFn = (pos, i) => doodleFork(pos.x, pos.y, pos.size || 55, pos.color || RED, pos.opacity || 0.2, pos.rotation || 0);
  } else {
    // Default: mix of arrows, bursts, circles
    const defaultDoodles = [
      (p) => doodleArrow(p.x, p.y, p.size || 70, p.color || RED, p.opacity || 0.2, p.rotation || 0),
      (p) => doodleBurst(p.x, p.y, p.size || 45, p.color || RED, p.opacity || 0.18),
      (p) => doodleCircle(p.x, p.y, (p.size || 50) / 2, p.color || RED, p.opacity || 0.15, 4),
    ];
    doodleFn = (pos, i) => defaultDoodles[i % defaultDoodles.length](pos);
  }

  return positions.map((pos, i) => doodleFn(pos, i)).join('\n');
}

// ============================================================
// CLAUDE API
// ============================================================

async function generateCarouselCopy(article) {
  const client = new Anthropic();

  const resp = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are RYEWORLD's social media writer. You write hot takes for Instagram/TikTok carousels. Your voice is opinionated, slightly provocative, and impossible to scroll past. You're the friend who always has the take nobody else will say out loud.

ARTICLE TITLE: ${article.title}
CATEGORY: ${article.category}
BODY:
${article.body.slice(0, 3000)}

Generate exactly this JSON (no markdown, no code fences):
{
  "headline": "A 3-6 word HOT TAKE headline for the hero slide. Provocative. The kind of thing that makes someone say 'wait what?' and swipe.",
  "slides": [
    { "headline": "4-8 word shareable headline for slide 2. Each slide headline should be screenshot-worthy on its own.", "subtext": "1 SHORT sentence adding context. Max 15 words. Think caption energy." },
    { "headline": "4-8 word shareable headline for slide 3. Bold opinion or surprising stat.", "subtext": "1 SHORT sentence. Punchy. Add the spice." },
    { "headline": "4-8 word shareable headline for slide 4. The takeaway or mic drop.", "subtext": "1 SHORT sentence. Make it sting or stick." }
  ],
  "cta": "A polarizing question that DEMANDS a comment. Pick a side. Specific and debatable."
}

Rules:
- Hero headline must STOP SCROLLING. Tabloid energy meets local insider knowledge.
- Each slide headline should be independently shareable — if someone screenshots just that slide, the headline alone should hit. Think tweet-length hot takes.
- Subtext is supporting flavor, NOT the main event. Keep it under 15 words. One sentence max.
- Use real names, real numbers, real places. Specificity IS the clickbait.
- Voice: the person at the bar who knows everything about Rye and has OPINIONS. Confident. Slightly gossipy. Never boring. Never neutral.
- Short sentences. Fragments are fine. Drama is good.
- CTA should start a fight (friendly). "Best goalie in Section 1 history — yes or no?" is better than "What do you think?"
- No emojis. No hashtags. No corporate language.`
    }]
  });

  const text = resp.content[0].text.trim();
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error(`Failed to parse carousel copy: ${text.slice(0, 200)}`);
  }
}

// ============================================================
// IMAGE GENERATION
// ============================================================

/**
 * Slide 1: Hero photo with cinematic gradient, massive headline, category tag.
 *
 * Layout (1080x1920):
 *   Top-left: Logo composited at 48px from edges, 44px height
 *   Middle: Photo with INK gradient (softened)
 *   Bottom: Category tag, squiggly underline, giant headline
 *   Star sparkle near category pill
 */
async function makeSlide1(heroPath, headline, category) {
  const headlineUpper = headline.toUpperCase();
  const lines = wrapText(headlineUpper, 10);

  const fontSize = lines.length > 5 ? 110
    : lines.length > 4 ? 125
    : lines.length > 3 ? 140
    : lines.length > 2 ? 160
    : lines.length > 1 ? 180
    : 200;

  const lineHeight = fontSize * 1.05;
  const textBlockH = lines.length * lineHeight;
  const textStartY = H - 200 - textBlockH;

  const catText = category.toUpperCase();
  const catPillW = catText.length * 12 + 40;
  const catY = textStartY - 70;

  // Squiggly underline below headline
  const lastLineY = textStartY + 10 + (lines.length - 1) * lineHeight;
  const squiggleY = lastLineY + 20;

  const textSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${INK}" stop-opacity="0"/>
        <stop offset="20%" stop-color="${INK}" stop-opacity="0"/>
        <stop offset="35%" stop-color="${INK}" stop-opacity="0.10"/>
        <stop offset="50%" stop-color="${INK}" stop-opacity="0.35"/>
        <stop offset="65%" stop-color="${INK}" stop-opacity="0.60"/>
        <stop offset="78%" stop-color="${INK}" stop-opacity="0.82"/>
        <stop offset="90%" stop-color="${INK}" stop-opacity="0.92"/>
        <stop offset="100%" stop-color="${INK}" stop-opacity="0.95"/>
      </linearGradient>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#heroGrad)"/>

    <rect x="64" y="${catY}" width="${catPillW}" height="32" rx="3" fill="${RED}"/>
    <text x="${64 + catPillW / 2}" y="${catY + 22}" fill="white"
      font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700"
      letter-spacing="4" text-anchor="middle">${esc(catText)}</text>

    ${starShape(64 + catPillW + 30, catY + 2, 18, MUSTARD, 0.55, 15)}

    ${lines.map((l, i) => {
      const y = textStartY + 10 + i * lineHeight;
      return `<text x="64" y="${y}" fill="white"
        font-family="Impact, 'Arial Narrow', sans-serif" font-size="${fontSize}"
        letter-spacing="-1">${esc(l)}</text>`;
    }).join('\n')}

    ${scribbleUnderline(64, squiggleY, 400, RED, 0.6)}

    <!-- Red squiggly accents scattered -->
    ${squiggleLine(W - 320, 100, W - 60, 100, 10, RED, 0.4, 5)}
    ${squiggleLine(64, H - 140, 350, H - 140, 8, RED, 0.3, 4)}

    <!-- Subject doodles on hero -->
    ${getCategoryDoodles(category, [
      { x: W - 120, y: H - 350, size: 50, color: RED, opacity: 0.3, rotation: -15 },
      { x: W - 80, y: 220, size: 40, color: RED, opacity: 0.25, rotation: 20 },
    ])}

    <!-- Star sparkles -->
    ${starShape(W - 100, catY - 40, 22, '#ffffff', 0.25, 10)}
  </svg>`;

  let base;
  if (fs.existsSync(heroPath)) {
    base = sharp(heroPath).resize(W, H, { fit: 'cover', position: 'center' });
  } else {
    base = sharp({ create: { width: W, height: H, channels: 3, background: { r: 232, g: 34, b: 42 } } });
  }

  const logoSmall = await loadLogo(44);

  const baseBuffer = await base
    .composite([
      { input: Buffer.from(textSvg), top: 0, left: 0 },
      { input: logoSmall, top: 48, left: 48 },
    ])
    .jpeg({ quality: 95 })
    .toBuffer();

  return baseBuffer;
}

/**
 * Slides 2-4: Big shareable headline + small subtext + category doodles.
 *
 * Each slide has a unique warm background and is scattered with
 * sharpie-weight red squiggles and subject-specific doodles.
 *
 * Slide 2: Striped CREAM bg
 * Slide 3: Solid OLIVE bg
 * Slide 4: KRAFT bg with striped accent bar
 */
async function makeTextSlide(slideData, slideNum, totalSlides, category) {
  // Support both old string format and new {headline, subtext} format
  let headlineText, subtextText;
  if (typeof slideData === 'string') {
    const { first, rest } = splitFirstSentence(slideData);
    headlineText = first;
    subtextText = rest;
  } else {
    headlineText = slideData.headline || '';
    subtextText = slideData.subtext || '';
  }

  const headlineUpper = headlineText.toUpperCase();

  // Headline sizing — big Impact font, auto-scale to fit
  const headlineLines = wrapText(headlineUpper, 14);
  const headlineFontSize = headlineLines.length > 4 ? 72
    : headlineLines.length > 3 ? 82
    : headlineLines.length > 2 ? 96
    : headlineLines.length > 1 ? 110
    : 130;
  const headlineLineHeight = headlineFontSize * 1.1;

  // Subtext sizing
  const subtextFontSize = 36;
  const subtextLineHeight = subtextFontSize * 1.5;
  const subtextLines = wrapText(subtextText, 32);

  // Vertical layout — headline centered in upper-middle, subtext below
  const headlineBlockH = headlineLines.length * headlineLineHeight;
  const headlineStartY = Math.round(H * 0.35) - headlineBlockH / 2;
  const squiggleY = headlineStartY + headlineBlockH + 20;
  const subtextStartY = squiggleY + 60;

  const counterText = `${String(slideNum).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;

  let svgContent = '';

  if (slideNum === 2) {
    const textColor = INK;
    svgContent = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${stripedBg(CREAM, '#efe8dd', 50, -5)}

      <!-- Slide counter -->
      <text x="${W - 64}" y="46" fill="${textColor}"
        font-family="Arial, Helvetica, sans-serif" font-size="13"
        letter-spacing="4" text-anchor="end" opacity="0.3">${esc(counterText)}</text>

      <!-- Subject doodles scattered -->
      ${getCategoryDoodles(category, [
        { x: W - 130, y: 160, size: 55, color: RED, opacity: 0.2, rotation: 15 },
        { x: 120, y: H - 300, size: 50, color: RED, opacity: 0.15, rotation: -20 },
        { x: W - 200, y: H - 400, size: 45, color: RUST, opacity: 0.15, rotation: 30 },
      ])}

      <!-- Star sparkles -->
      ${starShape(W - 100, 100, 28, MUSTARD, 0.5, 12)}
      ${starShape(150, H - 200, 18, RED, 0.35, -15)}

      <!-- Red squiggly accents -->
      ${squiggleLine(64, headlineStartY - 40, 350, headlineStartY - 40, 8, RED, 0.4, 5)}
      ${squiggleLine(W - 350, H - 250, W - 80, H - 250, 10, RED, 0.3, 4)}

      <!-- HEADLINE — big Impact -->
      ${headlineLines.map((l, i) => {
        const y = headlineStartY + i * headlineLineHeight;
        return `<text x="64" y="${y}" fill="${textColor}"
          font-family="Impact, 'Arial Narrow', sans-serif" font-size="${headlineFontSize}"
          letter-spacing="-1">${esc(l)}</text>`;
      }).join('\n')}

      <!-- Sharpie scribble underline below headline -->
      ${scribbleUnderline(64, squiggleY, 400, RED, 0.6)}

      <!-- Subtext — Georgia italic, smaller -->
      ${subtextLines.map((l, i) => {
        const y = subtextStartY + i * subtextLineHeight;
        return `<text x="64" y="${y}" fill="${textColor}"
          font-family="Georgia, 'Times New Roman', serif" font-size="${subtextFontSize}"
          font-style="italic" letter-spacing="0.3" opacity="0.65">${esc(l)}</text>`;
      }).join('\n')}

      <!-- Doodle circle accent -->
      ${doodleCircle(W - 180, H * 0.6, 140, RED, 0.08, 4)}
    </svg>`;

  } else if (slideNum === 3) {
    const textColor = CREAM;
    svgContent = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="${OLIVE}"/>

      <!-- Slide counter -->
      <text x="${W - 64}" y="46" fill="${RED}"
        font-family="Arial, Helvetica, sans-serif" font-size="13"
        letter-spacing="4" text-anchor="end" opacity="0.25">${esc(counterText)}</text>

      <!-- Subject doodles -->
      ${getCategoryDoodles(category, [
        { x: W - 160, y: 200, size: 60, color: CREAM, opacity: 0.15, rotation: -10 },
        { x: 100, y: H - 350, size: 50, color: CREAM, opacity: 0.12, rotation: 25 },
        { x: W - 120, y: H - 250, size: 40, color: RED, opacity: 0.2, rotation: -30 },
        { x: 200, y: 150, size: 35, color: RED, opacity: 0.18, rotation: 45 },
      ])}

      <!-- Large doodle circle -->
      ${doodleCircle(820, 500, 320, CREAM, 0.08, 4)}

      <!-- Star sparkles -->
      ${starShape(W - 120, H - 200, 30, MUSTARD, 0.45, 8)}
      ${starShape(100, 120, 22, RED, 0.3, 20)}

      <!-- Red squiggly accents -->
      ${squiggleLine(64, headlineStartY - 50, 280, headlineStartY - 50, 10, RED, 0.5, 5)}
      ${squiggleLine(W - 400, H - 300, W - 100, H - 300, 8, RED, 0.35, 4.5)}
      ${squiggleLine(80, H - 180, 380, H - 180, 12, RED, 0.25, 5)}

      <!-- HEADLINE — big Impact, cream -->
      ${headlineLines.map((l, i) => {
        const y = headlineStartY + i * headlineLineHeight;
        return `<text x="64" y="${y}" fill="${textColor}"
          font-family="Impact, 'Arial Narrow', sans-serif" font-size="${headlineFontSize}"
          letter-spacing="-1">${esc(l)}</text>`;
      }).join('\n')}

      <!-- Sharpie scribble underline -->
      ${scribbleUnderline(64, squiggleY, 350, RED, 0.65)}

      <!-- Subtext -->
      ${subtextLines.map((l, i) => {
        const y = subtextStartY + i * subtextLineHeight;
        return `<text x="64" y="${y}" fill="${textColor}"
          font-family="Georgia, 'Times New Roman', serif" font-size="${subtextFontSize}"
          font-style="italic" letter-spacing="0.3" opacity="0.6">${esc(l)}</text>`;
      }).join('\n')}
    </svg>`;

  } else {
    // SLIDE 4: KRAFT with striped bar
    const textColor = INK;
    svgContent = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="${KRAFT}"/>

      <!-- Striped accent bar across top -->
      <defs>
        <pattern id="topStripes" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(-5)">
          <rect width="30" height="60" fill="${RUST}"/>
          <rect x="30" width="30" height="60" fill="#b05531"/>
        </pattern>
      </defs>
      <rect width="${W}" height="80" fill="url(#topStripes)"/>
      <line x1="0" y1="85" x2="${W}" y2="85" stroke="${RED}" stroke-width="4"/>

      <!-- Slide counter -->
      <text x="${W - 64}" y="46" fill="${CREAM}"
        font-family="Arial, Helvetica, sans-serif" font-size="13"
        letter-spacing="4" text-anchor="end" opacity="0.7">${esc(counterText)}</text>

      <!-- Subject doodles -->
      ${getCategoryDoodles(category, [
        { x: W - 150, y: 180, size: 55, color: RED, opacity: 0.22, rotation: 10 },
        { x: 130, y: H - 280, size: 50, color: RUST, opacity: 0.18, rotation: -15 },
        { x: W - 100, y: H - 350, size: 40, color: RED, opacity: 0.15, rotation: 40 },
      ])}

      <!-- Star sparkles -->
      ${starShape(W - 100, 200, 20, RED, 0.5, 20)}
      ${starShape(W - 220, H - 250, 25, MUSTARD, 0.4, -10)}
      ${starShape(100, H - 150, 16, RUST, 0.35, 30)}

      <!-- Red squiggly accents -->
      ${squiggleLine(64, headlineStartY - 30, 300, headlineStartY - 30, 8, RED, 0.45, 5)}
      ${squiggleLine(W - 300, H - 200, W - 60, H - 200, 10, RED, 0.3, 4.5)}

      <!-- Doodle circles -->
      ${doodleCircle(180, H * 0.65, 180, RUST, 0.10, 4)}
      ${doodleCircle(W - 250, H * 0.75, 100, RED, 0.08, 3.5)}

      <!-- HEADLINE — big Impact -->
      ${headlineLines.map((l, i) => {
        const y = headlineStartY + i * headlineLineHeight;
        return `<text x="64" y="${y}" fill="${textColor}"
          font-family="Impact, 'Arial Narrow', sans-serif" font-size="${headlineFontSize}"
          letter-spacing="-1">${esc(l)}</text>`;
      }).join('\n')}

      <!-- Sharpie scribble underline -->
      ${scribbleUnderline(64, squiggleY, 380, RED, 0.6)}

      <!-- Subtext -->
      ${subtextLines.map((l, i) => {
        const y = subtextStartY + i * subtextLineHeight;
        return `<text x="64" y="${y}" fill="${textColor}"
          font-family="Georgia, 'Times New Roman', serif" font-size="${subtextFontSize}"
          font-style="italic" letter-spacing="0.3" opacity="0.65">${esc(l)}</text>`;
      }).join('\n')}
    </svg>`;
  }

  const grainOpacity = slideNum === 3 ? 0.12 : 0.08;

  const baseBuffer = await sharp(Buffer.from(svgContent)).png().toBuffer();
  return sharp(baseBuffer)
    .composite([
      { input: Buffer.from(grainOverlay(grainOpacity)), top: 0, left: 0 },
    ])
    .jpeg({ quality: 95 })
    .toBuffer();
}

/**
 * Slide 5: CTA slide with warm handmade feel.
 *
 * Layout (1080x1920):
 *   Top 200px: subtle striped accent zone
 *   CTA text: Georgia italic, 52px, INK, centered around y = H*0.35
 *   Doodle circle around CTA area
 *   Squiggly decorative lines above and below text
 *   Scattered star sparkles
 *   Logo + @ryeworldny + "rye, ny" around y = H*0.55 to 0.6
 *   Thin squiggly line at bottom
 */
async function makeCTASlide(ctaText, ctaLogoBuffer, category) {
  const lines = wrapText(ctaText, 20);
  const fontSize = 52;
  const lineHeight = Math.round(fontSize * 1.35);
  const textBlockH = lines.length * lineHeight;

  // CTA text centered vertically in lower half
  const ctaTextStartY = 1050;

  // "FOLLOW RYEWORLD" big bold CTA
  const followY = ctaTextStartY + textBlockH + 100;

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${RED}"/>

    <!-- Paper grain -->
    <defs>
      <filter id="ctaGrain">
        <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" filter="url(#ctaGrain)" opacity="0.04"/>

    <!-- Thick white squiggly accents scattered -->
    ${squiggleLine(60, 120, 400, 120, 12, '#ffffff', 0.15, 5)}
    ${squiggleLine(500, 220, 950, 220, 10, '#ffffff', 0.12, 4.5)}
    ${squiggleLine(150, H - 200, 500, H - 200, 10, '#ffffff', 0.10, 4)}
    ${squiggleLine(600, H - 130, 980, H - 130, 8, '#ffffff', 0.08, 3.5)}

    <!-- White star sparkles -->
    ${starShape(150, 180, 24, '#ffffff', 0.2, 10)}
    ${starShape(W - 160, 140, 20, '#ffffff', 0.18, -20)}
    ${starShape(W - 120, H - 250, 18, '#ffffff', 0.15, 15)}
    ${starShape(120, H - 300, 16, '#ffffff', 0.12, 30)}

    <!-- Subject doodles in white -->
    ${getCategoryDoodles(category, [
      { x: W - 140, y: 300, size: 55, color: '#ffffff', opacity: 0.12, rotation: -20 },
      { x: 120, y: 280, size: 50, color: '#ffffff', opacity: 0.10, rotation: 25 },
      { x: W - 180, y: H - 350, size: 45, color: '#ffffff', opacity: 0.10, rotation: 10 },
      { x: 160, y: H - 400, size: 40, color: '#ffffff', opacity: 0.08, rotation: -30 },
    ])}

    <!-- "RYEWORLD" big Impact text -->
    <text x="540" y="660" fill="white"
      font-family="Impact, 'Arial Narrow', sans-serif" font-size="88"
      letter-spacing="10" text-anchor="middle">RYEWORLD</text>

    <!-- "your town on the sound" tagline -->
    <text x="540" y="720" fill="white"
      font-family="Georgia, 'Times New Roman', serif" font-size="30"
      font-style="italic" text-anchor="middle" opacity="0.55">your town on the sound</text>

    <!-- White squiggly divider above CTA -->
    ${squiggleLine(280, ctaTextStartY - 60, 800, ctaTextStartY - 60, 8, '#ffffff', 0.3, 5)}

    <!-- CTA question text — big and bold -->
    ${lines.map((l, i) => {
      const y = ctaTextStartY + i * lineHeight;
      return `<text x="540" y="${y}" fill="white"
        font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}"
        font-style="italic" text-anchor="middle">${esc(l)}</text>`;
    }).join('\n')}

    <!-- Scribble underline below CTA -->
    ${scribbleUnderline(300, ctaTextStartY + textBlockH + 20, 480, '#ffffff', 0.35)}

    <!-- FOLLOW RYEWORLD — big bold call to action -->
    <text x="540" y="${followY}" fill="white"
      font-family="Impact, 'Arial Narrow', sans-serif" font-size="56"
      letter-spacing="6" text-anchor="middle">FOLLOW @RYEWORLDNY</text>

    <!-- ryeworld.world -->
    <text x="540" y="${followY + 60}" fill="white"
      font-family="Arial, Helvetica, sans-serif" font-size="28"
      font-weight="bold" letter-spacing="3" text-anchor="middle" opacity="0.7">ryeworld.world</text>

    <!-- rye, ny -->
    <text x="540" y="${followY + 100}" fill="white"
      font-family="Arial, Helvetica, sans-serif" font-size="18"
      letter-spacing="5" text-anchor="middle" opacity="0.35">rye, ny</text>

    <!-- Doodle circle bottom -->
    ${doodleCircle(540, H - 140, 100, '#ffffff', 0.06, 3)}
  </svg>`;

  const logoMeta = await sharp(ctaLogoBuffer).metadata();
  const logoW = logoMeta.width;
  const logoX = Math.round((W - logoW) / 2);

  const baseBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return sharp(baseBuffer)
    .composite([
      { input: Buffer.from(grainOverlay(0.08)), top: 0, left: 0 },
      { input: ctaLogoBuffer, top: 340, left: logoX },
    ])
    .jpeg({ quality: 95 })
    .toBuffer();
}

// ============================================================
// MAIN
// ============================================================

async function processArticle(article, logoBuffer) {
  const slug = article.slug;
  const outDir = path.join(OUTPUT_DIR, slug);

  if (fs.existsSync(outDir) && fs.readdirSync(outDir).length >= 5) {
    console.log(`  [skip] ${slug} — already generated`);
    return;
  }

  console.log(`\n  Generating carousel for: ${slug}`);

  console.log('  [1/3] Generating copy with Claude...');
  const copy = await generateCarouselCopy(article);
  console.log(`  Headline: "${copy.headline}"`);

  if (DRY_RUN) {
    console.log('  [dry-run] Copy generated:');
    console.log(JSON.stringify(copy, null, 2));
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, 'copy.json'), JSON.stringify(copy, null, 2));

  console.log('  [2/3] Compositing images...');

  const heroPath = path.join(IMAGES_DIR, `${slug}.jpg`);
  const articleCategory = article.category || 'news';
  const slide1Raw = await makeSlide1(heroPath, copy.headline, articleCategory);
  const slide1 = await composeFinal(slide1Raw);
  fs.writeFileSync(path.join(outDir, '1-hero.jpg'), slide1);

  for (let i = 0; i < copy.slides.length; i++) {
    const slideRaw = await makeTextSlide(copy.slides[i], i + 2, 5, articleCategory);
    const slide = await composeFinal(slideRaw);
    fs.writeFileSync(path.join(outDir, `${i + 2}-highlight.jpg`), slide);
  }

  // Load larger logo for CTA slide — 220px for bigger brand presence
  const ctaLogoBuffer = await loadLogo(220);
  const slide5Raw = await makeCTASlide(copy.cta, ctaLogoBuffer, articleCategory);
  const slide5 = await composeFinal(slide5Raw);
  fs.writeFileSync(path.join(outDir, '5-cta.jpg'), slide5);

  console.log(`  [3/3] Done — saved to output/carousels/${slug}/`);
}

async function main() {
  console.log('RYEWORLD Carousel Generator');
  console.log('===========================');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable required');
    process.exit(1);
  }

  if (DRY_RUN) console.log('[DRY RUN — no images will be saved]\n');

  const logoBuffer = await loadLogo(70);

  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'));
  let articles = files.map(f => parseArticle(path.join(ARTICLES_DIR, f))).filter(Boolean);

  if (SLUG_FILTER) {
    articles = articles.filter(a => a.slug === SLUG_FILTER);
    if (!articles.length) {
      console.error(`No article found with slug: ${SLUG_FILTER}`);
      process.exit(1);
    }
  }

  console.log(`Found ${articles.length} article(s) to process\n`);

  for (const article of articles) {
    try {
      await processArticle(article, logoBuffer);
    } catch (err) {
      console.error(`  [error] ${article.slug}: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

main();
