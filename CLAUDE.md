# RYEWORLD

## Project Overview
RYEWORLD is an autonomous local content network. Each town gets its own [Town]WORLD site — a website, Instagram, TikTok, and newsletter covering local news, food, events, sports, and community.

First town: **RYEWORLD** (Rye, NY). Next: Larchmont, Pelham, Mamaroneck.

## Brand
- **Logo:** Retro wireframe globe with "RYE" knockout bar. Impact font. Stretched oval.
- **Display font:** Rock Salt (Google Fonts) — used for the giant "Rye" in hero and logo lockups
- **Body font:** Outfit (Google Fonts) — weights 400-900, used for all UI and body text
- **Primary color:** #E8222A (Garnets red — Rye High School)
- **Black:** #111
- **White:** #fff
- **Light gray:** #f7f7f5
- **Borders:** #f0efeb
- **Secondary accent:** #2A7AE8 (blue, for non-food categories)
- **Aesthetic:** Street editorial meets local media. Hypebeast meets community. Bold, confident, slightly raw.

## Tech Stack
- **Framework:** Astro (static site generation)
- **Styling:** Vanilla CSS only — no Tailwind, no CSS-in-JS, no frameworks
- **JavaScript:** Vanilla JS only — no React in production pages
- **Hosting:** Vercel (auto-deploy from git push)
- **Content:** Markdown files with YAML frontmatter in src/content/articles/
- **Pipeline:** Node.js scripts in scripts/ using Anthropic Claude API
- **Domain:** ryeworld.world (Cloudflare)

## Conventions
- All brand text is lowercase ("ryeworld" not "RyeWorld" in UI)
- Rock Salt font is ONLY for the "Rye" wordmark — never for body text or headlines
- Outfit is the workhorse font for everything else
- Border-radius: 24-28px for cards, 14-18px for inputs, 24px for pill buttons
- Animations: CSS only, ease-out, 200-350ms, subtle transforms. No bouncing.
- Mobile breakpoint: 768px. Mobile is the primary design target.
- All pages must score 90+ on Lighthouse Performance and Accessibility
- No unnecessary dependencies. Vanilla first. Always.
- Git commits: descriptive messages, commit often

## File Structure
```
ryeworld/
├── CLAUDE.md              ← you are here
├── src/
│   ├── pages/             ← .astro page files
│   │   └── index.astro    ← homepage
│   └── content/
│       └── articles/      ← markdown articles
├── public/                ← static assets (logo, images)
├── scripts/
│   └── pipeline.js        ← content generation pipeline
└── .claude/
    └── agents/            ← The Eye, Architect, Builder
```

## Content Voice (Rye, NY)
Refined but warm. Think: the neighbor who knows every restaurant on Purchase Street and texts you when the Garnets win. Knowledgeable, community-rooted, dry wit. Assume readers are locals. Reference Purchase Street, Memorial Field, Playland by name. Never say "hidden gem" or "vibrant community."

## Agent Team
This project uses 3 specialized Claude Code agents:
- **eye** — Design critic / creative director. Reviews aesthetics, typography, brand.
- **architect** — UX/UI designer. Structures pages, flows, components.
- **builder** — Developer. Writes Astro/CSS/JS code. Ships and deploys.

Launch with: `claude --agent eye`, `claude --agent architect`, `claude --agent builder`
