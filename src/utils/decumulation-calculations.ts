/**
 * Die With Zero Decumulation Calculator — Calculation Engine
 *
 * Computes how much someone can safely spend each year in retirement
 * such that their portfolio is fully consumed by their estimated death age,
 * leaving only an optional end-of-life buffer.
 *
 * Supports linear (constant) and front-loaded (higher spend early) curves.
 */

export type SpendingCurve = 'linear' | 'front-loaded';

export type DecumulationInput = {
  /** Current age in years (e.g., 45) */
  currentAge: number;
  /** Expected age at death (e.g., 85) */
  estimatedDeathAge: number;
  /** Total portfolio value today (e.g., 1,200,000) */
  currentPortfolio: number;
  /** Expected annual real return after inflation as a percentage (e.g., 4) */
  expectedRealReturn: number;
  /** Target balance remaining at death age (e.g., 50000, defaults to 0) */
  endOfLifeBuffer: number;
  /** Spending curve: 'linear' (constant) or 'front-loaded' (more early, less late) */
  spendingCurve: SpendingCurve;
};

export type YearProjection = {
  /** Calendar age */
  age: number;
  /** Year index (0 = current year) */
  year: number;
  /** Portfolio balance at start of the year */
  startBalance: number;
  /** Growth earned during the year (startBalance * r) */
  growth: number;
  /** Amount spent during the year */
  annualSpend: number;
  /** Portfolio balance at end of the year after growth and spending */
  endBalance: number;
};

export type DecumulationResult = {
  /** The core output — flat annual withdrawal amount.
   *  For linear, this IS the constant spend each year.
   *  For front-loaded, this is the baseline; actual spend varies by phase. */
  annualSpend: number;
  /** Sum of all annualSpend values across the entire projection */
  totalLifetimeWealthConsumed: number;
  /** How much would remain at death age using the 4% rule instead */
  moneyLeftWithFourPercentRule: number;
  /** What the 4% rule would give as an annual spend (currentPortfolio * 0.04) */
  fourPercentRuleAnnualSpend: number;
  /** Number of years in retirement (estimatedDeathAge - currentAge) */
  yearsRemaining: number;
  /** Year-by-year projection array */
  projection: YearProjection[];
  /** Whether the front-loaded curve is active */
  isFrontLoaded: boolean;
};

/**
 * Returns the annual spend for a given age based on the spending curve.
 *
 * For 'linear': always returns baseAnnualSpend.
 * For 'front-loaded': divides retirement into 3 equal phases —
 *   Phase 1 (first third):   baseAnnualSpend * 1.20
 *   Phase 2 (middle third):  baseAnnualSpend
 *   Phase 3 (final third):   baseAnnualSpend * 0.80
 *
 * @param age - The age to get the spend for
 * @param baseAnnualSpend - The baseline annual spend
 * @param currentAge - Retirement start age
 * @param estimatedDeathAge - End age
 * @param curve - The spending curve type
 * @returns The annual spend for the given age
 */
export function getSpendingForAge(
  age: number,
  baseAnnualSpend: number,
  currentAge: number,
  estimatedDeathAge: number,
  curve: SpendingCurve,
): number {
  if (curve === 'linear') {
    return baseAnnualSpend;
  }

  const totalYears = estimatedDeathAge - currentAge;
  if (totalYears <= 0) return baseAnnualSpend;

  const yearIndex = age - currentAge;
  const phaseLength = totalYears / 3;
  const phase1End = Math.floor(phaseLength);
  const phase2End = Math.floor(2 * phaseLength);

  if (yearIndex < phase1End) {
    return baseAnnualSpend * 1.2;
  }
  if (yearIndex < phase2End) {
    return baseAnnualSpend;
  }
  return baseAnnualSpend * 0.8;
}

/**
 * Calculates the decumulation plan using a "Die with Zero" approach.
 *
 * Step A — Calculates the base flat annual spend using the PMT formula
 *          (present value with a future remaining balance).
 * Step B — Computes the 4% rule comparison.
 * Step C — Generates a year-by-year projection.
 * Step D — Computes total lifetime wealth consumed.
 *
 * @param input - The decumulation input parameters
 * @returns A DecumulationResult with all computed values
 */
