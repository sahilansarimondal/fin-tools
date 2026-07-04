/**
 * HSA Shoebox Strategy — Calculation Engine
 *
 * Simulates two parallel financial paths for the HSA "Shoebox Strategy":
 *   - Path A (Immediate Reimbursement): Reimburse medical expenses each year,
 *     reducing the HSA balance available for compounding.
 *   - Path B (Delayed Reimbursement / Shoebox): Pay medical bills out-of-pocket,
 *     save the receipts, and let the HSA balance compound tax-free for the full
 *     delay horizon. Withdraw the accumulated receipt value tax-free at the end.
 *
 * Key insight: By deferring reimbursement, the HSA's tax-free growth compounds
 * on a larger principal, potentially producing a significant "growth bonus"
 * that more than offsets the out-of-pocket expenses.
 */

export interface HsaShoeboxInputs {
  /** Current HSA Balance in dollars ($0–$200,000, default $10,000) */
  currentBalance: number;
  /** Annual HSA Contribution in dollars ($0–$10,000, default $4,150) */
  annualContribution: number;
  /** Annual Out-of-Pocket Medical Expenses in dollars ($0–$15,000, default $1,500) */
  annualExpenses: number;
  /** Reimbursement Delay Horizon in years (5–40, default 20) */
  delayHorizon: number;
  /** Expected Annual Investment Growth Rate as percentage (1.0–12.0, default 7.0) */
  growthRate: number;
}

export interface YearData {
  year: number;
  /** Path A (Immediate Reimbursement) year-end balance */
  pathABalance: number;
  /** Path B (Delayed Reimbursement) year-end balance */
  pathBBalance: number;
}

export interface HsaShoeboxResults {
  /** Path A ending balance after N years */
  pathAFinalBalance: number;
  /** Path B ending balance after N years */
  pathBFinalBalance: number;
  /** Accumulated receipts value = E × N (tax-free withdrawal amount) */
  shoeboxValue: number;
  /** Growth bonus = Path B - Path A (the advantage of deferring reimbursement) */
  growthBonus: number;
  /** HSA balance remaining after reimbursing all saved receipts */
  netRemainingHSA: number;
  /** Year-by-year projection data for chart rendering */
  yearData: YearData[];
  /** True if annual expenses exceed what the HSA can cover in year 1 */
  hasExcessWarning: boolean;
}

export const HSA_SHOEBOX_DEFAULTS = {
  currentBalance: 10000,
  annualContribution: 4150,
  annualExpenses: 1500,
  delayHorizon: 20,
  growthRate: 7.0,
} as const;

export const HSA_SHOEBOX_LIMITS = {
  currentBalanceMin: 0,
  currentBalanceMax: 200000,
  annualContributionMin: 0,
  annualContributionMax: 10000,
  annualExpensesMin: 0,
  annualExpensesMax: 15000,
  delayHorizonMin: 5,
  delayHorizonMax: 40,
  growthRateMin: 1.0,
  growthRateMax: 12.0,
} as const;

/**
 * Clamps a value between an inclusive minimum and maximum.
 *
 * @param value - The number to clamp
 * @param min   - The lower bound
 * @param max   - The upper bound
 * @returns The clamped value
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculates the HSA Shoebox Strategy comparison projection.
 *
 * Runs a year-by-year simulation of two strategies over the delay horizon:
 *
 * **Path A — Immediate Reimbursement:**
 * Contributions are added and expenses are subtracted each year. If the
 * resulting principal is negative, it is floored to $0 (the HSA cannot go
 * negative). The remaining balance earns growth at rate `r`.
 *
 * **Path B — Delayed Reimbursement (Shoebox):**
 * Contributions are added each year but expenses are **not** subtracted.
 * The full balance compounds at rate `r` throughout the horizon. At the end,
 * receipts totalling `E × N` can be withdrawn tax-free.
 *
 * **Derived KPIs:**
 * - `shoeboxValue`: Total accumulated receipts (the tax-free withdrawal target).
 * - `growthBonus`: The extra ending wealth from deferring reimbursement.
 * - `netRemainingHSA`: HSA dollars left after paying all saved receipts.
 * - `hasExcessWarning`: Whether year-1 expenses exceed available HSA funds.
 *
 * @param inputs - The HSA Shoebox input parameters
 * @returns An HsaShoeboxResults object with final balances, KPIs, and chart data
 */
