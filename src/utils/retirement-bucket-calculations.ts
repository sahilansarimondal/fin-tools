/**
 * Retirement Bucket Strategy Simulator
 *
 * Implements a 3-bucket withdrawal strategy simulation:
 *   Bucket 1 (Cash Buffer)    — years 1-3 of spending
 *   Bucket 2 (Bonds/Income)   — years 4-8 of spending
 *   Bucket 3 (Stocks/Growth)  — everything else
 *
 * Each year: spend from cash first, then bonds, then stocks.
 * After spending and growth, replenish buckets (waterfall: bonds → cash, stocks → bonds).
 * Pure deterministic math — no side effects, no DOM, no Chart.js.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BucketInput = {
  portfolioValue: number;   // Total portfolio at start, e.g. 1000000
  annualSpending: number;   // Desired annual spending (inflation-adjusted), e.g. 40000
  bucket1Years: number;     // Years of spending in Cash Buffer (1-5, default 3)
  bucket2Years: number;     // Years of spending in Bonds/Income (2-10, default 5)
  bucket1Rate: number;      // Cash yield % (default 2.0)
  bucket2Rate: number;      // Bond yield % (default 4.0)
  bucket3Rate: number;      // Stock yield % (default 7.0)
  inflation: number;        // Annual inflation % (default 2.5)
  simulationYears: number;  // Always 30
};

export type BucketState = {
  year: number;
  bucket1: number;  // Cash
  bucket2: number;  // Bonds
  bucket3: number;  // Stocks
  total: number;
  spending: number; // Inflation-adjusted spending for this year
};

export type BucketResult = {
  // Initial allocation (Year 0)
  initialB1: number;
  initialB2: number;
  initialB3: number;
  warningMessage: string | null; // Set if portfolio too small for target allocation

  // Simulation results
  timeline: BucketState[];  // Year 0 through Year 30 (or until depletion)
  depleted: boolean;
  depletionYear: number | null;  // null if runs full 30 years

  // Summary metrics
  totalReturnGenerated: number;
  finalB3Size: number;   // Final growth portfolio size
  yearsLasted: number;
};

// ---------------------------------------------------------------------------
// Calculation Engine
// ---------------------------------------------------------------------------

export function calculateBucketStrategy(input: BucketInput): BucketResult {
  // ---- Clamp inputs to reasonable ranges ----
  const b1Years = Math.max(1, Math.min(5, input.bucket1Years));
  const b2Years = Math.max(2, Math.min(10, input.bucket2Years));
  const b1Rate = input.bucket1Rate;
  const b2Rate = input.bucket2Rate;
  const b3Rate = input.bucket3Rate;
  const inflation = input.inflation;
  const portfolioValue = Math.max(0, input.portfolioValue);
  const annualSpending = Math.max(0, input.annualSpending);
  const simYears = Math.max(0, input.simulationYears);

  // -----------------------------------------------------------------------
  // Step 1: Calculate Initial Allocation (Year 0)
  // -----------------------------------------------------------------------
  let b1Target = annualSpending * b1Years;
  let b2Target = annualSpending * b2Years;
  let b3Target = Math.max(0, portfolioValue - b1Target - b2Target);

  let warningMessage: string | null = null;

  // Edge case: total safe-buffer target exceeds portfolio
  if (b1Target + b2Target > portfolioValue) {
    // First try scaling down b2 so that b1 + b2 = portfolio
    if (b1Target <= portfolioValue) {
      b2Target = portfolioValue - b1Target;
    } else {
      // b1Target alone exceeds portfolio — cap b1 to portfolio, b2 to 0
      b1Target = portfolioValue;
      b2Target = 0;
    }
    b3Target = 0;
    warningMessage =
      "Your portfolio is too small to fully fund the safe buffer buckets at the selected spending rate. Buckets have been proportionally reduced.";
  }

  // Record initial allocation (Year 0)
  const timeline: BucketState[] = [];
  let bucket1 = b1Target;
  let bucket2 = b2Target;
  let bucket3 = b3Target;
  let total = bucket1 + bucket2 + bucket3;

  timeline.push({
    year: 0,
    bucket1: roundDollar(bucket1),
    bucket2: roundDollar(bucket2),
    bucket3: roundDollar(bucket3),
    total: roundDollar(total),
    spending: 0,
  });

  // -----------------------------------------------------------------------
  // Step 2: Year-by-Year Simulation (Years 1 to simYears)
  // -----------------------------------------------------------------------
  let depleted = false;
  let depletionYear: number | null = null;
  let totalReturnGenerated = 0;

  for (let t = 1; t <= simYears; t++) {
    // 2.0: Inflation-adjusted spending for this year
    const spendingThisYear = annualSpending * Math.pow(1 + inflation / 100, t - 1);

    // If there's nothing left, we're done
    if (total <= 0) {
      depleted = true;
      depletionYear = t - 1;
      // Push a zeroed-out state for this year and stop
      timeline.push({
        year: t,
        bucket1: 0,
        bucket2: 0,
        bucket3: 0,
        total: 0,
        spending: roundDollar(spendingThisYear),
      });
      break;
    }

    // ---- Step A: Take spending from Bucket 1 first, then 2, then 3 ----
    let remainingSpend = spendingThisYear;

    // Spend from Bucket 1
    const fromBucket1 = Math.min(remainingSpend, bucket1);
    bucket1 -= fromBucket1;
    remainingSpend -= fromBucket1;

    // Spend from Bucket 2 if needed
    if (remainingSpend > 0) {
      const fromBucket2 = Math.min(remainingSpend, bucket2);
      bucket2 -= fromBucket2;
      remainingSpend -= fromBucket2;
    }

    // Spend from Bucket 3 if needed
    if (remainingSpend > 0) {
      const fromBucket3 = Math.min(remainingSpend, bucket3);
      bucket3 -= fromBucket3;
      remainingSpend -= fromBucket3;
    }

    // Safety clamp (should not happen, but protects against floating-point drift)
    bucket1 = Math.max(0, bucket1);
    bucket2 = Math.max(0, bucket2);
    bucket3 = Math.max(0, bucket3);

    // ---- Step B: Apply annual yield/growth (end of year) ----
    const b3Growth = bucket3 * (b3Rate / 100);
    totalReturnGenerated += b3Growth;

    bucket1 = bucket1 * (1 + b1Rate / 100);
    bucket2 = bucket2 * (1 + b2Rate / 100);
    bucket3 = bucket3 * (1 + b3Rate / 100);

    // ---- Step C: Waterfall replenishment / rebalancing ----
    // Calculate next year's targets (based on NEXT year's spending)
    const spendingNextYear =
      annualSpending * Math.pow(1 + inflation / 100, t); // (t) because we already offset by -1 for current year

    const b1TargetNext = spendingNextYear * b1Years;
    const b2TargetNext = spendingNextYear * b2Years;

    // C.1: If Bucket 1 is below target, refill from Bucket 2
    if (bucket1 < b1TargetNext && bucket2 > 0) {
      const deficit1 = b1TargetNext - bucket1;
      const transferFrom2 = Math.min(deficit1, bucket2);
      bucket1 += transferFrom2;
      bucket2 -= transferFrom2;
    }

    // C.2: If Bucket 2 is below target, refill from Bucket 3
    if (bucket2 < b2TargetNext && bucket3 > 0) {
      const deficit2 = b2TargetNext - bucket2;
      const transferFrom3 = Math.min(deficit2, bucket3);
      bucket2 += transferFrom3;
      bucket3 -= transferFrom3;
    }

    // Safety clamps after transfers
    bucket1 = Math.max(0, bucket1);
    bucket2 = Math.max(0, bucket2);
    bucket3 = Math.max(0, bucket3);

    total = bucket1 + bucket2 + bucket3;

    // ---- Record year-end state ----
    timeline.push({
      year: t,
      bucket1: roundDollar(bucket1),
      bucket2: roundDollar(bucket2),
      bucket3: roundDollar(bucket3),
      total: roundDollar(total),
      spending: roundDollar(spendingThisYear),
    });

    // ---- Depletion check ----
    if (total <= 0) {
      depleted = true;
      depletionYear = t;
      break;
    }
  }

  // If we never depleted but stopped early (e.g., simulationYears is 0), adjust
  if (!depleted && timeline.length > 0) {
    const lastEntry = timeline[timeline.length - 1];
    if (lastEntry.total <= 0) {
      depleted = true;
      depletionYear = lastEntry.year;
    }
  }

  // -----------------------------------------------------------------------
  // Step 3: Summary Metrics
  // -----------------------------------------------------------------------
  const finalState = timeline[timeline.length - 1];
  const finalB3Size = finalState ? Math.max(0, finalState.bucket3) : 0;
  const yearsLasted = depletionYear ?? simYears;

  return {
    initialB1: roundDollar(b1Target),
    initialB2: roundDollar(b2Target),
    initialB3: roundDollar(b3Target),
    warningMessage,
    timeline,
    depleted,
    depletionYear,
    totalReturnGenerated: roundDollar(totalReturnGenerated),
    finalB3Size: roundDollar(finalB3Size),
    yearsLasted,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Round a number to the nearest whole dollar for display purposes.
 * Internal calculations keep full precision; only display values are rounded.
 */
function roundDollar(value: number): number {
  return Math.round(value);
}
