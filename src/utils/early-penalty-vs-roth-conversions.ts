/**
 * early-penalty-vs-roth-conversions.ts — Early 401(k) Penalty vs Roth Conversion Calculator
 *
 * Pure TypeScript utility module comparing three financial paths for accessing
 * traditional 401(k) funds before age 59.5:
 *   - Scenario A: Immediate early withdrawal (pays 10% IRS penalty)
 *   - Scenario B: Roth conversion (pays income tax today, waits 5 years, no penalty)
 *   - Scenario C: Leave funds in 401(k) until age 59.5 (no penalty, ordinary income tax)
 *
 * Zero UI dependencies. All rates in decimal format (0.05 = 5%).
 *
 * References:
 *   - IRC §72(t) — 10% early withdrawal penalty
 *   - IRC §408A(d)(3)(F) — Roth conversion 5-year seasoning rule
 */

import { formatCurrency as formatCurrencyFn, formatPercent as formatPercentFn } from './formatters';

// ──────────────────────────────────────────────
// IRS Constants
// ──────────────────────────────────────────────

/** 10% IRS penalty on early 401(k) withdrawals before age 59.5 */
const EARLY_WITHDRAWAL_PENALTY_RATE = 0.10;

/** IRS penalty-free withdrawal age */
const AGE_59_5 = 59.5;

/** 5-year seasoning rule for Roth conversion principal access */
const ROTH_CONVERSION_WAIT_YEARS = 5;

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

/**
 * Input parameters for the early withdrawal vs Roth conversion comparison.
 *
 * All monetary values are in whole dollars. All rates are decimal
 * (e.g., 0.24 for 24%, 0.07 for 7%).
 */
export interface EarlyPenaltyInput {
  /** Total 401(k) balance to withdraw or convert (dollars) */
  grossAmount: number;
  /** User's current age (e.g., 35) */
  currentAge: number;
  /** Current marginal tax rate as decimal (e.g., 0.24 for 24%) */
  currentTaxRate: number;
  /** Expected retirement marginal tax rate as decimal (e.g., 0.12 for 12%) */
  retirementTaxRate: number;
  /** Expected annual market return as decimal (e.g., 0.07 for 7%) */
  annualReturn: number;
}

/**
 * Result for Scenario A — Immediate Early Withdrawal.
 *
 * The user pays income tax plus a 10% early withdrawal penalty on the gross
 * amount. The net cash is then invested in a taxable account until age 59.5.
 */
export interface EarlyWithdrawalResult {
  /** Income taxes owed on the withdrawal */
  incomeTax: number;
  /** 10% early withdrawal penalty (0 if already 59.5+) */
  penalty: number;
  /** Total cost = incomeTax + penalty */
  totalCost: number;
  /** What the user actually receives after taxes and penalty */
  netCash: number;
  /** Net cash invested at market return until age 59.5 */
  futureValueAt59_5: number;
  /** Wealth destroyed compared to the Roth conversion path */
  lostWealth: number;
}

/**
 * Result for Scenario B — Roth Conversion (5-Year Seasoning).
 *
 * The user pays income tax on the conversion today (no penalty). After a 5-year
 * seasoning period, the converted principal becomes accessible penalty-free.
 * The accessible age is capped at 59.5.
 */
export interface RothConversionResult {
  /** Income taxes owed on the conversion */
  incomeTax: number;
  /** Always 0 (Roth conversion incurs no early withdrawal penalty) */
  penalty: number;
  /** Amount actually converted to Roth (grossAmount - incomeTax) */
  amountConverted: number;
  /** Age when converted principal becomes penalty-free accessible */
  accessibleAge: number;
  /** Roth account balance at the accessible age */
  valueAtAccessible: number;
  /** Roth account balance at age 59.5 (for cross-scenario comparison) */
  valueAt59_5: number;
}

/**
 * Result for Scenario C — Leave funds in the 401(k) until age 59.5.
 *
 * The gross amount grows tax-deferred until age 59.5. At withdrawal, the
 * entire balance is taxed at the user's expected retirement tax rate.
 */
export interface LeftIn401kResult {
  /** 401(k) balance at age 59.5 (pre-tax) */
  futureGrossValue: number;
  /** Taxes due at retirement tax rate when withdrawn */
  futureTaxOwed: number;
  /** Net cash received after taxes at age 59.5 */
  netCashAt59_5: number;
}

/**
 * A single year in the projection timeline.
 *
 * The timeline runs from year 0 (today) through the year the user turns
 * 59.5, showing the balance trajectory of all three scenarios.
 */
