/**
 * seppMath.ts — 72(t) SEPP (Substantially Equal Periodic Payments) Calculator
 *
 * Pure TypeScript utility module for calculating IRS-approved SEPP distributions.
 * Zero UI dependencies. All rates are in decimal format (0.05 = 5%).
 *
 * References:
 *   - IRS Notice 2022-06 (Life Expectancy Table updates)
 *   - IRC Section 72(t) — Substantially Equal Periodic Payments
 *   - IRS Uniform Lifetime Table (Single Life Expectancy, post-2022)
 */

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface SEPPInput {
  accountBalance: number;    // $10,000 to $10,000,000
  currentAge: number;        // 20 to 59
  interestRate: number;      // decimal, e.g. 0.05 for 5%
  federalMidTermRate: number; // decimal, e.g. 0.045 for 4.5%
  growthRate: number;        // decimal, e.g. 0.07 for 7%
}

export interface SEPPYear {
  year: number;
  age: number;
  startingBalance: number;
  seppDistribution: number;
  growth: number;
  endingBalance: number;
}

export interface SEPPSchedule {
  method: 'rmd' | 'fixed-amortization' | 'fixed-annuitization';
  year1Payment: number;
  totalDistributions: number;
  duration: number;
  requiredYears: number;
  lockInAge: number;
  timeline: SEPPYear[];
}

export interface SEPPComparison {
  rmd: SEPPSchedule;
  fixedAmortization: SEPPSchedule;
  fixedAnnuitization: SEPPSchedule;
  duration: {
    yearsByAge: number;
    yearsByRule: number;
    requiredYears: number;
    lockInAge: number;
  };
  rateValidation: {
    valid: boolean;
    maxAllowed: number;
    message: string;
  };
}

// ──────────────────────────────────────────────
// IRS Life Expectancy Table (2022+, Notice 2022-06)
// ──────────────────────────────────────────────

/**
 * IRS Single Life Expectancy Table (post-2022, per Notice 2022-06).
 * Covers ages 30 through 60 from the official IRS Uniform Lifetime Table.
 *
 * For ages outside this range, the table is extrapolated using a ~1.0 year
 * decrease per year of age, with a floor of 5.0 years.
 */
const LIFE_EXPECTANCY_TABLE: Record<number, number> = {
  30: 53.3, 31: 52.3, 32: 51.4, 33: 50.4, 34: 49.4,
  35: 48.5, 36: 47.5, 37: 46.5, 38: 45.5, 39: 44.5,
  40: 43.6, 41: 42.6, 42: 41.6, 43: 40.6, 44: 39.6,
  45: 38.6, 46: 37.6, 47: 36.6, 48: 35.6, 49: 34.6,
  50: 33.7, 51: 32.7, 52: 31.7, 53: 30.7, 54: 29.7,
  55: 28.8, 56: 27.8, 57: 26.8, 58: 25.9, 59: 24.9,
  60: 23.9,
};

/** Extrapolation slope derived from the table trend (~1 year decrease per year of age). */
const EXTRAPOLATION_DECREASE_RATE = 1.0;

/** Minimum life expectancy floor to prevent nonsensical values at very high ages. */
const MIN_LIFE_EXPECTANCY = 5.0;

/**
 * Retrieves the IRS Single Life Expectancy factor for a given age.
 * Uses the official 2022+ table for ages 30-60 and extrapolates for ages
 * outside that range.
 *
 * **Assumptions:**
 * - Ages below 30 are extrapolated upward at ~1.0 year per year of age.
 * - Ages above 60 are extrapolated downward at ~1.0 year per year of age,
 *   with a hard floor at 5.0 years.
 * - Non-integer ages are floored before lookup (conservative for RMD purposes).
 *
 * @param age - The age to look up (non-negative number)
 * @returns The life expectancy factor in years
 */
