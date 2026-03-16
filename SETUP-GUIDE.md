# RYEWORLD — Claude Code Setup Guide
## Get your 3-agent creative agency running in Claude Code

---

## WHAT YOU'RE SETTING UP

Claude Code reads specific files from your project to know how to behave.
You're going to create:

1. `CLAUDE.md` — project root file that ALL sessions read automatically
2. `.claude/agents/eye.md` — The Eye (design critic)
3. `.claude/agents/architect.md` — The Architect (UX/UI)
4. `.claude/agents/builder.md` — The Builder (developer)

After setup, you launch each agent like this:
```
claude --agent eye        # launches a design critic session
claude --agent architect  # launches a UX/UI design session
claude --agent builder    # launches a developer session
claude                    # launches default session (reads CLAUDE.md)
```

---

## STEP 0: INSTALL CLAUDE CODE

If you haven't already:
```
npm install -g @anthropic-ai/claude-code
```

Then authenticate:
```
claude
```
It will open a browser window to log in. Follow the prompts.

---

## STEP 1: CREATE THE FOLDER STRUCTURE

From your ryeworld project root:
```
mkdir -p .claude/agents
```

Your project should look like:
```
ryeworld/
├── CLAUDE.md                    ← create this (Step 2)
├── .claude/
│   └── agents/
│       ├── eye.md               ← create this (Step 3)
│       ├── architect.md         ← create this (Step 4)
│       └── builder.md           ← create this (Step 5)
├── src/
│   └── pages/
│       └── index.astro
├── public/
├── scripts/
│   └── pipeline.js
├── astro.config.mjs
└── package.json
```

---

## STEP 2: CREATE CLAUDE.md (project root)

This is the master context file. Every Claude Code session reads this
automatically — whether you launch default, The Eye, The Architect,
or The Builder. Put the shared project knowledge here.

Create the file `CLAUDE.md` in your project root and paste the contents
from the CLAUDE-MD-ROOT.md file provided.

---

## STEP 3-5: CREATE THE AGENT FILES

Create each agent file in `.claude/agents/` and paste the contents
from the provided files:

- `.claude/agents/eye.md` ← from EYE-AGENT.md
- `.claude/agents/architect.md` ← from ARCHITECT-AGENT.md  
- `.claude/agents/builder.md` ← from BUILDER-AGENT.md

---

## HOW TO USE THEM

### Launch The Eye (design critique):
```
claude --agent eye
```
Then drop a screenshot or describe what you want reviewed:
```
> look at src/pages/index.astro and tell me what's wrong with the design.
> [paste screenshot] review this and give me the top 3 fixes.
> The homepage hero feels off on mobile. What should I change?
```

### Launch The Architect (UX/UI design):
```
claude --agent architect
```
Then describe what you need designed:
```
> Design the events page for RYEWORLD. What sections, what layout, what flow?
> The article reading experience needs work. Spec out a better article page.
> How should the mobile navigation work?
```

### Launch The Builder (developer):
```
claude --agent builder
```
Then give it a build task:
```
> Build the events page based on this spec: [paste Architect's output]
> Fix the mobile layout — the sidebar is overlapping the articles.
> Add a new article from this markdown file to the site.
```

### The Autonomous Loop (manually routed for now):

```
Step 1: claude --agent architect
        "Design the events page"
        → copy the output spec

Step 2: claude --agent eye
        "Review this spec: [paste]"
        → copy the approved/revised spec

Step 3: claude --agent builder
        "Build this page: [paste approved spec]"
        → builder writes the code and commits

Step 4: claude --agent eye
        "Review what was just built. Look at src/pages/events.astro"
        → Eye gives fixes

Step 5: claude --agent builder
        "Apply these fixes: [paste Eye's feedback]"
        → builder fixes and commits

Step 6: Done. Push to deploy.
        git push
```

---

## TIPS

- Each agent session has FULL access to your project files — they can
  read any file, write code, run commands, and make changes.
  
- The Eye can actually open and read your .astro/.css files to see
  the current design in code form. It doesn't need a screenshot
  (though screenshots help for visual review).

- The Builder will actually write and save files. When it says
  "I've updated src/pages/events.astro" — the file is actually changed.

- You can tell any agent to check another agent's previous work:
  "The Architect spec'd this layout. The Eye approved it. Build it."
  
- All three agents read the root CLAUDE.md, so they all share the
  same brand knowledge, color values, font choices, and project context.

- Run `git diff` after The Builder makes changes to see exactly
  what was modified before you commit.