export interface TimelineYear {
  /** Year index (0 = today) */
  year: number;
  /** User's age in this year */
  age: number;
  /** Scenario A: Taxable account balance from invested net cash */
  earlyWithdrawal: number;
  /** Scenario B: Roth IRA balance */
  rothConversion: number;
  /** Scenario C: 401(k) balance (pre-tax) */
  leftIn401k: number;
}

/**
 * Summary identifying the wealth-maximizing path and key differentials.
 */
export interface EarlyPenaltySummary {
  /** Which path yields the highest net cash at age 59.5 */
  bestPath: 'early' | 'roth' | 'traditional';
  /** Wealth destroyed by taking the 10% penalty vs Roth conversion */
  wealthDestroyedByEarlyWithdrawal: number;
  /** How much more the Roth path yields vs leaving funds in the 401(k) */
  rothAdvantageOverTraditional: number;
}

/**
 * Complete comparison result for the early 401(k) penalty vs Roth conversion analysis.
 */
export interface EarlyPenaltyComparison {
  /** The original input parameters */
  input: EarlyPenaltyInput;
  /** Scenario A: Immediate early withdrawal result */
  earlyWithdrawal: EarlyWithdrawalResult;
  /** Scenario B: Roth conversion result */
  rothConversion: RothConversionResult;
  /** Scenario C: Leave in 401(k) result */
  leftIn401k: LeftIn401kResult;
  /** Year-by-year projection timeline (for charts) */
  timeline: TimelineYear[];
  /** Number of years until the user reaches age 59.5 */
  yearsToRetirement: number;
  /** Summary identifying the best path and key differentials */
  summary: EarlyPenaltySummary;
}

// ──────────────────────────────────────────────
// Scenario Calculations
// ──────────────────────────────────────────────

/**
 * Calculates Scenario A: immediate early withdrawal.
 *
 * Applies income tax plus the 10% early withdrawal penalty on the gross
 * amount. The remaining net cash is projected to grow in a taxable account
 * until age 59.5. If the user is already 59.5 or older, no penalty applies.
 *
 * @param grossAmount - Total 401(k) balance to withdraw
 * @param currentAge  - User's current age
 * @param currentTaxRate - Current marginal tax rate (decimal)
 * @param annualReturn - Expected annual market return (decimal)
 * @param yearsToRetirement - Years until user reaches age 59.5
 * @returns Detailed early withdrawal result
 */
function calculateEarlyWithdrawal(
  grossAmount: number,
  currentAge: number,
  currentTaxRate: number,
  annualReturn: number,
  yearsToRetirement: number,
): EarlyWithdrawalResult {
  const incomeTax = grossAmount * currentTaxRate;
  const penalty = currentAge >= AGE_59_5 ? 0 : grossAmount * EARLY_WITHDRAWAL_PENALTY_RATE;
  const totalCost = incomeTax + penalty;
  const netCash = grossAmount - totalCost;

  const futureValueAt59_5 =
    yearsToRetirement > 0
      ? netCash * Math.pow(1 + annualReturn, yearsToRetirement)
      : netCash;

  return {
    incomeTax,
    penalty,
    totalCost,
    netCash,
    futureValueAt59_5,
    lostWealth: 0, // placeholder; set after Roth comparison is computed
  };
}

/**
 * Calculates Scenario B: Roth conversion with 5-year seasoning.
 *
 * Income tax is paid on the gross amount today (no penalty). The after-tax
 * amount goes into a Roth IRA. After the 5-year seasoning rule, the converted
 * principal becomes accessible. If the 5-year wait pushes past age 59.5,
 * accessibility is capped at 59.5 (diminishing the Roth advantage).
 *
 * @param grossAmount - Total 401(k) balance to convert
 * @param currentAge  - User's current age
 * @param currentTaxRate - Current marginal tax rate (decimal)
 * @param annualReturn - Expected annual market return (decimal)
 * @param yearsToRetirement - Years until user reaches age 59.5
 * @returns Detailed Roth conversion result
 */
function calculateRothConversion(
  grossAmount: number,
  currentAge: number,
  currentTaxRate: number,
  annualReturn: number,
  yearsToRetirement: number,
): RothConversionResult {
  const incomeTax = grossAmount * currentTaxRate;
  const penalty = 0;
  const amountConverted = grossAmount - incomeTax;

  // Accessible age is the earlier of (currentAge + 5) and 59.5
  const accessibleAge = Math.min(currentAge + ROTH_CONVERSION_WAIT_YEARS, AGE_59_5);
  const yearsToAccessible = Math.max(0, accessibleAge - currentAge);

  const valueAtAccessible =
    yearsToAccessible > 0
      ? amountConverted * Math.pow(1 + annualReturn, yearsToAccessible)
      : amountConverted;

  const valueAt59_5 =
    yearsToRetirement > 0
      ? amountConverted * Math.pow(1 + annualReturn, yearsToRetirement)
      : amountConverted;

  return {
    incomeTax,
    penalty,
    amountConverted,
    accessibleAge,
    valueAtAccessible,
    valueAt59_5,
  };
}

