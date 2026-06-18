# CLAUDE.md — True Finance Tools

## Project

**True Finance Tools** — truefinancetools.com — Multi-tool financial calculator website built with Astro.

| Tech | Version | Notes |
|---|---|---|
| Astro | 6.4.4 | Static site generator (SSG, no SSR) |
| Tailwind CSS | 4.3 | CSS-based config via `@theme` directive — no `tailwind.config.js` |
| TypeScript | strict | Extends `astro/tsconfigs/strict` |
| Chart.js | 4.5 | Charts for FIRE projections |

**Node:** >= 22.12.0 | **Package manager:** npm

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
```

No lint/test/typecheck scripts exist.

## Key Files

```
src/
├── components/
│   ├── calculator/FIRECalculatorBase.astro   # Main calculator (vanilla JS)
│   ├── layout/Header.astro               # Sticky nav, mobile menu, theme toggle
│   ├── layout/Footer.astro               # 4-column footer
│   ├── seo/StructuredData.astro          # JSON-LD + FAQ schema
│   └── ui/                               # Reusable: Button, Card, Input, Slider, ThemeToggle
├── layouts/BaseLayout.astro              # Production layout (SEO, fonts, GA, FOUC script)
├── pages/
│   ├── index.astro                       # Homepage
│   ├── fire-calculator/index.astro       # FIRE calculator page
│   └── learn/                            # Educational content (3 pages)
├── styles/global.css                     # Tailwind v4 @theme tokens + dark mode
└── utils/
    ├── calculations.ts                   # FIRE calculation engine
    └── formatters.ts                     # Currency/number formatting
```

## Conventions

### Styling (Tailwind v4)
- **No `tailwind.config.js`** — tokens defined in `src/styles/global.css` via `@theme`
- Use CSS variable classes: `bg-canvas`, `text-ink`, `border-hairline`, `bg-canvas-soft`
- These auto-switch between light/dark mode
- Never use hex colors directly — always use the token classes

### Dark Mode
- CSS variables change under `html.dark` class
- FOUC prevention script in `BaseLayout.astro` reads `localStorage('theme')`
- For JS-rendered content: check `document.documentElement.classList.contains('dark')`
- ThemeToggle cycles: light → dark → system

### Interactivity
- All calculator logic is vanilla JS in `<script>` tags
- No React, Vue, Svelte, or other framework runtime
- Chart.js loaded via CDN + npm dependency
- PDF export uses html2canvas + jsPDF (lazy-loaded)

### Component Pattern
```astro
---
// Frontmatter: imports, props
---
<div class="bg-canvas border border-hairline text-ink rounded-md p-4">
  <!-- Content -->
</div>
```

## Common Tasks

### Add a new calculator tool
1. Create `src/pages/{tool-name}/index.astro`
2. Create component in `src/components/{tool-name}/`
3. Add nav link in `src/components/layout/Header.astro`
4. Add footer link in `src/components/layout/Footer.astro`
5. Add to `src/components/seo/StructuredData.astro` if needed

### Modify the FIRE calculator
- Edit `src/components/calculator/FIRECalculatorBase.astro` (form, results, chart, export, share)
- Math logic in `src/utils/calculations.ts`
- Formatting in `src/utils/formatters.ts`

### Change color/font tokens
- Edit `src/styles/global.css` — look for `@theme` directive
- Both light and dark values defined there

### Add dark mode to new component
- Most components auto-switch via CSS variable tokens
- For hardcoded colors in JS: detect via `document.documentElement.classList.contains('dark')`

## Do NOT

- Use hex colors — use CSS variable token classes (`bg-canvas`, `text-ink`, etc.)
- Add React/Vue/Svelte — vanilla JS in `<script>` tags only
- Create `tailwind.config.js` — Tailwind v4 uses CSS `@theme` directive
- Hardcode dark mode in CSS — CSS variables handle it automatically
- Use `is:inline` on scripts unless they need to run before bundling (only Chart.js CDN uses this)

## Documentation

- **`AGENTS.md`** — Detailed architecture, routes, implementation patterns
- **`DESIGN.md`** — Complete design system (colors, typography, components, spacing)
- **`.agents/skills/`** — Tailwind v4 docs and web design guidelines
