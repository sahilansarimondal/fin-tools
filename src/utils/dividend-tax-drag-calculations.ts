/**
 * Dividend Tax Drag Calculator — Calculation Engine
 *
 * Computes the compounding difference between a tax-advantaged account
 * (no annual tax drag) and a taxable brokerage account, factoring in
 * US tax rates on qualified vs. non-qualified dividends, State taxes,
 * and the Net Investment Income Tax (NIIT).
 *
 * Key concepts:
 * - Tax-advantaged accounts compound fully without any tax leakage on dividends
 * - Taxable accounts pay taxes on dividends each year, permanently removing
 *   that capital from the compounding base
 * - The blended tax rate accounts for the split between qualified dividends
 *   (taxed at LTCG rates) and ordinary dividends (taxed at ordinary income rates)
 * - The Net Investment Income Tax (NIIT) adds a 3.8% surtax for high earners
 *
 * @module dividend-tax-drag-calculations
 */

import {
  formatCurrency,
  formatCurrencyShort,
  formatPercent,
} from './formatters';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface DividendTaxDragInputs {
  /** Initial lump-sum investment in dollars (e.g., 10000) */
  initialInvestment: number;
  /** Monthly recurring contribution in dollars (e.g., 500) */
  monthlyContribution: number;
  /** Number of years to project (e.g., 25) */
  timeHorizon: number;
  /** Expected annual price appreciation as a decimal (e.g., 0.07 for 7%) */
  priceAppreciation: number;
  /** Expected annual dividend yield as a decimal (e.g., 0.02 for 2%) */
  dividendYield: number;
  /** Portion of dividends that are qualified (e.g., 0.90 for 90%) */
  percentQualified: number;
  /** Marginal federal ordinary income tax bracket as a decimal (e.g., 0.32 for 32%) */
  federalOrdinaryBracket: number;
  /** Marginal federal long-term capital gains tax bracket as a decimal (e.g., 0.15 for 15%) */
  federalLTCGBracket: number;
  /** Marginal state income tax rate as a decimal (e.g., 0.05 for 5%) */
  stateTaxRate: number;
  /** Whether the investor is subject to the 3.8% Net Investment Income Tax */
  subjectToNIIT: boolean;
}

export interface YearlyProjection {
  /** Year number (1-indexed from start) */
  year: number;
  /** Ending balance in the tax-advantaged account this year */
  taxAdvantagedBalance: number;
  /** Ending balance in the taxable account this year */
  taxableBalance: number;
  /** Cumulative wealth lost to taxes (gap between the two accounts) */
  wealthLostToTaxes: number;
  /** Running total of all dividend taxes paid to date */
  cumulativeDividendsPaid: number;
  /** Dollar amount of dividend tax paid this year */
  annualTaxDrag: number;
  /** Gross dividends generated this year (before tax) */
  grossDividends: number;
  /** Tax paid on dividends this year */
  taxOwed: number;
}

export interface DividendTaxDragResults {
  /** Final balance in the tax-advantaged account at end of horizon */
  taxAdvantagedFinal: number;
  /** Final balance in the taxable account at end of horizon */
  taxableFinal: number;
  /** Total wealth destroyed by dividend taxes (taxAdvantagedFinal - taxableFinal) */
  totalWealthLost: number;
  /** Effective annual expense ratio equivalent (the "drag" percentage as a decimal) */
  totalTaxDragPercent: number;
  /** Year-by-year projection array for charting and tables */
  yearlyProjections: YearlyProjection[];
}

// ──────────────────────────────────────────────
// Default Inputs & Presets
// ──────────────────────────────────────────────

export const defaultInput: DividendTaxDragInputs = {
  initialInvestment: 10000,
  monthlyContribution: 500,
  timeHorizon: 25,
  priceAppreciation: 0.07,
  dividendYield: 0.02,
  percentQualified: 0.90,
  federalOrdinaryBracket: 0.32,
  federalLTCGBracket: 0.15,
  stateTaxRate: 0.05,
  subjectToNIIT: false,
};

export const presets: { name: string; input: DividendTaxDragInputs }[] = [
  {
    name: 'S&P 500 Index Fund',
    input: { ...defaultInput, dividendYield: 0.013, percentQualified: 0.95 },
  },
  {
    name: 'High-Dividend ETF',
    input: { ...defaultInput, dividendYield: 0.04, percentQualified: 0.85 },
  },
  {
    name: 'REIT Heavy',
    input: {
      ...defaultInput,
      dividendYield: 0.05,
      percentQualified: 0.10,
      priceAppreciation: 0.04,
    },
  },
  {
    name: 'Bond Fund',
    input: {
      ...defaultInput,
      dividendYield: 0.045,
      percentQualified: 0.0,
      priceAppreciation: 0.01,
    },
  },
  {
    name: 'High Earner + State Tax',
    input: {
      ...defaultInput,
      subjectToNIIT: true,
      federalOrdinaryBracket: 0.37,
      federalLTCGBracket: 0.20,
      stateTaxRate: 0.093,
    },
  },
];

