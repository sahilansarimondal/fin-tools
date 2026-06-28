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
│   │   │   └── FIRECalculatorBase.astro    # Main calculator (vanilla JS)
│   │   │   └── GeoArbitrageCalculator.astro # Geographic arbitrage calculator (vanilla JS)
│   │   │   └── DieWithZeroCalculator.astro # Die with Zero decumulation calculator (vanilla JS)
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
│   │   ├── learn/
│   │   │   ├── what-is-fire.astro      # Learn: What is FIRE?
│   │   │   ├── fire-strategies.astro   # Learn: FIRE Strategies
│   │   │   └── fire-number.astro       # Learn: Your FIRE Number
│   │   └── die-with-zero-calculator/
│   │       └── index.astro             # Die with Zero calculator
│   ├── styles/
│   │   └── global.css                  # Tailwind v4 @theme tokens + dark mode
│   └── utils/
│       ├── calculations.ts             # FIRE calculation engine
│       ├── geo-arbitrage-calculations.ts # Geographic arbitrage calculation engine
│       ├── decumulation-calculations.ts    # Die with Zero calculation engine
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
| `/geographic-arbitrage-calculator` | `src/pages/geographic-arbitrage-calculator/index.astro` | Geographic Arbitrage PPP Calculator |
| `/die-with-zero-calculator` | `src/pages/die-with-zero-calculator/index.astro` | Die with Zero Decumulation Calculator |

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
- **Interactivity** — all calculator logic is vanilla JS in `FIRECalculatorBase.astro` `<script>` block

## Key Implementation Details

### FIRE Calculator

- File: `src/components/calculator/FIRECalculatorBase.astro` (~700 lines)
- Contains form, results, chart, scenario comparison, export, share
- Uses `src/utils/calculations.ts` for math
- URL-based state sharing via query params
- Chart.js rendered on `<canvas id="projection-chart">`
- Theme-aware chart colors via MutationObserver on `html` class

### Geographic Arbitrage Calculator

- File: `src/components/calculator/GeoArbitrageCalculator.astro`
- Uses `src/utils/geo-arbitrage-calculations.ts` for math
- Chart.js line chart comparing home vs. target country portfolio projections
- 30-year runway projection with inflation-adjusted spending
- Preset buttons for common scenarios (US → India)

### Die with Zero Calculator

- File: `src/components/calculator/DieWithZeroCalculator.astro`
- Uses `src/utils/decumulation-calculations.ts` for math
- Chart.js line chart showing portfolio declining to buffer amount
- TVM annuity PMT formula for optimal withdrawal calculation
- Supports linear (constant) and front-loaded (Go-Go Years) spending curves
- 4% rule comparison showing money left on the table
- Theme-aware chart colors via MutationObserver on `html` class

### Adding a New Tool