export function getLifeExpectancy(age: number): number {
  if (age < 0) {
    return LIFE_EXPECTANCY_TABLE[30] + 30 * EXTRAPOLATION_DECREASE_RATE;
  }

  const flooredAge = Math.floor(age);

  // Direct lookup for ages 30–60
  if (flooredAge >= 30 && flooredAge <= 60) {
    return LIFE_EXPECTANCY_TABLE[flooredAge];
  }

  // Extrapolate for ages under 30 (going backward up the table)
  if (flooredAge < 30) {
    const yearsBelow = 30 - flooredAge;
    return LIFE_EXPECTANCY_TABLE[30] + yearsBelow * EXTRAPOLATION_DECREASE_RATE;
  }

  // Extrapolate for ages over 60 (continuing the downward trend)
  const yearsAbove = flooredAge - 60;
  return Math.max(
    LIFE_EXPECTANCY_TABLE[60] - yearsAbove * EXTRAPOLATION_DECREASE_RATE,
    MIN_LIFE_EXPECTANCY
  );
}

// ──────────────────────────────────────────────
// Interest Rate Validation
// ──────────────────────────────────────────────

/**
 * Validates the interest rate per IRS Notice 2022-06.
 *
 * The rate cannot exceed the **greater** of:
 *   - 5.0% (0.05 decimal), or
 *   - 120% of the Applicable Federal Mid-Term Rate (AFR)
 *
 * @param inputRate - The proposed interest rate (decimal, e.g. 0.05 for 5%)
 * @param federalMidTermRate - The current Applicable Federal Mid-Term Rate (decimal)
 * @returns Validation result with the maximum allowed rate and a descriptive message
 */
export function validateInterestRate(
  inputRate: number,
  federalMidTermRate: number
): { valid: boolean; maxAllowed: number; message: string } {
  const maxAllowed = Math.max(0.05, federalMidTermRate * 1.2);

  if (inputRate <= maxAllowed) {
    return {
      valid: true,
      maxAllowed,
      message: `Interest rate of ${(inputRate * 100).toFixed(2)}% is within the permitted maximum of ${(maxAllowed * 100).toFixed(2)}%.`,
    };
  }

  return {
    valid: false,
    maxAllowed,
    message: `Interest rate of ${(inputRate * 100).toFixed(2)}% exceeds the permitted maximum of ${(maxAllowed * 100).toFixed(2)}% (greater of 5.0% or 120% of the Federal Mid-Term Rate of ${(federalMidTermRate * 100).toFixed(2)}%).`,
  };
}

// ──────────────────────────────────────────────
// Duration Calculation
// ──────────────────────────────────────────────

/**
 * Calculates the mandatory SEPP duration per IRC Section 72(t).
 *
 * The SEPP schedule must last for the **longer** of:
 *   - 5 years, or
 *   - Until the account owner reaches age 59.5
 *
 * @param currentAge - The age at which SEPP distributions will begin
 * @returns Duration details including the number of years by each rule and the lock-in age
 */
export function calculateSEPPDuration(currentAge: number): {
  yearsByAge: number;
  yearsByRule: number;
  requiredYears: number;
  lockInAge: number;
} {
  const yearsByAge = Math.max(0, 59.5 - currentAge);
  const yearsByRule = 5;
  const requiredYears = Math.max(yearsByAge, yearsByRule);
  const lockInAge = currentAge + requiredYears;

  return { yearsByAge, yearsByRule, requiredYears, lockInAge };
}

// ──────────────────────────────────────────────
// Internal Helpers
// ──────────────────────────────────────────────

/**
 * Dollar formatter singleton for internal use.
 */
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/**
 * Builds a year-by-year SEPP projection timeline for a given method.
 *
 * Each year applies the configured growth rate to the starting balance, then
 * subtracts the distribution (either recalculated annually for RMD or fixed
 * for the amortization/annuitization methods).
 *
 * @param method - The SEPP method identifier
 * @param balance - Initial account balance
 * @param age - Starting age
 * @param growthRate - Annual growth rate (decimal)
 * @param fixedPayment - Fixed annual payment (null for RMD which recalculates each year)
 * @param totalYears - Number of years to project
 * @param requiredYears - Original required duration (float, from duration rules)
 * @param lockInAge - Age at which SEPP restrictions lift
 * @returns A complete SEPP schedule with timeline
 */