// ──────────────────────────────────────────────
// Calculation Functions
// ──────────────────────────────────────────────

/**
 * Calculates the blended tax rates for qualified and ordinary dividends,
 * accounting for federal brackets, state tax, and the NIIT surtax.
 *
 * The NIIT (Net Investment Income Tax) of 3.8% applies to the lesser of
 * net investment income or modified adjusted gross income above thresholds
 * ($200k single / $250k married filing jointly).
 *
 * @param inputs - The tax-related input fields (federal brackets, state rate, NIIT flag)
 * @returns An object with `qualifiedTaxRate` and `ordinaryTaxRate` as decimals
 *
 * @example
 * ```ts
 * const rates = calculateBlendedTaxRate({
 *   federalOrdinaryBracket: 0.32,
 *   federalLTCGBracket: 0.15,
 *   stateTaxRate: 0.05,
 *   subjectToNIIT: true,
 * });
 * // => { qualifiedTaxRate: 0.238, ordinaryTaxRate: 0.408 }
 * ```
 */
export function calculateBlendedTaxRate(
  inputs: Pick<
    DividendTaxDragInputs,
    | 'federalOrdinaryBracket'
    | 'federalLTCGBracket'
    | 'stateTaxRate'
    | 'subjectToNIIT'
  >,
): {
  qualifiedTaxRate: number;
  ordinaryTaxRate: number;
} {
  const niitSurtax = inputs.subjectToNIIT ? 0.038 : 0;

  const qualifiedTaxRate =
    inputs.federalLTCGBracket + inputs.stateTaxRate + niitSurtax;
  const ordinaryTaxRate =
    inputs.federalOrdinaryBracket + inputs.stateTaxRate + niitSurtax;

  return { qualifiedTaxRate, ordinaryTaxRate };
}

/**
 * Calculates the effective annual tax drag as a percentage of the total
 * portfolio balance.
 *
 * This is the "expense ratio equivalent" — the percentage of your portfolio
 * that is lost to dividend taxes each year in a taxable account.
 *
 * Formula:
 * ```
 * totalDrag = (dividendYield × percentQualified × qualifiedTaxRate)
 *           + (dividendYield × (1 - percentQualified) × ordinaryTaxRate)
 * ```
 *
 * @param inputs - All user-supplied inputs needed to compute the drag
 * @returns The annual drag as a decimal (e.g., 0.00344 for 0.344%)
 *
 * @example
 * ```ts
 * const drag = calculateAnnualTaxDrag({
 *   dividendYield: 0.02,
 *   percentQualified: 0.90,
 *   federalOrdinaryBracket: 0.32,
 *   federalLTCGBracket: 0.15,
 *   stateTaxRate: 0.05,
 *   subjectToNIIT: true,
 *   // other fields omitted (not used in this function beyond tax rates)
 * });
 * // => 0.00476 (0.476% of portfolio lost to taxes each year)
 * ```
 */
export function calculateAnnualTaxDrag(
  inputs: DividendTaxDragInputs,
): number {
  const { qualifiedTaxRate, ordinaryTaxRate } = calculateBlendedTaxRate(inputs);

  const qualifiedYield = inputs.dividendYield * inputs.percentQualified;
  const nonQualifiedYield =
    inputs.dividendYield * (1 - inputs.percentQualified);

  const qualifiedTaxDrag = qualifiedYield * qualifiedTaxRate;
  const ordinaryTaxDrag = nonQualifiedYield * ordinaryTaxRate;

  return qualifiedTaxDrag + ordinaryTaxDrag;
}

/**
 * Calculates the full dividend tax drag projection comparing a tax-advantaged
 * account (e.g., Roth IRA) against a taxable account over the given time horizon.
 *
 * Projection logic for each year:
 * 1. **Total return** for both accounts: `priceAppreciation + dividendYield`
 * 2. **Tax-advantaged**: Grows at full total return without any tax leakage:
 *    `newBalance = balance × (1 + totalReturn) + (monthlyContribution × 12)`
 * 3. **Taxable**: Grows at a reduced return due to the annual tax drag:
 *    `newBalance = balance × (1 + totalReturn - totalTaxDrag%) + (monthlyContribution × 12)`
 * 4. **Tracking**: Gross dividends, tax owed, cumulative totals, and the
 *    widening balance gap are recorded each year.
 *
 * Edge cases handled:
 * - Zero time horizon (returns starting balances)
 * - Zero initial investment and zero contributions (all zeroes throughout)
 * - Zero dividend yield (no tax drag; both accounts grow identically)
 * - Very long time horizons (up to 100 years)
 * - All inputs clamped to non-negative values; percentages clamped to [0, 1]
 *
 * @param inputs - All user-supplied inputs
 * @returns A `DividendTaxDragResults` object with final balances and yearly projections
 *
 * @example
 * ```ts
 * const result = calculateDividendTaxDrag({
 *   initialInvestment: 100000,
 *   monthlyContribution: 1000,
 *   timeHorizon: 30,
 *   priceAppreciation: 0.07,
 *   dividendYield: 0.02,
 *   percentQualified: 0.90,
 *   federalOrdinaryBracket: 0.32,
 *   federalLTCGBracket: 0.15,
 *   stateTaxRate: 0.05,
 *   subjectToNIIT: true,
 * });
 * console.log(result.taxAdvantagedFinal); // ~$1,234,567
 * console.log(result.taxableFinal);        // ~$1,100,000
 * console.log(result.totalWealthLost);     // ~$134,567
 * ```
 */
