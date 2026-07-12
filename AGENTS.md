# AGENTS.md — True Finance Tools

## Project Overview

**Name:** True Finance Tools
**Domain:** truefinancetools.com
**Framework:** Astro v6.4.4 (static site generator)
**Styling:** Tailwind CSS v4.3 (CSS-based config, no JS config file)
**Language:** TypeScript (strict mode)
**Package Manager:** npm
**Node Requirement:** >= 22.12.0

A multi-tool financial calculator website. Currently has 35 calculator pages covering FIRE planning, portfolio management, investment analysis, UK tax optimization, student loans, and Social Security planning.

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
│   │   │   ├── FIRECalculatorBase.astro            # Main FIRE calculator (vanilla JS)
│   │   │   ├── GeoArbitrageCalculator.astro         # Geographic arbitrage calculator
│   │   │   ├── DieWithZeroCalculator.astro          # Die with Zero decumulation calculator
│   │   │   ├── SequenceOfReturnsCalculator.astro    # SRR stress tester
│   │   │   ├── OneMoreYearCalculator.astro          # OMY syndrome cost calculator
│   │   │   ├── CashCushionOptimizer.astro           # Cash cushion vs equity yield optimizer
│   │   │   ├── PerpetualSWRCalculator.astro         # Perpetual SWR calculator
│   │   │   ├── CoastFireNumber.astro                # Coast FIRE number calculator
│   │   │   ├── CoastFireShiftCalculator.astro       # Coast FIRE shift to part-time calculator
│   │   │   ├── OwnerEarningsCalculator.astro        # Owner earnings / Buffett intrinsic value
│   │   │   ├── VPWCalculator.astro                  # Variable percentage withdrawal calculator
│   │   │   ├── CoreSatelliteRebalancer.astro        # Core-Satellite portfolio rebalancer
│   │   │   ├── DividendTaxDragCalculator.astro      # Dividend tax drag modeler
│   │   │   ├── SEPPCalculator.astro                 # SEPP / 72(t) early withdrawal calculator
│   │   │   ├── GuardrailsCalculator.astro            # Guyton-Klinger guardrails withdrawal calculator
│   │   │   ├── TaxGainHarvestingCalculator.astro     # Tax gain harvesting simulator
│   │   │   ├── RetirementBucketCalculator.astro      # 3-bucket drawdown strategy simulator
│   │   │   ├── BondTentCalculator.astro              # Bond tent / SRR glide path calculator
│   │   │   ├── CoastFireByAgeCalculator.astro        # Coast FIRE by Age glide path calculator
│   │   │   ├── HsaShoeboxStrategyCalculator.astro    # HSA Shoebox Strategy delayed reimbursement calculator
│   │   │   ├── HouseHackingCalculator.astro          # House hacking cash flow calculator
│   │   │   ├── SeppVsRothLadderCalculator.astro      # 72(t) SEPP vs Roth Conversion Ladder comparison
│   │   │   ├── AcaSubsidyCalculator.astro            # ACA Subsidy Cliff calculator
│   │   │   ├── JisaVsBareTrustCalculator.astro       # JISA vs Bare Trust comparison calculator
│   │   │   ├── LisaVsPensionCalculator.astro         # LISA vs Workplace Pension comparison calculator
│   │   │   ├── MegaBackdoorRothCalculator.astro      # Mega Backdoor Roth calculator
│   │   │   ├── MortgageVsIsaCalculator.astro         # Mortgage Overpayment vs Investing calculator (UK)
│   │   │   ├── Plan5StudentLoanCalculator.astro      # Plan 5 Student Loan Repayment calculator
│   │   │   ├── SocialSecurityBridgeCalculator.astro  # Social Security Bridge calculator
│   │   │   ├── SippDrawdownCalculator.astro          # SIPP Drawdown Tax calculator
│   │   │   ├── UkRedundancyTaxCalculator.astro       # UK Redundancy Tax calculator
│   │   │   ├── SalarySacrificePensionCalculator.astro # UK Salary Sacrifice Pension Optimizer
│   │   ├── layout/
│   │   │   ├── Header.astro            # Sticky header with nav, mobile menu, theme toggle
│   │   │   └── Footer.astro            # 4-column footer
│   │   ├── seo/
│   │   │   └── StructuredData.astro    # JSON-LD structured data + FAQ schema
│   │   └── ui/
│   │       ├── Button.astro            # Reusable button (primary/secondary/ghost)
│   │       ├── Card.astro              # Reusable card (default/soft/bordered)
│   │       ├── HowItWorks.astro        # 3-step "How It Works" section component
│   │       ├── Input.astro             # Reusable text input with label/error
│   │       ├── ResultCard.astro        # KPI result card with label, value, description
│   │       ├── Slider.astro            # Reusable range slider
│   │       └── ThemeToggle.astro       # Dark/light/system theme toggle
│   ├── layouts/
│   │   ├── BaseLayout.astro            # Production layout (SEO, meta, fonts, GA, FOUC script)
│   │   └── PageLayout.astro            # Calculator page layout (Header + sections + Footer)
│   ├── pages/
│   │   ├── index.astro                 # Homepage / landing page
│   │   ├── fire-calculator/
│   │   │   └── index.astro             # FIRE calculator page
│   │   ├── lean-fire-calculator/
│   │   │   └── index.astro             # Lean FIRE calculator page
│   │   ├── fat-fire-calculator/
│   │   │   └── index.astro             # Fat FIRE calculator page
│   │   ├── barista-fire-calculator/
│   │   │   └── index.astro             # Barista FIRE calculator page
│   │   ├── coast-fire-number/
│   │   │   └── index.astro             # Coast FIRE Number calculator page
│   │   ├── coast-fire-shift-calculator/
│   │   │   └── index.astro             # Coast FIRE Shift calculator page
│   │   ├── geographic-arbitrage-calculator/
│   │   │   └── index.astro             # Geographic Arbitrage calculator page
│   │   ├── die-with-zero-calculator/
│   │   │   └── index.astro             # Die with Zero calculator page
│   │   ├── sequence-of-returns-calculator/
│   │   │   └── index.astro             # SRR Stress Tester page
│   │   ├── one-more-year-calculator/
│   │   │   └── index.astro             # OMY Syndrome calculator page
│   │   ├── cash-cushion-optimizer/
│   │   │   └── index.astro             # Cash Cushion Optimizer page
│   │   ├── perpetual-swr-calculator/
│   │   │   └── index.astro             # Perpetual SWR calculator page
│   │   ├── owner-earnings-calculator/
│   │   │   └── index.astro             # Owner Earnings calculator page
│   │   ├── vpw-calculator/
│   │   │   └── index.astro             # VPW calculator page
│   │   ├── core-satellite-rebalancer/
│   │   │   └── index.astro             # Core-Satellite Rebalancer page
│   │   ├── sepp-calculator/
│   │   │   └── index.astro             # SEPP / 72(t) calculator page
│   │   ├── tax-gain-harvesting-calculator/
│   │   │   └── index.astro             # Tax Gain Harvesting Calculator page
│   │   ├── house-hacking-calculator/
│   │   │   └── index.astro             # House Hacking Cash Flow Calculator page
│   │   ├── 72t-vs-roth-conversion-ladder-calculator/
│   │   │   └── index.astro             # 72(t) SEPP vs Roth Conversion Ladder Calculator page
│   │   ├── salary-sacrifice-pension-calculator/
│   │   │   └── index.astro             # UK Salary Sacrifice Pension Optimizer page
│   │   ├── learn/
│   │   │   ├── what-is-fire.astro      # Learn: What is FIRE?
│   │   │   ├── fire-strategies.astro   # Learn: FIRE Strategies
│   │   │   ├── fire-number.astro       # Learn: Your FIRE Number
│   │   │   └── barista-fire.astro       # Learn: Barista FIRE
│   │   ├── tools/
│   │   │   └── index.astro             # All tools overview page
│   │   ├── about/
│   │   │   └── index.astro             # About page
│   │   ├── contact/
│   │   │   └── index.astro             # Contact page
│   │   ├── privacy/
│   │   │   └── index.astro             # Privacy policy
│   │   └── terms/
│   │       └── index.astro             # Terms of service
│   ├── styles/
│   │   └── global.css                  # Tailwind v4 @theme tokens + dark mode
│   └── utils/
│       ├── calculations.ts                # FIRE calculation engine
│       ├── coast-fire-calculations.ts     # Coast FIRE calculation engine
│       ├── coast-fire-shift-calculations.ts # Coast FIRE Shift calculation engine
│       ├── geo-arbitrage-calculations.ts  # Geographic arbitrage calculation engine
│       ├── decumulation-calculations.ts   # Die with Zero calculation engine
│       ├── srr-calculations.ts            # SRR stress test calculation engine
│       ├── omy-calculations.ts            # OMY syndrome calculation engine
│       ├── cash-cushion-calculations.ts   # Cash cushion optimization engine
│       ├── pswr-calculations.ts           # Perpetual SWR calculation engine
│       ├── owner-earnings.ts              # Owner earnings / Buffett valuation engine
│       ├── vpw-calculations.ts            # VPW actuarial withdrawal engine
│       ├── rebalancer-calculations.ts     # Core-Satellite rebalancing engine
│       ├── seppMath.ts                    # SEPP / 72(t) distribution engine
│       ├── tax-gain-harvesting-calculations.ts # Tax gain harvesting calculation engine
│       ├── retirement-bucket-calculations.ts    # 3-bucket drawdown strategy engine
│       ├── bond-tent-calculations.ts            # Bond tent / SRR glide path engine
│       ├── hsa-shoebox-calculations.ts          # HSA Shoebox Strategy calculation engine
│       ├── house-hacking-calculations.ts         # House hacking cash flow calculation engine
│       ├── sepp-vs-roth-calculations.ts          # 72(t) SEPP vs Roth Ladder comparison engine
│       ├── social-security-bridge-calculations.ts    # Social Security Bridge calculation engine
│       ├── mega-backdoor-roth-calculations.ts        # Mega Backdoor Roth calculation engine
│       ├── mortgage-isa-calculations.ts              # Mortgage vs ISA calculation engine
│       ├── uk-redundancy-calculations.ts             # UK Redundancy Tax calculation engine
│       ├── lisa-vs-pension-calculations.ts           # LISA vs Pension calculation engine
│       ├── salary-sacrifice-calculations.ts          # UK Salary Sacrifice Pension calculation engine
│       ├── jisa-bare-trust-calculations.ts           # JISA vs Bare Trust calculation engine
│       ├── plan5-student-loan-calculations.ts        # Plan 5 Student Loan calculation engine
│       ├── faq-data.ts                    # FAQ types and shared FAQ data
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
| `/lean-fire-calculator` | `src/pages/lean-fire-calculator/index.astro` | Lean FIRE dedicated page (standalone) |
| `/fat-fire-calculator` | `src/pages/fat-fire-calculator/index.astro` | Fat FIRE dedicated page (standalone) |
| `/barista-fire-calculator` | `src/pages/barista-fire-calculator/index.astro` | Barista FIRE dedicated page (standalone) |
| `/coast-fire-number` | `src/pages/coast-fire-number/index.astro` | Coast FIRE Number calculator (standalone) |
| `/coast-fire-shift-calculator` | `src/pages/coast-fire-shift-calculator/index.astro` | Coast FIRE Shift calculator (standalone) |
| `/learn/what-is-fire` | `src/pages/learn/what-is-fire.astro` | What is FIRE? |
| `/learn/fire-strategies` | `src/pages/learn/fire-strategies.astro` | FIRE Strategies |
| `/learn/fire-number` | `src/pages/learn/fire-number.astro` | Your FIRE Number |
| `/learn/barista-fire` | `src/pages/learn/barista-fire.astro` | Barista FIRE |
| `/geographic-arbitrage-calculator` | `src/pages/geographic-arbitrage-calculator/index.astro` | Geographic Arbitrage PPP Calculator |
| `/die-with-zero-calculator` | `src/pages/die-with-zero-calculator/index.astro` | Die with Zero Decumulation Calculator |
| `/sequence-of-returns-calculator` | `src/pages/sequence-of-returns-calculator/index.astro` | Sequence of Returns Risk Stress Tester |
| `/one-more-year-calculator` | `src/pages/one-more-year-calculator/index.astro` | One More Year Syndrome Cost Calculator |
| `/cash-cushion-optimizer` | `src/pages/cash-cushion-optimizer/index.astro` | Cash Cushion vs. Equity Yield Optimizer |
| `/perpetual-swr-calculator` | `src/pages/perpetual-swr-calculator/index.astro` | Perpetual Safe Withdrawal Rate Calculator |
| `/owner-earnings-calculator` | `src/pages/owner-earnings-calculator/index.astro` | Owner Earnings / Buffett Intrinsic Value Calculator |
| `/vpw-calculator` | `src/pages/vpw-calculator/index.astro` | Variable Percentage Withdrawal Calculator |
| `/core-satellite-rebalancer` | `src/pages/core-satellite-rebalancer/index.astro` | Core-Satellite Portfolio Rebalancer |
| `/sepp-calculator` | `src/pages/sepp-calculator/index.astro` | SEPP / 72(t) Early Distribution Calculator |
| `/guardrails-withdrawal-calculator` | `src/pages/guardrails-withdrawal-calculator/index.astro` | Guardrails Withdrawal Strategy Calculator |
| `/tax-gain-harvesting-calculator` | `src/pages/tax-gain-harvesting-calculator/index.astro` | Tax Gain Harvesting Calculator |
| `/bond-tent-calculator` | `src/pages/bond-tent-calculator/index.astro` | Bond Tent / SRR Glide Path Calculator |
| `/coast-fire-by-age-calculator` | `src/pages/coast-fire-by-age-calculator/index.astro` | Coast FIRE by Age Glide Path Calculator |
| `/retirement-bucket-strategy-calculator` | `src/pages/retirement-bucket-strategy-calculator/index.astro` | 3-Bucket Retirement Drawdown Strategy Simulator |
| `/hsa-shoebox-strategy-calculator` | `src/pages/hsa-shoebox-strategy-calculator/index.astro` | HSA Shoebox Strategy Calculator |
| `/house-hacking-calculator` | `src/pages/house-hacking-calculator/index.astro` | House Hacking Cash Flow Calculator |
| `/72t-vs-roth-conversion-ladder-calculator` | `src/pages/72t-vs-roth-conversion-ladder-calculator/index.astro` | 72(t) SEPP vs Roth Conversion Ladder Calculator |
| `/aca-subsidy-cliff-calculator` | `src/pages/aca-subsidy-cliff-calculator/index.astro` | ACA Subsidy Cliff Calculator |
| `/jisa-vs-bare-trust-calculator` | `src/pages/jisa-vs-bare-trust-calculator/index.astro` | JISA vs Bare Trust Comparison Calculator |
| `/lisa-vs-workplace-pension-calculator` | `src/pages/lisa-vs-workplace-pension-calculator/index.astro` | LISA vs Workplace Pension Comparison Calculator |
| `/mega-backdoor-roth-calculator` | `src/pages/mega-backdoor-roth-calculator/index.astro` | Mega Backdoor Roth Calculator |
| `/mortgage-overpayment-vs-investing-calculator-uk` | `src/pages/mortgage-overpayment-vs-investing-calculator-uk/index.astro` | Mortgage Overpayment vs Investing Calculator (UK) |
| `/plan-5-student-loan-repayment-calculator` | `src/pages/plan-5-student-loan-repayment-calculator/index.astro` | Plan 5 Student Loan Repayment Calculator |
| `/social-security-bridge-calculator` | `src/pages/social-security-bridge-calculator/index.astro` | Social Security Bridge Calculator |
| `/sipp-drawdown-tax-calculator` | `src/pages/sipp-drawdown-tax-calculator/index.astro` | SIPP Drawdown Tax Calculator |
| `/uk-redundancy-tax-calculator` | `src/pages/uk-redundancy-tax-calculator/index.astro` | UK Redundancy Tax Calculator |
| `/salary-sacrifice-pension-calculator` | `src/pages/salary-sacrifice-pension-calculator/index.astro` | Salary Sacrifice Pension Optimizer |
| `/tools` | `src/pages/tools/index.astro` | All tools overview |
| `/about` | `src/pages/about/index.astro` | About page |
| `/contact` | `src/pages/contact/index.astro` | Contact page |
| `/privacy` | `src/pages/privacy/index.astro` | Privacy policy |
| `/terms` | `src/pages/terms/index.astro` | Terms of service |

