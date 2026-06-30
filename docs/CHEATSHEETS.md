# Calculator Page Cheatsheet

> Reference for creating/modifying calculator tool pages. Load this when the task involves page creation.

## Calculator Page Template (10 sections)

Every standalone calculator page follows this order (reference: `src/pages/barista-fire-calculator/index.astro`):

1. **Hero** — `bg-canvas border-b`, centered `h1` + subtitle
2. **Calculator component** — rendered after hero
3. **HowItWorks** — 3 steps with icon + title + description
4. **"What is {Tool}?"** — `bg-canvas-soft`: definition → formula block → comparison table → Who Should Choose 2×2 grid → Pros/Cons grid
5. **FAQ section** — `bg-canvas`: mapped from `toolFaqItems` via `details`/`summary`
6. **Complete Guide** — `bg-canvas`: "Why Choose {Tool}" + "Key Features" subheadings
7. **Explore Other** — `bg-canvas-soft`: 6 cross-links in 3-column grid, highlight one with `border-2 border-ink`

**Background alternation:** Sections alternate `bg-canvas-soft` → `bg-canvas` → `bg-canvas-soft` ... Each gets `border-t border-hairline`.

## SEO Rules

| Field | Rule |
|---|---|
| **Title** | `"{Tool Name} Calculator — {Compelling Value Proposition}"` |
| **Description** | 140-160 chars, primary keyword in first 60 chars, end with a benefit |
| **Keywords** | Primary + 6-10 supporting phrases, comma-separated, max ~200 chars |
| **OG image** | `https://truefinancetools.com/og-{tool-name}.png` |
| **pageType** | `"website"` for tools, `"article"` for learn/guide pages |

## FAQ Item Fields

```typescript
{
  question: string;       // Full question ending with '?'
  answerHtml: string;     // Rich HTML: <b>, <br />, <ul>, <li>
  answerText: string;     // Plain-text fallback (shorter)
}
```

- **Count:** 6-8 questions covering: what it is, formula, vs alternatives, use cases, edge cases
- **Inline:** Define `toolFaqItems` array in the page frontmatter

## StructuredData Props

```astro
<StructuredData
  title="..."
  description="..."
  url="https://truefinancetools.com/{tool-slug}"
  toolName="..."
  toolDescription="..."
  faqItems={toolFaqItems}
  features={['...', '...', '...', '...']}  // 4-6 capabilities
/>
```

## Page Creation Checklist

When creating a new tool page, verify every item:

- [ ] Imports: PageLayout, HowItWorks, StructuredData, FAQItem type, calculator component
- [ ] FAQ items: 6-8 inline questions with `question`, `answerHtml`, `answerText`
- [ ] PageLayout: title, description, canonical, ogImage, ogImageAlt, pageType="website", keywords
- [ ] StructuredData: title, description, url, `features` array, `faqItems={toolFaqItems}`
- [ ] Hero section: `bg-canvas border-b`, centered h1 + subtitle
- [ ] Calculator component: rendered after hero
- [ ] HowItWorks: 3 steps with icon + title + description
- [ ] "What is {Tool}?": formula block, comparison table, Who Should Choose 2×2, Pros/Cons grid
- [ ] FAQ section: mapped from toolFaqItems via `details`/`summary`
- [ ] Complete Guide: "Why Choose {Tool}" + "Key Features" subheadings
- [ ] Explore Other: 6 cross-links in 3-column grid, highlight one with `border-2 border-ink`
- [ ] Backgrounds alternate: soft → canvas → soft → canvas → soft ...

## Learn/Guide Page Template

Learn/guide pages use BaseLayout (not PageLayout). Structure:
1. Hero: "Learn" label + h1 + subtitle (`bg-canvas`, `border-b`)
2. Article: prose content with sections (What is, How it Works, Why Choose, Comparison, Things to Consider)
3. CTA: link to calculator in `bg-canvas-soft-2` rounded box

Reference: `src/pages/learn/what-is-fire.astro`

## Adding a New Tool — Steps

1. Create `src/pages/{tool-name}/index.astro`
2. Create component in `src/components/calculator/{ToolName}Calculator.astro`
3. Add nav link in `src/components/layout/Header.astro`
4. Add footer link in `src/components/layout/Footer.astro`
5. Add to `src/components/seo/StructuredData.astro` if needed
6. Run through the Page Creation Checklist above before merging