function buildTimeline(
  method: 'rmd' | 'fixed-amortization' | 'fixed-annuitization',
  balance: number,
  age: number,
  growthRate: number,
  fixedPayment: number | null,
  totalYears: number,
  requiredYears: number,
  lockInAge: number
): SEPPSchedule {
  const timeline: SEPPYear[] = [];
  let runningBalance = balance;
  let totalDistributions = 0;
  let year1Payment = 0;

  for (let year = 1; year <= totalYears; year++) {
    const currentAge = age + year - 1;
    const lifeExp = getLifeExpectancy(currentAge);

    // Determine distribution for this year
    const distribution =
      method === 'rmd' ? runningBalance / lifeExp : (fixedPayment ?? 0);

    if (year === 1) {
      year1Payment = distribution;
    }

    // Growth is applied to the starting balance, then distribution is subtracted
    const growth = runningBalance * growthRate;
    const endingBalance = Math.max(runningBalance + growth - distribution, 0);

    timeline.push({
      year,
      age: currentAge,
      startingBalance: runningBalance,
      seppDistribution: distribution,
      growth,
      endingBalance,
    });

    totalDistributions += distribution;
    runningBalance = endingBalance;
  }

  return {
    method,
    year1Payment,
    totalDistributions,
    duration: totalYears,
    requiredYears,
    lockInAge,
    timeline,
  };
}

// ──────────────────────────────────────────────
// Calculation Methods
// ──────────────────────────────────────────────

/**
 * **RMD Method** (Required Minimum Distribution)
 *
 * Annual Payment = Account Balance / Life Expectancy Factor
 *
 * Under this method, the distribution is recalculated each year based on the
 * current account balance and the owner's attained age. Payments will vary
 * year-to-year as the balance changes and life expectancy decreases.
 *
 * @param balance - Current account balance
 * @param age - Current age at which SEPP begins
 * @param growthRate - Annual growth rate (decimal, e.g. 0.07 for 7%)
 * @returns A full year-by-year SEPP schedule
 */
export function calculateRMD(
  balance: number,
  age: number,
  growthRate: number
): SEPPSchedule {
  const duration = calculateSEPPDuration(age);
  const totalYears = Math.ceil(duration.requiredYears);

  return buildTimeline(
    'rmd',
    balance,
    age,
    growthRate,
    null,
    totalYears,
    duration.requiredYears,
    duration.lockInAge
  );
}

/**
 * **Fixed Amortization Method**
 *
 * Annual Payment = Balance × (r × (1 + r)^n) / ((1 + r)^n - 1)
 *
 * Where:
 *   - r = annual interest rate (decimal)
 *   - n = life expectancy factor at the starting age
 *
 * This is the standard PMT formula used in loan amortization. It produces a
 * **level (fixed) payment** that remains constant for the entire SEPP duration.
 * The balance projection applies the growth rate to show how assets evolve.
 *
 * **Edge case:** When `interestRate` is 0, the formula simplifies to
 * `balance / n` to avoid division by zero.
 *
 * @param balance - Current account balance
 * @param age - Current age at which SEPP begins
 * @param interestRate - Annual interest rate (decimal, e.g. 0.05 for 5%)
 * @param growthRate - Annual growth rate for balance projection (decimal)
 * @returns A full year-by-year SEPP schedule
 */