1. Create `src/pages/{tool-name}/index.astro`
2. Create component in `src/components/{tool-name}/`
3. Add nav link in `Header.astro`
4. Add footer link in `Footer.astro`
5. Add to `StructuredData.astro` if needed
6. Follow the [Calculator Page Template](#calculator-page-template-based-on-barista-fire-page) and run through the [Page Creation Checklist](#page-creation-checklist) before merging

### Adding Dark Mode to New Components

Most components auto-switch via CSS variables. For anything with hardcoded colors:
1. Use CSS variable tokens instead of hex values
2. For JS-rendered content, check `document.documentElement.classList.contains('dark')`
3. For Chart.js, pass dynamic colors from the detection above

### Git Branching Rules

All implementations MUST be done on dedicated branches — never directly on `main`.

**Agent must NEVER merge any branch into `main`.** The agent works exclusively on its assigned feature, bug, or fix branch. Merging to `main` is a manual action that requires explicit user instruction.

| Fix Size | Branch Naming | Description |
|----------|---------------|-------------|
| Small (typo, simple refactor) | `quick-fix/{description}` | Single file, minimal changes |
| Medium (component refactor) | `refactor/{description}` | Multi-file, related changes |
| Large (feature, major refactor) | `feat/{description}` | Complex changes across codebase |

**Examples:**
- `quick-fix/remove-dead-code`
- `refactor/consolidate-ui-components`
- `feat/add-mortgage-calculator`

## DRY Policy — Don't Repeat Yourself

**Before writing any new code, check if the same markup/logic already exists. If it does, use or extend the existing code. Never copy-paste when a component, utility, or shared constant already handles it.**

### Rules

1. **Use existing components before writing new ones.** Check `src/components/ui/` first. If `Button.astro`, `Card.astro`, `Input.astro`, `Slider.astro` etc. can do the job, use them. Do not hand-code inline what a component already handles.

2. **Consolidate shared data into constants files.** If the same data (labels, descriptions, multipliers, config objects) appears in 2+ files, extract it into a single constants file (e.g., `src/utils/fire-types.ts`) and import from there.

3. **Create components for structural patterns repeated 3+ times.** If the same block of markup (with only text/values changing) appears in 3 or more places, extract it into a reusable component. Examples: page headers, CTA sections, article wrappers, link cards.

4. **Extract shared utility functions.** If identical logic (calculations, formatting, string manipulation) exists in 2+ places, move it to `src/utils/` and import it.

5. **Componentize repeated SVG icons.** If the same SVG icon appears in 3+ places, create an `Icon*.astro` component for it.

### When NOT to extract

Do NOT over-abstract. The following do NOT need components:

- **A single `src="..."` attribute** repeated — e.g., if `<img src="/hero.webp">` appears 13 times, just use the `src` attribute directly. Wrapping it in a component adds unnecessary indirection.
- **A one-liner class string** used in only 1-2 places — only extract if it hits 3+ occurrences.
- **Inline values that vary by context** — if every usage has different text/classes/attributes, a component with props is just a pass-through with no real deduplication benefit.

### How to decide: Quick checklist

```
1. Does the same thing exist already? → Use it
2. Same logic in 2+ files? → Extract to a shared utility/constants file
3. Same structural markup in 3+ places? → Create a component
4. Same SVG icon in 3+ places? → Create an Icon component
5. Is extracting actually reducing duplication, or just adding indirection? → Only extract if #5 is yes
```

### Priority: Fix existing violations first

When working on any file, if you encounter an existing DRY violation (e.g., an inline button that should use `Button.astro`, or duplicate data that should be in a constants file), fix it as part of your change — but only if the fix is low-risk and doesn't scope-creep the task.

When creating a new tool page, first verify it follows the [Calculator Page Template](#calculator-page-template-based-on-barista-fire-page) and its [Page Creation Checklist](#page-creation-checklist).

### Calculator Page Template (based on barista fire page)

Every standalone calculator page follows this exact section order and structure:

```astro
---
import PageLayout from '../../layouts/PageLayout.astro';
import HowItWorks from '../../components/ui/HowItWorks.astro';
import StructuredData from '../../components/seo/StructuredData.astro';
import type { FAQItem } from '../../utils/faq-data';
// + import your calculator component
---

// 1. Page-specific FAQ items defined inline (6-8 questions)
const toolFaqItems: FAQItem[] = [
  { question: '...', answerHtml: '...', answerText: '...' },
];
---

// 2. PageLayout with SEO props
<PageLayout
  title="{Tool Name} Calculator — {Value Prop}"
  description="Free {tool name} calculator for {use case}. {Primary action} based on {inputs}. {Secondary benefit}."
  canonical="https://truefinancetools.com/{tool-name}"
  ogImage="https://truefinancetools.com/og-{tool-name}.png"
  ogImageAlt="{Tool Name} Calculator — {Short Description}"
  pageType="website"
  keywords="{tool name} calculator, {primary keywords comma separated}"
>

  // 3. StructuredData (WebApplication + FAQPage schema)
  //    Include `features` array listing 4-6 tool capabilities
  <StructuredData
    title="{Tool Name} Calculator"
    description="Free {tool name} calculator for {use case}."
    url="https://truefinancetools.com/{tool-name}"
    features={[
      '{Feature 1}',
      '{Feature 2}',
      '{Feature 3}',
      '{Feature 4}',
    ]}
  />

  // 4. Hero section — centered h1 + subtitle
  //    bg-canvas, border-b, py-12 sm:py-16
  <section class="border-b border-hairline bg-canvas py-12 sm:py-16">
    <div class="mx-auto max-w-4xl px-4 text-center sm:px-6">
      <h1 class="mb-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl" style="letter-spacing: -0.02em;">
        {Tool Name} Calculator
      </h1>
      <p class="text-lg text-body">{One-line value proposition}</p>
    </div>
  </section>

  // 5. Calculator component
  <YourCalculatorComponent />

  // 6. How It Works — 3 steps in <HowItWorks>
  <HowItWorks title="How the {Tool Name} Calculator Works">
    <div class="text-center">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-canvas-soft-2 text-ink">
        {/* SVG icon */}
      </div>
      <h3 class="mb-2 text-sm font-semibold text-ink">1. {Step title}</h3>
      <p class="text-sm text-body">{Step description}</p>
    </div>
    <div class="text-center">{same structure for step 2}</div>
    <div class="text-center">{same structure for step 3}</div>
  </HowItWorks>

  // 7. "What is {Tool}?" section (bg-canvas-soft)
  //    Internal order: definition → formula → comparison table → Who Should Choose → Pros/Cons
  <section class="border-t border-hairline bg-canvas-soft py-16">
    <div class="mx-auto max-w-4xl px-4 sm:px-6">
      <h2 class="mb-8 text-center text-2xl font-semibold tracking-tight text-ink">What is {Tool Name}?</h2>
      <div class="prose prose-gray max-w-none text-body">
        // a. Definition paragraph with bolded term
        <p><strong>{Tool}</strong> is...{definition}...</p>

        // b. Formula block (bg-canvas-soft-2, font-mono)
        <h3 class="mb-3 text-lg font-semibold text-ink">The {Tool Name} Formula</h3>
        <div class="rounded-lg bg-canvas-soft-2 p-4 font-mono text-sm text-ink">{Formula expression}</div>

        // c. Comparison table (border-hairline, bg-canvas-soft-2 header)
        <h3 class="mb-3 text-lg font-semibold text-ink">{Tool} vs {Alternative}</h3>
        <div class="overflow-x-auto rounded-lg border border-hairline">
          <table class="w-full text-left text-sm">
            <thead><tr class="border-b border-hairline bg-canvas-soft-2"><th>...</th></tr></thead>
            <tbody class="font-mono text-xs tabular-nums"><tr>...</tr></tbody>
          </table>
        </div>

        // d. "Who Should Choose" 2x2 grid (border-hairline cards)
        <h3 class="mb-3 text-lg font-semibold text-ink">Who Should Choose {Tool}?</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-lg border border-hairline bg-canvas p-4">
            <h4 class="mb-2 text-sm font-semibold text-ink">{Persona}</h4>
            <p class="text-sm text-body">{Description}</p>
          </div>
          {...3 more cards}
        </div>

        // e. Pros and Cons grid (success/error borders)
        <h3 class="mb-3 text-lg font-semibold text-ink">{Tool} Pros and Cons</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-lg border border-success/30 bg-success/5 p-4">
            <h4 class="mb-2 text-sm font-semibold text-success-deep">Advantages</h4>
            <ul class="space-y-1 text-sm text-body">
              <li>• {Advantage 1}</li>
            </ul>
          </div>
          <div class="rounded-lg border border-error/30 bg-error/5 p-4">
            <h4 class="mb-2 text-sm font-semibold text-error">Trade-offs</h4>
            <ul class="space-y-1 text-sm text-body">
              <li>• {Trade-off 1}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  // 8. FAQ section (bg-canvas)
  <section class="border-t border-hairline bg-canvas py-16">
    <div class="mx-auto max-w-4xl px-4 sm:px-6">
      <h2 class="mb-8 text-center text-2xl font-semibold tracking-tight text-ink">Frequently Asked Questions About {Tool Name}</h2>
      <div class="space-y-4">
        {toolFaqItems.map((item) => (
          <details class="group rounded-lg border border-hairline bg-canvas p-4 shadow-sm">
            <summary class="cursor-pointer py-2 text-sm font-medium text-ink">{item.question}</summary>
            <p class="mt-3 text-sm text-body" set:html={item.answerHtml} />
          </details>
        ))}
      </div>
    </div>
  </section>

  // 9. "Complete Guide" section (bg-canvas)
  //    "Why Choose {Tool}" + "Key Features" subheadings
  <section class="border-t border-hairline bg-canvas py-16">
    <div class="mx-auto max-w-4xl px-4 sm:px-6">
      <h2 class="mb-6 text-2xl font-semibold tracking-tight text-ink">Complete Guide to {Tool Name} Planning</h2>
      <div class="prose prose-gray max-w-none text-body">
        <p>Our <strong>{tool name} calculator</strong> is...{intro}...</p>
        <h3 class="mb-3 text-lg font-semibold text-ink">Why Choose {Tool}?</h3>
        <p>...{2-3 paragraphs}...</p>
        <h3 class="mb-3 text-lg font-semibold text-ink">Key Features of This {Tool Name} Calculator</h3>
        <p>...{1-2 paragraphs}...</p>
      </div>
    </div>
  </section>

  // 10. "Explore Other {Category}" cross-links section (bg-canvas-soft)
  <section class="border-t border-hairline bg-canvas-soft py-16">
    <div class="mx-auto max-w-4xl px-4 text-center sm:px-6">
      <h2 class="mb-4 text-2xl font-semibold tracking-tight text-ink">Explore Other {Category}</h2>
      <p class="mb-8 text-body">{Category description}</p>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a href="/other-tool" class="group rounded-lg border border-hairline bg-canvas p-5 text-left shadow-sm transition-all hover:shadow-md">
          <h3 class="mb-2 text-sm font-semibold text-ink group-hover:text-link">{Tool Name}</h3>
          <p class="text-xs text-body">{Short description}</p>
        </a>
        {...5 more links, one with border-2 border-ink for highlighted guide link}
      </div>
    </div>
  </section>
</PageLayout>
```

**SEO rules:**
- **Title:** Format `"{Tool Name} Calculator — {Compelling Value Proposition}"`
- **Description:** 140-160 chars, include primary keyword in first 60 chars, end with a benefit
- **Keywords:** Include primary + 6-10 supporting keyword phrases, comma separated, max ~200 chars
- **OG image URL:** `https://truefinancetools.com/og-{tool-name}.png`
- **`pageType`:** Always `"website"` for tool/calculator pages, `"article"` for learn/guide pages

**FAQ item fields:**
- `question` (string): Full question ending with `?`
- `answerHtml` (string): Rich HTML with `<b>`, `<br />`, `<ul>`, `<li>` tags
- `answerText` (string): Plain-text fallback (no HTML), shorter summary
- **Count:** 6-8 questions covering what it is, formula, vs alternatives, use cases, edge cases

**StructuredData `features` array:**
Include a `features` prop with 4-6 tool capabilities:
```astro
features={[
  'Part-time income planning',
  'Interactive projection charts',
  'PDF export and shareable links',
  'Scenario comparison across FIRE types'
]}
```

**Background alternation rule:**
Sections must alternate backgrounds: `bg-canvas-soft` → `bg-canvas` → `bg-canvas-soft` → `bg-canvas` ... Each section gets `border-t border-hairline` for subtle dividers.

**Page Creation Checklist**
When creating a new tool page, verify every item:

- [ ] Imports: PageLayout, HowItWorks, StructuredData, FAQItem type, calculator component
- [ ] FAQ items: 6-8 inline questions with `question`, `answerHtml`, `answerText`
- [ ] PageLayout: title, description, canonical, ogImage, ogImageAlt, pageType="website", keywords
- [ ] StructuredData: title, description, url, `features` array, `faqItems={toolFaqItems}`
- [ ] Hero section: bg-canvas border-b, centered h1 + subtitle
- [ ] Calculator component: rendered after hero
- [ ] HowItWorks: 3 steps with icon + title + description
- [ ] "What is {Tool}?": formula block, comparison table, Who Should Choose 2×2, Pros/Cons grid
- [ ] FAQ section: mapped from toolFaqItems via `details`/`summary`
- [ ] Complete Guide: "Why Choose {Tool}" + "Key Features" subheadings
- [ ] Explore Other: 6 cross-links in 3-column grid, highlight one with `border-2 border-ink`
- [ ] Backgrounds alternate: soft → canvas → soft → canvas → soft ...

### Learn/Guide Page Template

Learn/guide pages (at `/learn/`) use BaseLayout for long-form content:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/layout/Header.astro';
import Footer from '../../components/layout/Footer.astro';
import StructuredData from '../../components/seo/StructuredData.astro';
---

<BaseLayout
  title="{Page Title} — {SEO Value Prop}"
  description="..."
  canonical="https://truefinancetools.com/learn/{page-slug}"
  ogImage="https://truefinancetools.com/og-{page-slug}.png"
  ogImageAlt="..."
  keywords="..."
>
  <Header />

  <StructuredData
    title="{Page Title}"
    description="..."
    url="https://truefinancetools.com/learn/{page-slug}"
  />

  <main>
    // Hero with "Learn" label + h1 + subtitle
    <section class="border-b border-hairline bg-canvas py-16 sm:py-20">
      <div class="mx-auto max-w-3xl px-4 sm:px-6">
        <p class="mb-4 font-mono text-xs uppercase tracking-wider text-mute">Learn</p>
        <h1 class="mb-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{Title}</h1>
        <p class="text-lg text-body">{Subtitle}</p>
      </div>
    </section>

    // Article with prose content
    <article class="bg-canvas py-12 sm:py-16">
      <div class="mx-auto max-w-3xl px-4 sm:px-6">
        <div class="prose prose-sm max-w-none space-y-8 text-body">
          <section><h2>What is...</h2><p>...</p></section>
          <section><h2>How it Works</h2>
            <div class="rounded-lg bg-canvas-soft-2 p-4 font-mono text-sm text-ink">{formula}</div>
          </section>
          <section><h2>Why Choose...</h2>
            <div class="grid gap-4 sm:grid-cols-2">{cards}</div>
          </section>
          <section><h2>Comparison</h2>
            <div class="overflow-x-auto"><table>...</table></div>
          </section>
          <section><h2>Things to Consider</h2>
            <div class="space-y-4">{detail cards}</div>
          </section>
          // CTA linking to calculator
          <section class="rounded-lg bg-canvas-soft-2 p-6">
            <h2>Calculate Your {Tool} Number</h2>
            <p>...</p>
            <a href="/{tool}-calculator" class="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-canvas transition-opacity hover:opacity-90">
              Open Calculator
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </section>
        </div>
      </div>
    </article>
  </main>

  <Footer />
</BaseLayout>
```

### Known existing components (always check these first)

| Component | Location | Use for |
|-----------|----------|---------|
| `Button.astro` | `src/components/ui/` | All CTAs (primary/secondary/ghost variants) |
| `Card.astro` | `src/components/ui/` | Content cards (default/soft/bordered) |
| `Input.astro` | `src/components/ui/` | Form text inputs |
| `Slider.astro` | `src/components/ui/` | Range slider inputs |
| `ThemeToggle.astro` | `src/components/ui/` | Dark/light mode toggle |
| `Header.astro` | `src/components/layout/` | Site header/nav |
| `Footer.astro` | `src/components/layout/` | Site footer |
| `BaseLayout.astro` | `src/layouts/` | Page shell (SEO, fonts, meta) |