**URL convention:** New tools go at `/{tool-name}` (e.g., `/mortgage-calculator`).

## Design System

> Full design system details (colors, typography, components, spacing) are in `DESIGN.md`.

### Dark Mode

- Uses CSS custom properties that change under `html.dark`
- FOUC prevention script in `<head>` of BaseLayout reads `localStorage('theme')`
- ThemeToggle cycles: light → dark → system
- `system` follows `prefers-color-scheme` and updates live on OS change
- Chart.js colors in calculators detect dark mode via `document.documentElement.classList.contains('dark')`

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
- **Interactivity** — all calculator logic is vanilla JS in component `<script>` blocks
- **Pages use two layout patterns:** `PageLayout` for calculator pages (includes Header/Footer), `BaseLayout` for learn/static pages (requires manual Header/Footer import)

## Key Implementation Details

| Calculator | File | Lines | Utils | Chart | Key Features |
|---|---|---|---|---|---|
| FIRE | FIRECalculatorBase.astro | ~700 | calculations.ts | Chart.js | URL state sharing via query params, 4 FIRE types (regular/lean/fat/coast), scenario comparison, export & share, theme-aware via MutationObserver |
| Geo Arbitrage | GeoArbitrageCalculator.astro | — | geo-arbitrage-calculations.ts | Chart.js line | PPP adjustment, 30-year inflation-adjusted projection, home vs target country comparison, US→India presets |
| Die with Zero | DieWithZeroCalculator.astro | — | decumulation-calculations.ts | Chart.js line | TVM annuity PMT formula, linear and front-loaded (Go-Go Years) spending curves, portfolio declining to buffer, 4% rule comparison (money left on table), theme-aware via MutationObserver |
| SRR Stress Tester | SequenceOfReturnsCalculator.astro | — | srr-calculations.ts | Chart.js dual-line | Steady vs crashed projections, 30-year inflation-adjusted simulation, 3 crash scenarios (Dot-Com, GFC, Stagflation) + custom, Zero-floor rule, theme-aware via MutationObserver |
| OMY Syndrome | OneMoreYearCalculator.astro | — | omy-calculations.ts | Chart.js dual-line | Retire today vs wait projections, 30-year portfolio divergence, "Extra Years to Work" slider (1-5), lifestyle converters (vacations/cars per year), time cost display (hours of healthy life traded), theme-aware via MutationObserver |
| Cash Cushion Optimizer | CashCushionOptimizer.astro | — | cash-cushion-calculations.ts | Chart.js stacked bar | Dividend vs cash-funded expenses, PMT-like annuity factor formula, 3 KPI cards (Naive Cash red, Optimized Cash green, Capital Freed blue), year-by-year crash breakdown, theme-aware via MutationObserver |
| Perpetual SWR | PerpetualSWRCalculator.astro | — | pswr-calculations.ts | Chart.js dual-line | Fisher Equation, PSWR = Real Return - Fees, real vs nominal projection, 50-100 year inflation-adjusted projection, 3 KPI cards (PSWR green, Annual Safe Spend ink, Nominal Legacy blue), unsustainable warning (PSWR ≤ 0), targets FatFIRE/estate planners/endowments, theme-aware via MutationObserver |
| Coast FIRE Number | CoastFireNumber.astro | ~558 | coast-fire-calculations.ts | Chart.js line/bar toggler | Compound interest target determination, 4 primary + 3 secondary KPI cards, Coast status badge with progress bar, collapsible year-by-year table, PDF export & share |
| Coast FIRE Shift | CoastFireShiftCalculator.astro | ~943 | coast-fire-shift-calculations.ts | Chart.js dual-line | Two-phase retirement (full-time → part-time → full retirement), 4 KPI cards, Surplus/Deficit color-coded card, "One More Year" Cost Index card, year-by-year table |
| Owner Earnings | OwnerEarningsCalculator.astro | ~976 | owner-earnings.ts | None | Buffett Owner Earnings formula, two CapEx methods (Basic/Greenwald 5-year PP&E), Ten-Cap discount rate, 4 KPI cards, Margin of Safety indicator (green/yellow/red), 15+ 10-K financial inputs |
| VPW | VPWCalculator.astro | ~844 | vpw-calculations.ts | Chart.js dual-line | Bogleheads VPW vs 4% rule comparison, multi-scenario (Steady, Sequence Risk, GFC, Lost Decade), 0% ruin badge, 4 KPI cards, Pension/Social Security bridge toggle, asset allocation inputs, year-by-year table |
| Core-Satellite Rebalancer | CoreSatelliteRebalancer.astro | ~698 | rebalancer-calculations.ts | None | Dynamic portfolio with add/remove holdings, cash-first tax-aware buy/sell optimization, 3 KPI cards, per-holding rebalancing table, weight normalization warning, tax impact warning |
| Dividend Tax Drag | DividendTaxDragCalculator.astro | ~996 | Inline (none) | Chart.js dual-line | Taxable vs Tax-Advantaged comparison, 4 presets (High-Yield ETF, Growth Stock, Balanced, S&P 500), 6 KPI cards, interactive sliders for all inputs |
| SEPP / 72(t) | SEPPCalculator.astro | ~580 | seppMath.ts | SVG chart | 3 IRS methods (RMD, Fixed Amortization, Fixed Annuitization), 3 method cards with payment/totals, tabbed interface (Comparison/Schedule/Chart), SVG balance drawdown, annual schedule, IRS §7520 rate validation, Single Modifications & multiple segments |
| Guardrails | GuardrailsCalculator.astro | ~437 | guardrails-calculations.ts | Chart.js dual-line | Guyton-Klinger strategy, upper (120%)/lower (80%) guardrails, Capital Preservation Rule (10% cut), Prosperity Rule (10% increase), 4 KPI cards, collapsible year-by-year table with guardrail indicators, depletion warning, theme-aware via MutationObserver |
| Retirement Bucket | RetirementBucketCalculator.astro | ~470 | retirement-bucket-calculations.ts | Chart.js stacked area line | 3-bucket strategy (Cash/Bonds/Growth), waterfall spending (B1→B2→B3), yield & replenishment (B2→B1, B3→B2), edge case scaling, 3 KPI cards, 3 color-coded allocation boxes, disclaimer, theme-aware via MutationObserver |
| Bond Tent | BondTentCalculator.astro | ~481 | bond-tent-calculations.ts | Chart.js dual-line | Rising equity glide path (bond tent), 3-phase simulation (pre/post/post-glide), 3 crash scenarios (Severe -30%, Moderate -15%, Flat 3yr), tent vs static comparison, 4 KPI cards, summary dollar advantage banner, collapsible year-by-year table with bond %, theme-aware via MutationObserver |
| Coast FIRE by Age | CoastFireByAgeCalculator.astro | ~505 | coast-fire-by-age-calculations.ts | Chart.js dual-line | Milestone at every age, reverse compound interest formula, 6 input controls, status alert card (Green/Orange), 4 KPI cards, required (solid) vs projected (dashed) chart, age-by-age table with progress bars, edge case warning, theme-aware via MutationObserver |
| HSA Shoebox | HsaShoeboxStrategyCalculator.astro | ~400 | hsa-shoebox-calculations.ts | Chart.js dual-line | Immediate vs Delayed Reimbursement comparison, 5 slider inputs, 5 KPI cards, year-by-year advantage table, excess warning (expenses > HSA capacity Y1), theme-aware via MutationObserver, targets US-based early retirees/FIRE community |
| House Hacking | HouseHackingCalculator.astro | ~290 | house-hacking-calculations.ts | None | PITI + PMI for FHA and conventional loans, operating expenses (vacancy, maintenance, CapEx), 9 inputs, 4 KPI cards (Gross Mortgage, Net Rental Income, Monthly P&I, PMI), monthly breakdown table with color-coded cash flow, PMI warning (< 20% down), theme-aware via CSS tokens |
| ACA Subsidy Cliff | AcaSubsidyCalculator.astro | — | Inline (none) | None | ACA subsidy cliff visualization, income threshold analysis, phase-out calculation, year-by-year comparison, theme-aware via CSS tokens |
| JISA vs Bare Trust | JisaVsBareTrustCalculator.astro | — | jisa-bare-trust-calculations.ts | None | UK JISA vs Bare Trust comparison, tax-free growth analysis, inheritance tax implications, scenario comparison |
| LISA vs Workplace Pension | LisaVsPensionCalculator.astro | — | lisa-vs-pension-calculations.ts | None | UK LISA vs workplace pension comparison, employer match analysis, tax relief comparison, retirement savings optimizer |
| Mega Backdoor Roth | MegaBackdoorRothCalculator.astro | — | mega-backdoor-roth-calculations.ts | None | Mega Backdoor Roth analysis, after-tax 401k to Roth IRA conversion, contribution limit calculator, tax-free growth projection |
| Mortgage vs ISA (UK) | MortgageVsIsaCalculator.astro | — | mortgage-isa-calculations.ts | None | UK mortgage overpayment vs ISA investing comparison, interest savings vs investment growth, tax-free allowance optimization |
| Plan 5 Student Loan | Plan5StudentLoanCalculator.astro | — | plan5-student-loan-calculations.ts | None | UK Plan 5 student loan repayment calculator, income-contingent repayment, forgiveness threshold analysis, early repayment comparison |
| Social Security Bridge | SocialSecurityBridgeCalculator.astro | — | social-security-bridge-calculations.ts | Chart.js line | Social Security bridge strategy, early retirement gap analysis, claiming age optimization, portfolio withdrawal coordination |
| SIPP Drawdown Tax | SippDrawdownCalculator.astro | — | Inline (none) | None | UK SIPP drawdown tax calculator, 25% tax-free lump sum, income tax band optimization, drawdown strategy planner |
| UK Redundancy Tax | UkRedundancyTaxCalculator.astro | — | uk-redundancy-calculations.ts | None | UK redundancy payment tax calculator, statutory redundancy calculation, tax-free allowance, employment income comparison |
| Salary Sacrifice Pension | SalarySacrificePensionCalculator.astro | ~650 | salary-sacrifice-calculations.ts | Chart.js stacked bar | Standard vs Salary Sacrifice comparison, 2026/27 UK tax bands, employer NI savings pass-through (15%), PA taper analysis, NMW viability check, side-by-side KPI cards, benefit banner, Chart.js stacked bar chart, theme-aware via MutationObserver |