export function calculateFixedAmortization(
  balance: number,
  age: number,
  interestRate: number,
  growthRate: number
): SEPPSchedule {
  const n = getLifeExpectancy(age);
  const duration = calculateSEPPDuration(age);
  const totalYears = Math.ceil(duration.requiredYears);

  let payment: number;
  if (interestRate === 0) {
    payment = balance / n;
  } else {
    const r = interestRate;
    payment = (balance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  return buildTimeline(
    'fixed-amortization',
    balance,
    age,
    growthRate,
    payment,
    totalYears,
    duration.requiredYears,
    duration.lockInAge
  );
}

/**
 * **Fixed Annuitization Method**
 *
 * Annual Payment = Account Balance / Annuity Factor
 *
 * Where the Annuity Factor (present value of an ordinary annuity of $1) is:
 *   (1 - (1 + r)^(-n)) / r
 *
 * With:
 *   - r = annual interest rate (decimal)
 *   - n = life expectancy factor at the starting age
 *
 * This method also produces a **level (fixed) payment** for the entire SEPP
 * duration. The payment is generally slightly higher than the Fixed
 * Amortization method because the annuity factor is smaller than the
 * amortization factor for the same inputs.
 *
 * **Edge case:** When `interestRate` is 0, the annuity factor approaches `n`,
 * so the formula simplifies to `balance / n` to avoid division by zero.
 *
 * @param balance - Current account balance
 * @param age - Current age at which SEPP begins
 * @param interestRate - Annual interest rate (decimal, e.g. 0.05 for 5%)
 * @param growthRate - Annual growth rate for balance projection (decimal)
 * @returns A full year-by-year SEPP schedule
 */
export function calculateFixedAnnuitization(
  balance: number,
  age: number,
  interestRate: number,
  growthRate: number
): SEPPSchedule {
  const n = getLifeExpectancy(age);
  const duration = calculateSEPPDuration(age);
  const totalYears = Math.ceil(duration.requiredYears);

  let payment: number;
  if (interestRate === 0) {
    payment = balance / n;
  } else {
    const r = interestRate;
    const annuityFactor = (1 - Math.pow(1 + r, -n)) / r;
    payment = balance / annuityFactor;
  }

  return buildTimeline(
    'fixed-annuitization',
    balance,
    age,
    growthRate,
    payment,
    totalYears,
    duration.requiredYears,
    duration.lockInAge
  );
}

// ──────────────────────────────────────────────
// Main Comparison Entry Point
// ──────────────────────────────────────────────

/**
 * Runs all three IRS-approved SEPP calculation methods and returns a
 * comprehensive comparison result.
 *
 * **Processing steps:**
 * 1. Validates the proposed interest rate against the Federal Mid-Term Rate
 * 2. Calculates the mandatory SEPP duration (max of 5 years or until 59.5)
 * 3. Computes year-by-year schedules for all three methods (RMD, Fixed
 *    Amortization, Fixed Annuitization)
 * 4. Returns a single `SEPPComparison` object containing everything
 *
 * @param input - Complete SEPP calculation inputs
 * @returns Comprehensive comparison of all three methods
 */
export function calculateSEPPComparison(input: SEPPInput): SEPPComparison {
  const { accountBalance, currentAge, interestRate, federalMidTermRate, growthRate } = input;

  const rateValidation = validateInterestRate(interestRate, federalMidTermRate);
  const duration = calculateSEPPDuration(currentAge);

  const rmd = calculateRMD(accountBalance, currentAge, growthRate);
  const fixedAmortization = calculateFixedAmortization(
    accountBalance,
    currentAge,
    interestRate,
    growthRate
  );
  const fixedAnnuitization = calculateFixedAnnuitization(
    accountBalance,
    currentAge,
    interestRate,
    growthRate
  );

  return {
    rmd,
    fixedAmortization,
    fixedAnnuitization,
    duration,
    rateValidation,
  };
}

// ──────────────────────────────────────────────
// Formatting Helper
// ──────────────────────────────────────────────

/**
 * Formats a numeric value as a USD currency string.
 *
 * Uses `Intl.NumberFormat` with full precision (2 decimal places) for
 * accurate dollar-and-cent display.
 *
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatDollar(value: number): string {
  return currencyFormatter.format(value);
}
