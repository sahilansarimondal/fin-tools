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

```
fin-tools/
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── calculator/
│   │   │   └── FIRECalculator.astro    # Main calculator (702 lines, vanilla JS)
│   │   ├── layout/
│   │   │   ├── Header.astro            # Sticky header with nav, mobile menu, theme toggle
│   │   │   └── Footer.astro            # 4-column footer
│   │   ├── seo/
│   │   │   └── StructuredData.astro    # JSON-LD structured data + FAQ schema
│   │   └── ui/
│   │       ├── Button.astro            # Reusable button (primary/secondary/ghost)
│   │       ├── Card.astro              # Reusable card (default/soft/bordered)
│   │       ├── Input.astro             # Reusable text input with label/error
│   │       ├── Slider.astro            # Reusable range slider
│   │       └── ThemeToggle.astro       # Dark/light/system theme toggle
│   ├── layouts/
│   │   └── BaseLayout.astro            # Production layout (SEO, meta, fonts, GA, FOUC script)
│   ├── pages/
│   │   ├── index.astro                 # Homepage / landing page
│   │   ├── fire-calculator/
│   │   │   └── index.astro             # FIRE calculator page
│   │   └── learn/
│   │       ├── what-is-fire.astro      # Learn: What is FIRE?
│   │       ├── fire-strategies.astro   # Learn: FIRE Strategies
│   │       └── fire-number.astro       # Learn: Your FIRE Number
│   ├── styles/
│   │   └── global.css                  # Tailwind v4 @theme tokens + dark mode
│   └── utils/
│       ├── calculations.ts             # FIRE calculation engine
│       └── formatters.ts               # Currency/number formatting utilities
├── astro.config.mjs                    # Astro config (site URL, Tailwind vite plugin)
├── package.json
├── tsconfig.json
├── DESIGN.md                           # Design system documentation
└── AGENTS.md                           # This file
```

## Route Map

| Route | File | Description |
|---|---|---|
| `/` | `src/pages/index.astro` | Homepage |
| `/fire-calculator` | `src/pages/fire-calculator/index.astro` | FIRE calculator |
| `/fire-calculator?fireType=lean` | (query params) | Pre-selected Lean FIRE |
| `/fire-calculator?fireType=fat` | (query params) | Pre-selected Fat FIRE |
| `/fire-calculator?fireType=coast` | (query params) | Pre-selected Coast FIRE |
| `/fire-calculator?age=...&retire=...` | (query params) | Shared state via URL |
| `/learn/what-is-fire` | `src/pages/learn/what-is-fire.astro` | What is FIRE? |
| `/learn/fire-strategies` | `src/pages/learn/fire-strategies.astro` | FIRE Strategies |
| `/learn/fire-number` | `src/pages/learn/fire-number.astro` | Your FIRE Number |

**URL convention:** New tools go at `/{tool-name}` (e.g., `/mortgage-calculator`).

## Design System

> Full design system details (colors, typography, components, spacing) are in `DESIGN.md`.

### Dark Mode

- Uses CSS custom properties that change under `html.dark`
- FOUC prevention script in `<head>` of BaseLayout reads `localStorage('theme')`
- ThemeToggle cycles: light → dark → system
- `system` follows `prefers-color-scheme` and updates live on OS change
- Chart.js colors in FIRECalculator detect dark mode via `document.documentElement.classList.contains('dark')`

### Component Pattern

All components use Tailwind utility classes referencing the CSS variable tokens:
```astro
<div class="bg-canvas border border-hairline text-ink">...</div>
```
These automatically switch between light/dark because the CSS variables change.

### Fonts

- **Sans:** Inter (400, 500, 600) via Google Fonts
- **Mono:** Geist Mono (fallback stack)

### Shadows

5-level stacked shadow system: `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`

### Border Radius

Scale: `rounded-sm` (6px), `rounded-md` (8px), `rounded-lg` (12px), `rounded-xl` (16px), `rounded-pill` (100px), `rounded-full` (9999px)

## Architecture Notes

- **No SSR** — fully static (SSG)
- **No framework runtime** — vanilla JS in `<script>` tags
- **Chart.js** loaded via CDN (`is:inline` script) + npm dependency
- **PDF export** uses html2canvas + jsPDF (lazy-loaded)
- **SEO** includes structured data, OG tags, Twitter cards, FAQ schema
- **Analytics** — Google Analytics placeholder (`G-XXXXXXXXXX`)
- **Interactivity** — all calculator logic is vanilla JS in `FIRECalculator.astro` `<script>` block

## Key Implementation Details

### FIRE Calculator

- File: `src/components/calculator/FIRECalculator.astro` (~700 lines)
- Contains form, results, chart, scenario comparison, export, share
- Uses `src/utils/calculations.ts` for math
- URL-based state sharing via query params
- Chart.js rendered on `<canvas id="projection-chart">`
- Theme-aware chart colors via MutationObserver on `html` class

### Adding a New Tool

1. Create `src/pages/{tool-name}/index.astro`
2. Create component in `src/components/{tool-name}/`
3. Add nav link in `Header.astro`
4. Add footer link in `Footer.astro`
5. Add to `StructuredData.astro` if needed
6. Follow existing patterns for layout and styling

### Adding Dark Mode to New Components

Most components auto-switch via CSS variables. For anything with hardcoded colors:
1. Use CSS variable tokens instead of hex values
2. For JS-rendered content, check `document.documentElement.classList.contains('dark')`
3. For Chart.js, pass dynamic colors from the detection above

### Git Branching Rules

All implementations MUST be done on dedicated branches — never directly on `main`.

| Fix Size | Branch Naming | Description |
|----------|---------------|-------------|
| Small (typo, simple refactor) | `quick-fix/{description}` | Single file, minimal changes |
| Medium (component refactor) | `refactor/{description}` | Multi-file, related changes |
| Large (feature, major refactor) | `feat/{description}` | Complex changes across codebase |

**Examples:**
- `quick-fix/remove-dead-code`
- `refactor/consolidate-ui-components`
- `feat/add-mortgage-calculator`