/**
 * Calculates Scenario C: leave funds in the 401(k) until age 59.5.
 *
 * The gross amount grows tax-deferred at the expected return until age 59.5.
 * At withdrawal, the full balance is taxed at the user's expected retirement
 * tax rate.
 *
 * @param grossAmount - Total 401(k) balance
 * @param annualReturn - Expected annual market return (decimal)
 * @param retirementTaxRate - Expected retirement marginal tax rate (decimal)
 * @param yearsToRetirement - Years until user reaches age 59.5
 * @returns Detailed 401(k) result
 */
function calculateLeftIn401k(
  grossAmount: number,
  annualReturn: number,
  retirementTaxRate: number,
  yearsToRetirement: number,
): LeftIn401kResult {
  const futureGrossValue =
    yearsToRetirement > 0
      ? grossAmount * Math.pow(1 + annualReturn, yearsToRetirement)
      : grossAmount;

  const futureTaxOwed = futureGrossValue * retirementTaxRate;
  const netCashAt59_5 = futureGrossValue - futureTaxOwed;

  return {
    futureGrossValue,
    futureTaxOwed,
    netCashAt59_5,
  };
}

/**
 * Builds a year-by-year projection timeline from today until the user reaches
 * age 59.5.
 *
 * For Scenario A (earlyWithdrawal), growth continues without cap since the
 * net cash is invested in a taxable account.
 *
 * For Scenario B (rothConversion) and Scenario C (leftIn401k), growth is
 * capped at `yearsToRetirement` — beyond age 59.5 the balances remain flat
 * since the comparison endpoint has been reached.
 *
 * @param grossAmount - Total 401(k) balance
 * @param currentAge  - User's current age
 * @param netCash - Net cash received from early withdrawal (Scenario A)
 * @param amountConverted - Amount converted to Roth (Scenario B)
 * @param annualReturn - Expected annual market return (decimal)
 * @param yearsToRetirement - Years until user reaches age 59.5
 * @returns Array of yearly timeline entries
 */
function buildTimeline(
  grossAmount: number,
  currentAge: number,
  netCash: number,
  amountConverted: number,
  annualReturn: number,
  yearsToRetirement: number,
): TimelineYear[] {
  const timeline: TimelineYear[] = [];
  const maxYears = Math.ceil(yearsToRetirement);

  for (let year = 0; year <= maxYears; year++) {
    const age = currentAge + year;

    // Scenario A: no cap — net cash keeps growing in taxable account
    const earlyWithdrawal = netCash * Math.pow(1 + annualReturn, year);

    // Scenario B & C: capped at yearsToRetirement
    const growthYears = Math.min(year, yearsToRetirement);
    const rothConversion = amountConverted * Math.pow(1 + annualReturn, growthYears);
    const leftIn401k = grossAmount * Math.pow(1 + annualReturn, growthYears);

    timeline.push({
      year,
      age,
      earlyWithdrawal,
      rothConversion,
      leftIn401k,
    });
  }

  return timeline;
}

// ──────────────────────────────────────────────
// Main Entry Point
// ──────────────────────────────────────────────

/**
 * Compares three financial paths for accessing traditional 401(k) funds
 * before age 59.5:
 *
 * **Scenario A — Immediate Early Withdrawal:**
 *   Pays income tax + 10% penalty today, invests the net cash in a taxable
 *   account, and lets it grow until age 59.5.
 *
 * **Scenario B — Roth Conversion:**
 *   Pays income tax today (no penalty), converts the after-tax amount to a
 *   Roth IRA, and accesses the principal penalty-free after 5 years (or at
 *   age 59.5, whichever comes first).
 *
 * **Scenario C — Leave in 401(k):**
 *   Lets the funds grow tax-deferred until age 59.5, then pays ordinary
 *   income tax at the expected retirement rate upon withdrawal.
 *
 * Returns a full comparison including per-scenario details, a year-by-year
 * projection timeline (suitable for charting), and a summary identifying
 * the wealth-maximizing path.
 *
 * @param input - The user's financial inputs
 * @returns A complete comparison of all three scenarios
 */