export function calculateHsaShoebox(inputs: HsaShoeboxInputs): HsaShoeboxResults {
  // --- Input Clamping & Validation ---

  // Treat negative inputs as zero, then clamp to defined ranges
  const rawCurrentBalance    = Math.max(0, inputs.currentBalance);
  const rawAnnualContribution = Math.max(0, inputs.annualContribution);
  const rawAnnualExpenses    = Math.max(0, inputs.annualExpenses);
  const rawDelayHorizon      = Math.max(0, inputs.delayHorizon);
  const rawGrowthRate        = Math.max(0, inputs.growthRate);

  const B0 = clamp(rawCurrentBalance,    HSA_SHOEBOX_LIMITS.currentBalanceMin,    HSA_SHOEBOX_LIMITS.currentBalanceMax);
  const C  = clamp(rawAnnualContribution, HSA_SHOEBOX_LIMITS.annualContributionMin, HSA_SHOEBOX_LIMITS.annualContributionMax);
  const E  = clamp(rawAnnualExpenses,    HSA_SHOEBOX_LIMITS.annualExpensesMin,    HSA_SHOEBOX_LIMITS.annualExpensesMax);
  const N  = clamp(rawDelayHorizon,      HSA_SHOEBOX_LIMITS.delayHorizonMin,      HSA_SHOEBOX_LIMITS.delayHorizonMax);
  const r  = clamp(rawGrowthRate,        HSA_SHOEBOX_LIMITS.growthRateMin,        HSA_SHOEBOX_LIMITS.growthRateMax) / 100;

  // --- Edge case: zero-year horizon produces no projection ---
  if (N === 0 || r === 0) {
    return {
      pathAFinalBalance: 0,
      pathBFinalBalance: 0,
      shoeboxValue: 0,
      growthBonus: 0,
      netRemainingHSA: 0,
      yearData: [],
      hasExcessWarning: E > (C + B0),
    };
  }

  // --- Excess Warning ---
  // Flag if the annual out-of-pocket expenses exceed what the HSA can cover
  // in year 1 (contribution + existing balance). This means the strategy is
  // infeasible without supplementary funds.
  const hasExcessWarning = E > (C + B0);

  // --- Year-by-Year Simulation ---

  const yearData: YearData[] = [];

  // Path A — Immediate Reimbursement
  // Path B — Delayed Reimbursement (Shoebox)
  let pathAPrincipal: number;
  let pathBPrincipal: number;

  // Year 1
  pathAPrincipal = B0 + C - E;
  if (pathAPrincipal < 0) pathAPrincipal = 0;
  let pathAEnding = pathAPrincipal * (1 + r);

  pathBPrincipal = B0 + C;
  let pathBEnding = pathBPrincipal * (1 + r);

  yearData.push({
    year: 1,
    pathABalance: parseFloat(pathAEnding.toFixed(2)),
    pathBBalance: parseFloat(pathBEnding.toFixed(2)),
  });

  // Years 2 through N
  for (let t = 2; t <= N; t++) {
    // Path A
    pathAPrincipal = pathAEnding + C - E;
    if (pathAPrincipal < 0) pathAPrincipal = 0;
    pathAEnding = pathAPrincipal * (1 + r);

    // Path B
    pathBPrincipal = pathBEnding + C;
    pathBEnding = pathBPrincipal * (1 + r);

    yearData.push({
      year: t,
      pathABalance: parseFloat(pathAEnding.toFixed(2)),
      pathBBalance: parseFloat(pathBEnding.toFixed(2)),
    });
  }

  // --- Final Results ---

  const pathAFinalBalance = yearData.length > 0
    ? yearData[yearData.length - 1].pathABalance
    : 0;
  const pathBFinalBalance = yearData.length > 0
    ? yearData[yearData.length - 1].pathBBalance
    : 0;

  // Total accumulated receipt value (the tax-free withdrawal amount)
  const shoeboxValue = E * N;

  // The advantage of deferring reimbursement — extra compounding on the expenses
  const growthBonus = parseFloat((pathBFinalBalance - pathAFinalBalance).toFixed(2));

  // Remaining HSA balance after reimbursing all saved receipts tax-free
  const netRemainingHSA = parseFloat(Math.max(0, pathBFinalBalance - shoeboxValue).toFixed(2));

  return {
    pathAFinalBalance: parseFloat(pathAFinalBalance.toFixed(2)),
    pathBFinalBalance: parseFloat(pathBFinalBalance.toFixed(2)),
    shoeboxValue: parseFloat(shoeboxValue.toFixed(2)),
    growthBonus,
    netRemainingHSA,
    yearData,
    hasExcessWarning,
  };
}