### Adding a New Tool

1. Create `src/pages/{tool-name}/index.astro`
2. Create component in `src/components/calculator/{ToolName}Calculator.astro`
3. Add nav link in `Header.astro` — add to the `calculatorCategories` array in `src/components/layout/Header.astro` under the appropriate category
4. Add footer link in `Footer.astro`
5. Add to `StructuredData.astro` if needed
6. Add to the Tools overview page — add a card to the appropriate category section in `src/pages/tools/index.astro` and update the calculator count in the hero badge
7. Follow the [Calculator Page Template](#calculator-page-template-based-on-barista-fire-page) and run through the [Page Creation Checklist](#page-creation-checklist) before merging

**⚠️ CRITICAL: Steps 3 and 6 are mandatory for every new calculator.** The Builder must NEVER skip these. The Header dropdown (`calculatorCategories` in `src/components/layout/Header.astro`) and the Tools overview page (`src/pages/tools/index.astro`) must be updated as part of every calculator build. If these are forgotten, the tool will be invisible to users from navigation and the tools directory.

### Adding Dark Mode to New Components

Most components auto-switch via CSS variables. For anything with hardcoded colors:
1. Use CSS variable tokens instead of hex values
2. For JS-rendered content, check `document.documentElement.classList.contains('dark')`
3. For Chart.js, pass dynamic colors from the detection above

### Git Branching Rules

#### Mandatory Workflow — Every Task

1. **ALWAYS start with a fresh branch.** Before writing any code, create a new branch from `main`. Never skip this step.
2. **NEVER work on `main` directly.** All development happens on dedicated branches only. `main` is sacred — it must always be in a deployable state.
3. **Push the branch to GitHub after completion.** Once the work is done and the build passes, push the branch to origin so the user can preview it (e.g., via Vercel/Netlify preview deploy or `git diff main`).
4. **Agent must NEVER merge any branch into `main`.** Merging to `main` is a manual action that requires explicit user instruction.

#### Branch Creation Checklist

Before starting ANY task, the Builder agent must run:
```bash
git checkout main
git pull origin main
git checkout -b {branch-name}
```

#### Branch Naming Conventions

| Fix Size | Branch Naming | Description |
|----------|---------------|-------------|
| Small (typo, simple refactor) | `quick-fix/{description}` | Single file, minimal changes |
| Medium (component refactor) | `refactor/{description}` | Multi-file, related changes |
| Large (feature, major refactor) | `feat/{description}` | Complex changes across codebase |

#### After Completion — Push to GitHub

Once the build passes and the task is complete, the Builder must push the branch:
```bash
git add -A
git commit -m "{descriptive commit message}"
git push origin {branch-name}
```

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

Page structure (11 sections in order):
1. Imports (PageLayout, HowItWorks, StructuredData, FAQItem, calculator)
2. FAQ items inline (6-8 items)
3. PageLayout wrapper with SEO props
4. StructuredData with features array
5. Hero section (bg-canvas border-b, centered h1 + subtitle)
6. Calculator component
7. How It Works (3 steps in <HowItWorks>)
8. "What is {Tool}?" (bg-canvas-soft) — definition → formula → comparison → Who Should Choose 2×2 → Pros/Cons
9. FAQ section (bg-canvas) — details/summary mapped from toolFaqItems
10. Complete Guide (bg-canvas) — "Why Choose" + "Key Features" subheadings
11. Explore Other (bg-canvas-soft) — 6 cross-links in 3-column grid, highlight one with border-2

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

Learn/Guide page structure:
- Uses BaseLayout (not PageLayout)
- Imports: BaseLayout, Header, Footer, StructuredData
- Sections: Hero (with "Learn" label + h1 + subtitle) → Article (prose content: What is → How it Works → Why Choose → Comparison → Things to Consider → CTA)
- CTA uses: rounded-full bg-ink px-6 py-3 text-sm font-medium text-canvas

### Known existing components (always check these first)

| Component | Location | Use for |
|-----------|----------|---------|
| `Button.astro` | `src/components/ui/` | All CTAs (primary/secondary/ghost variants) |
| `Card.astro` | `src/components/ui/` | Content cards (default/soft/bordered) |
| `HowItWorks.astro` | `src/components/ui/` | 3-step "How It Works" section |
| `Input.astro` | `src/components/ui/` | Form text inputs |
| `ResultCard.astro` | `src/components/ui/` | KPI result cards with label, value, description |
| `Slider.astro` | `src/components/ui/` | Range slider inputs |
| `ThemeToggle.astro` | `src/components/ui/` | Dark/light mode toggle |
| `Header.astro` | `src/components/layout/` | Site header/nav |
| `Footer.astro` | `src/components/layout/` | Site footer |
| `BaseLayout.astro` | `src/layouts/` | Page shell (SEO, fonts, meta) |
| `PageLayout.astro` | `src/layouts/` | Calculator page layout (Header + Footer + sections) |
| `StructuredData.astro` | `src/components/seo/` | JSON-LD + FAQ schema |