export function calculateEarlyPenaltyComparison(input: EarlyPenaltyInput): EarlyPenaltyComparison {
  const { grossAmount, currentAge, currentTaxRate, retirementTaxRate, annualReturn } = input;

  // ── Edge case: invalid inputs ──
  if (grossAmount <= 0 || currentAge < 18) {
    return getZeroResult(input);
  }

  // ── Core calculations ──
  const yearsToRetirement = Math.max(0, AGE_59_5 - currentAge);

  const earlyWithdrawal = calculateEarlyWithdrawal(
    grossAmount,
    currentAge,
    currentTaxRate,
    annualReturn,
    yearsToRetirement,
  );

  const rothConversion = calculateRothConversion(
    grossAmount,
    currentAge,
    currentTaxRate,
    annualReturn,
    yearsToRetirement,
  );

  const leftIn401k = calculateLeftIn401k(
    grossAmount,
    annualReturn,
    retirementTaxRate,
    yearsToRetirement,
  );

  // ── Summary computations ──
  const wealthDestroyedByEarlyWithdrawal =
    rothConversion.valueAt59_5 - earlyWithdrawal.futureValueAt59_5;

  const rothAdvantageOverTraditional =
    rothConversion.valueAt59_5 - leftIn401k.netCashAt59_5;

  const bestPath: 'early' | 'roth' | 'traditional' =
    rothConversion.valueAt59_5 >= earlyWithdrawal.futureValueAt59_5 &&
    rothConversion.valueAt59_5 >= leftIn401k.netCashAt59_5
      ? 'roth'
      : earlyWithdrawal.futureValueAt59_5 >= rothConversion.valueAt59_5 &&
        earlyWithdrawal.futureValueAt59_5 >= leftIn401k.netCashAt59_5
        ? 'early'
        : 'traditional';

  // Patch the lostWealth placeholder on the early withdrawal result
  earlyWithdrawal.lostWealth = wealthDestroyedByEarlyWithdrawal;

  // ── Timeline ──
  const timeline = buildTimeline(
    grossAmount,
    currentAge,
    earlyWithdrawal.netCash,
    rothConversion.amountConverted,
    annualReturn,
    yearsToRetirement,
  );

  return {
    input,
    earlyWithdrawal,
    rothConversion,
    leftIn401k,
    timeline,
    yearsToRetirement,
    summary: {
      bestPath,
      wealthDestroyedByEarlyWithdrawal,
      rothAdvantageOverTraditional,
    },
  };
}

// ──────────────────────────────────────────────
// Edge Case Helpers
// ──────────────────────────────────────────────

/**
 * Returns a zeroed-out result for invalid inputs (grossAmount <= 0 or
 * currentAge < 18). All monetary values are zero, the timeline is empty,
 * and the best path defaults to 'traditional' as a safe fallback.
 *
 * @param input - The original (invalid) input
 * @returns A safely typed but zeroed-out comparison result
 */
function getZeroResult(input: EarlyPenaltyInput): EarlyPenaltyComparison {
  const zeroEarly: EarlyWithdrawalResult = {
    incomeTax: 0,
    penalty: 0,
    totalCost: 0,
    netCash: 0,
    futureValueAt59_5: 0,
    lostWealth: 0,
  };

  const zeroRoth: RothConversionResult = {
    incomeTax: 0,
    penalty: 0,
    amountConverted: 0,
    accessibleAge: input.currentAge,
    valueAtAccessible: 0,
    valueAt59_5: 0,
  };

  const zeroLeft: LeftIn401kResult = {
    futureGrossValue: 0,
    futureTaxOwed: 0,
    netCashAt59_5: 0,
  };

  return {
    input,
    earlyWithdrawal: zeroEarly,
    rothConversion: zeroRoth,
    leftIn401k: zeroLeft,
    timeline: [],
    yearsToRetirement: Math.max(0, AGE_59_5 - input.currentAge),
    summary: {
      bestPath: 'traditional',
      wealthDestroyedByEarlyWithdrawal: 0,
      rothAdvantageOverTraditional: 0,
    },
  };
}

// ──────────────────────────────────────────────
// Formatting Helpers
// ──────────────────────────────────────────────

/**
 * Formats a numeric dollar value as a USD currency string.
 * Delegates to `formatCurrency` from `formatters.ts`.
 *
 * @param value - The dollar amount to format
 * @returns A formatted currency string (e.g., "$100,000")
 */
export function formatDollar(value: number): string {
  return formatCurrencyFn(value);
}

/**
 * Formats a percentage value as a percent string.
 * Delegates to `formatPercent` from `formatters.ts`.
 *
 * @param value - The percentage value (e.g., 24 for 24%)
 * @returns A formatted percent string (e.g., "24.0%")
 */
export function formatPercent(value: number): string {
  return formatPercentFn(value);
}
