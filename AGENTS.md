# AGENTS.md — True Finance Tools

> **Quick start:** See `CLAUDE.md` for project overview, commands, conventions, and common tasks.

## Project Overview

**Name:** True Finance Tools
**Domain:** truefinancetools.com
**Framework:** Astro v6.4.4 (static site generator)
**Styling:** Tailwind CSS v4.3 (CSS-based config, no JS config file)
**Language:** TypeScript (strict mode)
**Package Manager:** npm
**Node Requirement:** >= 22.12.0

A multi-tool financial calculator website. Currently has a FIRE (Financial Independence, Retire Early) calculator. More tools (break-even, mortgage, etc.) will be added later at routes like `/mortgage-calculator`, `/break-even-calculator`.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

No lint, test, or typecheck scripts exist.

## Project Structure

> Full file tree in `docs/PROJECT-STRUCTURE.md`. Key paths:

| Purpose | Path |
|---|---|
| Main calculator | `src/components/calculator/FIRECalculatorBase.astro` |
| Calculation engine | `src/utils/calculations.ts` |
| Formatting utilities | `src/utils/formatters.ts` |
| Design tokens | `src/styles/global.css` |
| Reusable UI | `src/components/ui/` (Button, Card, Input, Slider, ThemeToggle) |
| Layouts | `src/layouts/` (BaseLayout, PageLayout) |
| SEO | `src/components/seo/StructuredData.astro` |
| Header/Footer | `src/components/layout/Header.astro`, `Footer.astro` |

## Design System

> Full details in `DESIGN.md`. Key rules:

- **CSS variable tokens** — `bg-canvas`, `text-ink`, `border-hairline`, `bg-canvas-soft` auto-switch light/dark
- **Never use hex colors** — always use token classes
- **Fonts:** Inter (sans, 400/500/600), Geist Mono (mono)
- **Shadows:** 5-level stacked system: `shadow-xs` → `shadow-xl`
- **Radius:** `rounded-sm` (6px) → `rounded-full` (9999px)
- **Dark mode:** CSS variables under `html.dark`, FOUC prevention in BaseLayout, ThemeToggle cycles light→dark→system

## Architecture

- **No SSR** — fully static (SSG)
- **No framework runtime** — vanilla JS in `<script>` tags
- **Chart.js** via CDN (`is:inline` script) + npm
- **PDF export** via html2canvas + jsPDF (lazy-loaded)
- **SEO** — structured data, OG tags, Twitter cards, FAQ schema

## Adding a New Tool

1. Create `src/pages/{tool-name}/index.astro`
2. Create component in `src/components/calculator/{ToolName}Calculator.astro`
3. Add nav link in `Header.astro`, footer link in `Footer.astro`
4. Add to `StructuredData.astro` if needed
5. **Follow the Calculator Page Template and Page Creation Checklist** in `docs/CHEATSHEETS.md`

## Adding Dark Mode to New Components

Most components auto-switch via CSS variables. For hardcoded colors:
1. Use CSS variable tokens instead of hex values
2. For JS-rendered content: `document.documentElement.classList.contains('dark')`
3. For Chart.js: pass dynamic colors from detection above

## Git Branching Rules

### Mandatory Workflow — Every Task

1. **ALWAYS start with a fresh branch.** Never work on `main` directly.
2. **Push the branch to GitHub** after completion for preview.
3. **NEVER merge into `main`** — merging is a manual user action.

### Branch Creation (before ANY task)

```bash
git checkout main
git pull origin main
git checkout -b {branch-name}
```

### Naming Conventions

| Fix Size | Branch Naming |
|----------|---------------|
| Small (typo, simple refactor) | `quick-fix/{description}` |
| Medium (component refactor) | `refactor/{description}` |
| Large (feature, major refactor) | `feat/{description}` |

### After Completion

```bash
git add -A
git commit -m "{descriptive commit message}"
git push origin {branch-name}
```

## DRY Policy — Don't Repeat Yourself

**Before writing new code, check if the same markup/logic already exists. Use or extend it. Never copy-paste.**

### Rules

1. **Use existing components first.** Check `src/components/ui/` before hand-coding.
2. **Consolidate shared data** into constants files if it appears in 2+ files.
3. **Create components** for structural patterns repeated 3+ times.
4. **Extract shared utilities** — identical logic in 2+ files → `src/utils/`.
5. **Componentize repeated SVGs** — same icon in 3+ places → `Icon*.astro`.

### When NOT to extract

- Single `src="..."` repeated — just use the attribute
- One-liner class string in 1-2 places — only extract at 3+
- Inline values that vary by context — no real dedup benefit

### Quick Decision Checklist

```
1. Same thing exist? → Use it
2. Same logic in 2+ files? → Extract to utility
3. Same markup in 3+ places? → Create component
4. Same SVG in 3+ places? → Create Icon component
5. Extracting reduces duplication, not just adds indirection? → Only then
```

### Priority: Fix existing violations first

When working on any file, fix existing DRY violations as part of your change — if low-risk and doesn't scope-creep.

## Reference Documents

| Document | When to load |
|---|---|
| `docs/CHEATSHEETS.md` | Creating/modifying calculator pages (template, checklist, SEO, FAQ) |
| `docs/PROJECT-STRUCTURE.md` | Exploring or adding files to the project |
| `DESIGN.md` | Need detailed design tokens, component specs, layout rules |
