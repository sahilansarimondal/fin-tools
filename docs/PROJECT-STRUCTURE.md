# Project Structure

> Full file tree for True Finance Tools. Load this when you need to locate files or understand the directory layout.

## Directory Tree

```
fin-tools/
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── calculator/
│   │   │   ├── FIRECalculatorBase.astro          # Main FIRE calculator (vanilla JS)
│   │   │   ├── GeoArbitrageCalculator.astro      # Geographic arbitrage calculator
│   │   │   ├── DieWithZeroCalculator.astro        # Die with Zero decumulation calculator
│   │   │   ├── SequenceOfReturnsCalculator.astro  # SRR stress tester
│   │   │   ├── OneMoreYearCalculator.astro        # OMY syndrome cost calculator
│   │   │   ├── CashCushionOptimizer.astro         # Cash cushion vs equity yield optimizer
│   │   │   ├── PerpetualSWRCalculator.astro       # Perpetual SWR calculator
│   │   │   ├── CoastFireShiftCalculator.astro     # Coast FIRE shift to part-time
│   │   │   ├── CoastFireNumber.astro              # Coast FIRE number calculator
│   │   │   ├── OwnerEarningsCalculator.astro      # Owner earnings calculator
│   │   │   └── VPWCalculator.astro                # Variable percentage withdrawal
│   │   ├── layout/
│   │   │   ├── Header.astro                       # Sticky header with nav, mobile menu, theme toggle
│   │   │   └── Footer.astro                       # 4-column footer
│   │   ├── seo/
│   │   │   └── StructuredData.astro               # JSON-LD structured data + FAQ schema
│   │   └── ui/
│   │       ├── Button.astro                       # Reusable button (primary/secondary/ghost)
│   │       ├── Card.astro                         # Reusable card (default/soft/bordered)
│   │       ├── HowItWorks.astro                   # 3-step "How it works" section
│   │       ├── Input.astro                        # Reusable text input with label/error
│   │       ├── Slider.astro                       # Reusable range slider
│   │       └── ThemeToggle.astro                  # Dark/light/system theme toggle
│   ├── layouts/
│   │   ├── BaseLayout.astro                       # Production layout (SEO, meta, fonts, GA, FOUC script)
│   │   └── PageLayout.astro                       # Wrapper layout for calculator/tool pages
│   ├── pages/
│   │   ├── index.astro                            # Homepage / landing page
│   │   ├── fire-calculator/index.astro            # FIRE calculator page
│   │   ├── learn/
│   │   │   ├── what-is-fire.astro                 # Learn: What is FIRE?
│   │   │   ├── fire-strategies.astro              # Learn: FIRE Strategies
│   │   │   └── fire-number.astro                  # Learn: Your FIRE Number
│   │   ├── die-with-zero-calculator/index.astro
│   │   ├── sequence-of-returns-calculator/index.astro
│   │   ├── cash-cushion-optimizer/index.astro
│   │   ├── perpetual-swr-calculator/index.astro
│   │   ├── coast-fire-shift-calculator/index.astro
│   │   ├── coast-fire-number/index.astro
│   │   ├── owner-earnings-calculator/index.astro
│   │   ├── vpw-calculator/index.astro
│   │   ├── lean-fire-calculator/index.astro
│   │   ├── fat-fire-calculator/index.astro
│   │   └── barista-fire-calculator/index.astro
│   ├── styles/
│   │   └── global.css                             # Tailwind v4 @theme tokens + dark mode
│   └── utils/
│       ├── calculations.ts                        # FIRE calculation engine
│       ├── geo-arbitrage-calculations.ts          # Geographic arbitrage calculations
│       ├── decumulation-calculations.ts           # Die with Zero calculations
│       ├── srr-calculations.ts                    # SRR stress test calculations
│       ├── omy-calculations.ts                    # OMY syndrome calculations
│       ├── cash-cushion-calculations.ts           # Cash cushion optimization calculations
│       ├── pswr-calculations.ts                   # Perpetual SWR calculations
│       ├── coast-fire-shift-calculations.ts       # Coast FIRE shift calculations
│       ├── coast-fire-calculations.ts             # Coast FIRE number calculations
│       ├── owner-earnings.ts                      # Owner earnings calculations
│       ├── vpw-calculations.ts                    # VPW calculations
│       ├── faq-data.ts                            # FAQItem type and shared FAQ data
│       └── formatters.ts                          # Currency/number formatting utilities
├── docs/
│   ├── CHEATSHEETS.md                             # Page template, checklist, SEO rules
│   └── PROJECT-STRUCTURE.md                       # This file
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── DESIGN.md                                      # Design system documentation
├── CLAUDE.md                                      # (deprecated — use AGENTS.md)
└── AGENTS.md                                      # Primary project context for agents
```

## Key Paths Quick Reference

| Purpose | Path |
|---|---|
| Main calculator component | `src/components/calculator/FIRECalculatorBase.astro` |
| Calculation engine | `src/utils/calculations.ts` |
| Formatting utilities | `src/utils/formatters.ts` |
| Design tokens (CSS vars) | `src/styles/global.css` |
| Reusable UI components | `src/components/ui/` |
| Page layouts | `src/layouts/` |
| SEO/structured data | `src/components/seo/StructuredData.astro` |
| Header nav | `src/components/layout/Header.astro` |
| Footer nav | `src/components/layout/Footer.astro` |
