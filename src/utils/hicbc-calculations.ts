/**
 * High Income Child Benefit Charge (HICBC) — Calculation Engine
 *
 * Calculates the UK High Income Child Benefit Charge, which claws back
 * Child Benefit from taxpayers whose Adjusted Net Income (ANI) exceeds
 * £60,000. The charge is tapered at 1% per £160 of income above the
 * threshold, reaching full clawback at £80,000.
 *
 * References:
 *   - HMRC: High Income Child Benefit Charge
 *   - gov.uk/child-benefit-tax-charge
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Weekly Child Benefit rate for the eldest or only child (GBP) */
export const FIRST_CHILD_WEEKLY = 25.60;

/** Weekly Child Benefit rate for each additional child (GBP) */
export const ADDITIONAL_CHILD_WEEKLY = 16.95;

/** Number of weeks in a year */
export const WEEKS_PER_YEAR = 52;

/** Income threshold at which the HICBC begins to apply (GBP) */
export const HICBC_THRESHOLD = 60000;

/** Income limit above which the full charge applies (GBP) */
export const HICBC_TAPER_LIMIT = 80000;

/** Income increment per 1% of clawback (GBP per percentage point) */
export const TAPER_INTERVAL = 160;

/** Gross-up multiplier for Gift Aid donations (reciprocal of 0.8 basic rate) */
export const GIFT_AID_GROSS_MULTIPLIER = 1.25;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface HicbcInputs {
  /** Gross annual salary in GBP (£30,000–£150,000, default 68,000) */
  grossSalary: number;
  /** Number of children for whom Child Benefit is claimed (1–10, default 2) */
  numberOfChildren: number;
  /** Annual pension contributions in GBP (£0–£60,000, default 0) */
  pensionContributions: number;
  /** Annual Gift Aid donations in GBP (£0–£10,000, default 0) */
  giftAidDonations: number;
}

export interface HicbcResults {
  /** Total annual Child Benefit entitlement in GBP */
  totalChildBenefit: number;
  /** Adjusted Net Income after deducting pension and grossed-up Gift Aid */
  adjustedNetIncome: number;
  /** HICBC tax charge amount in GBP */
  hicbcCharge: number;
  /** Percentage of Child Benefit clawed back (0–100) */
  clawbackPercentage: number;
  /** Net retained benefit after HICBC (Child Benefit minus charge) */
  netRetainedBenefit: number;
  /** Pension contribution (in GBP) needed to reduce ANI to £60,000 threshold */
  optimizationTarget: number;
  /** True if Adjusted Net Income ≤ £60,000 (no charge) */
  isBelowThreshold: boolean;
  /** True if Adjusted Net Income ≥ £80,000 (full clawback) */
  isFullClawback: boolean;
  /** Combined marginal effective tax rate in the clawback zone (percentage) */
  marginalEffectiveRate: number;
  /** Data points for the clawback visualisation chart */
  clawbackCurveData: Array<{ income: number; charge: number; retained: number }>;
}

// ---------------------------------------------------------------------------
// Pure Calculation Functions
// ---------------------------------------------------------------------------

/**
 * Calculates the total annual Child Benefit entitlement.
 *
 * The eldest (or only) child receives the higher weekly rate; all subsequent
 * children receive the lower additional rate.
 *
 * @param numberOfChildren - Number of eligible children (1–10)
 * @returns Annual Child Benefit total in GBP
 *
 * @example
 * calculateTotalChildBenefit(1) // => 1331.20
 * calculateTotalChildBenefit(2) // => 2212.60
 */
export function calculateTotalChildBenefit(numberOfChildren: number): number {
  const count = Math.max(0, Math.floor(numberOfChildren));

  if (count === 0) {
    return 0;
  }

  const firstChildAmount = FIRST_CHILD_WEEKLY * WEEKS_PER_YEAR;
  const additionalChildrenAmount = (count - 1) * ADDITIONAL_CHILD_WEEKLY * WEEKS_PER_YEAR;

  return firstChildAmount + additionalChildrenAmount;
}