export function calculateDecumulation(input: DecumulationInput): DecumulationResult {
  const {
    currentAge,
    estimatedDeathAge,
    currentPortfolio,
    expectedRealReturn,
    endOfLifeBuffer,
    spendingCurve,
  } = input;

  const n = estimatedDeathAge - currentAge;
  const r = expectedRealReturn / 100;
  const buffer = Math.max(endOfLifeBuffer, 0);

  // Edge cases
  if (n <= 0 || currentPortfolio <= 0) {
    const emptyProjection: YearProjection[] = [];
    if (n === 0 && currentPortfolio >= 0) {
      // Single year: just show the current portfolio
      emptyProjection.push({
        age: currentAge,
        year: 0,
        startBalance: currentPortfolio,
        growth: 0,
        annualSpend: 0,
        endBalance: Math.min(currentPortfolio, buffer),
      });
    }
    return {
      annualSpend: 0,
      totalLifetimeWealthConsumed: 0,
      moneyLeftWithFourPercentRule: 0,
      fourPercentRuleAnnualSpend: currentPortfolio * 0.04,
      yearsRemaining: Math.max(n, 0),
      projection: emptyProjection,
      isFrontLoaded: spendingCurve === 'front-loaded',
    };
  }

  // Step A — Calculate the base flat annual spend (PMT formula)
  let baseAnnualSpend: number;

  if (r === 0) {
    baseAnnualSpend = (currentPortfolio - buffer) / n;
  } else {
    const discountFactor = Math.pow(1 + r, n);
    const pvLessBuffer = currentPortfolio - buffer / discountFactor;
    const pmtFactor = r / (1 - 1 / discountFactor);
    baseAnnualSpend = pvLessBuffer * pmtFactor;
  }

  // Clamp to zero — if the buffer already consumes all wealth, spend nothing
  baseAnnualSpend = Math.max(baseAnnualSpend, 0);

  // Step B — Calculate the 4% rule comparison
  const fourPercentRuleAnnualSpend = currentPortfolio * 0.04;

  // Simulate the 4% rule year-by-year
  let fourPercentBalance = currentPortfolio;
  for (let i = 0; i < n; i++) {
    const growth = fourPercentBalance * r;
    fourPercentBalance = fourPercentBalance + growth - fourPercentRuleAnnualSpend;
    if (fourPercentBalance < 0) {
      fourPercentBalance = 0;
      break;
    }
  }
  const moneyLeftWithFourPercentRule = Math.max(fourPercentBalance, 0);

  // Step C — Generate year-by-year projection
  const projection: YearProjection[] = [];
  let prevEndBalance = currentPortfolio;
  let totalLifetimeWealthConsumed = 0;

  const phaseLength = n / 3;
  const phase1End = Math.floor(phaseLength);
  const phase2End = Math.floor(2 * phaseLength);

  for (let i = 0; i < n; i++) {
    const age = currentAge + i;
    const startBalance = i === 0 ? currentPortfolio : prevEndBalance;
    const growth = startBalance * r;

    // Determine the planned annual spend based on the spending curve
    let annualSpend: number;

    if (spendingCurve === 'front-loaded') {
      if (i < phase1End) {
        annualSpend = baseAnnualSpend * 1.2;
      } else if (i < phase2End) {
        annualSpend = baseAnnualSpend;
      } else {
        annualSpend = baseAnnualSpend * 0.8;
      }
    } else {
      annualSpend = baseAnnualSpend;
    }

    // On the final year, adjust spend to exactly hit the end-of-life buffer
    if (i === n - 1) {
      const requiredSpend = startBalance + growth - buffer;
      if (requiredSpend > 0) {
        annualSpend = requiredSpend;
      } else {
        // Can't even reach the buffer without growth; spend nothing
        annualSpend = 0;
      }
    }

    let endBalance = startBalance + growth - annualSpend;

    // Clamp endBalance to never go below 0
    endBalance = Math.max(endBalance, 0);

    projection.push({
      age,
      year: i,
      startBalance,
      growth,
      annualSpend,
      endBalance,
    });

    totalLifetimeWealthConsumed += annualSpend;
    prevEndBalance = endBalance;
  }

  // If n === 0 was already handled; for positive n, we have projection data
  return {
    annualSpend: baseAnnualSpend,
    totalLifetimeWealthConsumed,
    moneyLeftWithFourPercentRule,
    fourPercentRuleAnnualSpend,
    yearsRemaining: n,
    projection,
    isFrontLoaded: spendingCurve === 'front-loaded',
  };
}