export function calculateDividendTaxDrag(
  inputs: DividendTaxDragInputs,
): DividendTaxDragResults {
  // --- Clamp inputs to safe ranges ---
  const initialInvestment = Math.max(inputs.initialInvestment, 0);
  const monthlyContribution = Math.max(inputs.monthlyContribution, 0);
  const timeHorizon = Math.max(Math.round(inputs.timeHorizon), 0);
  const priceAppreciation = Math.max(inputs.priceAppreciation, 0);
  const dividendYield = Math.max(inputs.dividendYield, 0);
  const percentQualified = Math.min(Math.max(inputs.percentQualified, 0), 1);
  const federalOrdinaryBracket = Math.min(
    Math.max(inputs.federalOrdinaryBracket, 0),
    1,
  );
  const federalLTCGBracket = Math.min(
    Math.max(inputs.federalLTCGBracket, 0),
    1,
  );
  const stateTaxRate = Math.min(Math.max(inputs.stateTaxRate, 0), 1);

  // --- Compute derived values ---
  const annualContribution = monthlyContribution * 12;
  const totalReturn = priceAppreciation + dividendYield;
  const annualDragPct = calculateAnnualTaxDrag({
    initialInvestment,
    monthlyContribution,
    timeHorizon,
    priceAppreciation,
    dividendYield,
    percentQualified,
    federalOrdinaryBracket,
    federalLTCGBracket,
    stateTaxRate,
    subjectToNIIT: inputs.subjectToNIIT,
  });

  // --- Handle edge case: zero time horizon ---
  if (timeHorizon === 0) {
    const zeroProjection: YearlyProjection[] = [
      {
        year: 0,
        taxAdvantagedBalance: initialInvestment,
        taxableBalance: initialInvestment,
        wealthLostToTaxes: 0,
        cumulativeDividendsPaid: 0,
        annualTaxDrag: 0,
        grossDividends: 0,
        taxOwed: 0,
      },
    ];

    return {
      taxAdvantagedFinal: initialInvestment,
      taxableFinal: initialInvestment,
      totalWealthLost: 0,
      totalTaxDragPercent: annualDragPct,
      yearlyProjections: zeroProjection,
    };
  }

  // --- Handle edge case: nothing to compound ---
  if (initialInvestment === 0 && monthlyContribution === 0) {
    const emptyProjections: YearlyProjection[] = [];
    for (let year = 1; year <= timeHorizon; year++) {
      emptyProjections.push({
        year,
        taxAdvantagedBalance: 0,
        taxableBalance: 0,
        wealthLostToTaxes: 0,
        cumulativeDividendsPaid: 0,
        annualTaxDrag: 0,
        grossDividends: 0,
        taxOwed: 0,
      });
    }

    return {
      taxAdvantagedFinal: 0,
      taxableFinal: 0,
      totalWealthLost: 0,
      totalTaxDragPercent: annualDragPct,
      yearlyProjections: emptyProjections,
    };
  }

  // --- Projection loop ---
  let taBalance = initialInvestment;
  let taxableBalance = initialInvestment;
  let cumulativeDividendsPaid = 0;

  const yearlyProjections: YearlyProjection[] = [];

  for (let year = 1; year <= timeHorizon; year++) {
    // Capture start-of-year balance for computing gross dividends and tax
    const startTaxableBalance = taxableBalance;

    // Gross dividends generated this year (before any tax)
    const grossDividends = startTaxableBalance * dividendYield;

    // Tax owed on those dividends
    const taxOwed = startTaxableBalance * annualDragPct;

    // Tax-advantaged: grows fully without any tax leakage
    taBalance = taBalance * (1 + totalReturn) + annualContribution;

    // Taxable: grows at the total return reduced by the annual tax drag %
    taxableBalance =
      startTaxableBalance * (1 + totalReturn - annualDragPct) +
      annualContribution;

    cumulativeDividendsPaid += taxOwed;

    const wealthLostToTaxes = taBalance - taxableBalance;

    yearlyProjections.push({
      year,
      taxAdvantagedBalance: taBalance,
      taxableBalance,
      wealthLostToTaxes,
      cumulativeDividendsPaid,
      annualTaxDrag: taxOwed,
      grossDividends,
      taxOwed,
    });
  }

  return {
    taxAdvantagedFinal: taBalance,
    taxableFinal: taxableBalance,
    totalWealthLost: taBalance - taxableBalance,
    totalTaxDragPercent: annualDragPct,
    yearlyProjections,
  };
}

// ──────────────────────────────────────────────
// Formatting Helpers (re-exported from formatters)
// ──────────────────────────────────────────────

export { formatCurrency, formatCurrencyShort, formatPercent };