/**
 * Calculates the Adjusted Net Income (ANI) for HICBC purposes.
 *
 * ANI is gross salary minus pension contributions and grossed-up Gift Aid
 * donations. The result is clamped to a minimum of £0.
 *
 * Gift Aid donations are grossed up because the charity reclaims the basic
 * rate tax, meaning the donor must add back the deemed tax relief.
 *
 * @param grossSalary         - Gross annual salary in GBP
 * @param pensionContributions - Annual pension contributions in GBP
 * @param giftAidDonations    - Annual Gift Aid donations in GBP
 * @returns Adjusted Net Income in GBP (≥ 0)
 */
export function calculateAdjustedNetIncome(
  grossSalary: number,
  pensionContributions: number,
  giftAidDonations: number,
): number {
  const grossedUpGiftAid = giftAidDonations * GIFT_AID_GROSS_MULTIPLIER;
  const ani = grossSalary - pensionContributions - grossedUpGiftAid;
  return Math.max(0, ani);
}

/**
 * Calculates the HICBC tax charge.
 *
 * - If ANI ≤ £60,000: no charge (clawback = 0%).
 * - If ANI ≥ £80,000: full charge (clawback = 100% of Child Benefit).
 * - If £60,000 < ANI < £80,000: tapered at 1% for every £160 above the
 *   threshold.
 *
 * The charge is capped at the total Child Benefit amount.
 *
 * @param adjustedNetIncome - The taxpayer's Adjusted Net Income in GBP
 * @param totalChildBenefit - The total annual Child Benefit entitlement in GBP
 * @returns The HICBC charge amount in GBP
 */
export function calculateHicbcCharge(
  adjustedNetIncome: number,
  totalChildBenefit: number,
): number {
  // No entitlement means no charge
  if (totalChildBenefit <= 0) {
    return 0;
  }

  // Below the threshold — no charge
  if (adjustedNetIncome <= HICBC_THRESHOLD) {
    return 0;
  }

  // At or above the taper limit — full clawback
  if (adjustedNetIncome >= HICBC_TAPER_LIMIT) {
    return totalChildBenefit;
  }

  // In the taper zone: 1% per £160 above £60,000
  const excess = adjustedNetIncome - HICBC_THRESHOLD;
  const percentageSteps = Math.floor(excess / TAPER_INTERVAL);
  const clawbackPercent = percentageSteps * 0.01; // Convert steps to decimal

  const charge = totalChildBenefit * clawbackPercent;

  // Clamp to the total Child Benefit amount
  return Math.min(charge, totalChildBenefit);
}

/**
 * Calculates the pension contribution needed to reduce Adjusted Net Income
 * to the HICBC threshold of £60,000, thereby eliminating the charge entirely.
 *
 * If ANI is already ≤ £60,000, the target is £0.
 *
 * @param adjustedNetIncome - The taxpayer's Adjusted Net Income in GBP
 * @returns The pension contribution (GBP) required to reach the threshold
 */
export function calculateOptimizationTarget(adjustedNetIncome: number): number {
  return Math.max(0, adjustedNetIncome - HICBC_THRESHOLD);
}

/**
 * Calculates the marginal effective tax rate (METR) based on income bracket.
 *
 * In the HICBC clawback zone (£60k–£80k), the combined marginal rate includes:
 * - Income tax: 40% (higher rate)
 * - Employee National Insurance: 2% (above Upper Earnings Limit)
 * - HICBC clawback: (£1 / £160 per step) × 1% = 0.625% per pound
 * - Combined: ~42.625%
 *
 * Above £100,000, the Personal Allowance taper adds another ~20% (up to £125k),
 * giving an effective rate of ~62% in that band.
 *
 * @param adjustedNetIncome - The taxpayer's Adjusted Net Income in GBP
 * @returns The marginal effective tax rate as a percentage (e.g. 42.625 for 42.625%)
 */
export function calculateMarginalEffectiveRate(adjustedNetIncome: number): number {
  if (adjustedNetIncome <= HICBC_THRESHOLD) {
    return 20; // Basic rate — no HICBC
  }

  if (adjustedNetIncome <= 100000) {
    // Higher rate (40%) + NI (2%) + HICBC clawback (0.625%)
    return 42.625;
  }

  // Above £100,000 — additional rate + NI + HICBC + Personal Allowance taper
  // Up to £125,140 this includes the 60% effective rate from allowance taper
  return 62;
}

/**
 * Generates clawback curve data points for visualisation.
 *
 * Produces an array of { income, charge, retained } objects from £55,000
 * to £85,000 in £500 increments, covering the full taper range plus buffer
 * on both sides.
 *
 * @param totalChildBenefit - The total annual Child Benefit entitlement in GBP
 * @returns An array of data points for the clawback chart
 */
export function generateClawbackCurveData(
  totalChildBenefit: number,
): Array<{ income: number; charge: number; retained: number }> {
  const data: Array<{ income: number; charge: number; retained: number }> = [];
  const start = 55000;
  const end = 85000;
  const step = 500;

  for (let income = start; income <= end; income += step) {
    const charge = calculateHicbcCharge(income, totalChildBenefit);
    const retained = totalChildBenefit - charge;
    data.push({
      income,
      charge: Math.max(0, charge),
      retained: Math.max(0, retained),
    });
  }

  return data;
}

/**
 * Calculates the clawback percentage (0–100) of Child Benefit that is
 * reclaimed by the HICBC.
 *
 * @param adjustedNetIncome - The taxpayer's Adjusted Net Income in GBP
 * @param totalChildBenefit - The total annual Child Benefit entitlement in GBP
 * @returns The clawback percentage, clamped to 0–100
 */
function calculateClawbackPercentage(
  adjustedNetIncome: number,
  totalChildBenefit: number,
): number {
  if (totalChildBenefit <= 0 || adjustedNetIncome <= HICBC_THRESHOLD) {
    return 0;
  }

  if (adjustedNetIncome >= HICBC_TAPER_LIMIT) {
    return 100;
  }

  const excess = adjustedNetIncome - HICBC_THRESHOLD;
  const percentageSteps = Math.floor(excess / TAPER_INTERVAL);
  const clawbackPercent = percentageSteps; // Each step = 1%

  return Math.min(100, Math.max(0, clawbackPercent));
}

// ---------------------------------------------------------------------------
// Main Orchestrator
// ---------------------------------------------------------------------------

/**
 * Main orchestrator function for the High Income Child Benefit Charge.
 *
 * Accepts all user inputs and returns a complete results object with the
 * total Child Benefit, adjusted net income, HICBC charge, clawback
 * percentage, net retained benefit, optimisation target, marginal effective
 * rate, and clawback curve data for visualisation.
 *
 * @param inputs - The HICBC input parameters
 * @returns A complete HicbcResults object
 *
 * @example
 * const result = calculateHicbc({
 *   grossSalary: 68000,
 *   numberOfChildren: 2,
 *   pensionContributions: 0,
 *   giftAidDonations: 0,
 * });
 */
export function calculateHicbc(inputs: HicbcInputs): HicbcResults {
  const { grossSalary, numberOfChildren, pensionContributions, giftAidDonations } = inputs;

  // Clamp inputs to sensible ranges
  const safeChildren = Math.max(0, Math.min(10, Math.floor(numberOfChildren || 0)));
  const safeSalary = Math.max(0, grossSalary || 0);
  const safePension = Math.max(0, pensionContributions || 0);
  const safeGiftAid = Math.max(0, giftAidDonations || 0);

  // Core calculations
  const totalChildBenefit = calculateTotalChildBenefit(safeChildren);
  const adjustedNetIncome = calculateAdjustedNetIncome(safeSalary, safePension, safeGiftAid);
  const hicbcCharge = calculateHicbcCharge(adjustedNetIncome, totalChildBenefit);
  const clawbackPercentage = calculateClawbackPercentage(adjustedNetIncome, totalChildBenefit);
  const netRetainedBenefit = Math.max(0, totalChildBenefit - hicbcCharge);
  const optimizationTarget = calculateOptimizationTarget(adjustedNetIncome);
  const marginalEffectiveRate = calculateMarginalEffectiveRate(adjustedNetIncome);
  const isBelowThreshold = adjustedNetIncome <= HICBC_THRESHOLD;
  const isFullClawback = adjustedNetIncome >= HICBC_TAPER_LIMIT;
  const clawbackCurveData = generateClawbackCurveData(totalChildBenefit);

  return {
    totalChildBenefit,
    adjustedNetIncome,
    hicbcCharge,
    clawbackPercentage,
    netRetainedBenefit,
    optimizationTarget,
    isBelowThreshold,
    isFullClawback,
    marginalEffectiveRate,
    clawbackCurveData,
  };
}
