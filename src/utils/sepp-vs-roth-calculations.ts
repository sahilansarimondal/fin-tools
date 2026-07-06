/**
 * sepp-vs-roth-calculations.ts — 72(t) SEPP vs. Roth Conversion Ladder Calculator
 *
 * Pure TypeScript utility module comparing two IRS-approved early retirement
 * withdrawal strategies. Zero UI dependencies. All rates in decimal format (0.05 = 5%).
 *
 * References:
 *   - IRC Section 72(t) — Substantially Equal Periodic Payments
 *   - IRS Notice 2022-6 (raised 72(t) interest rate limit to 5%)
 *   - Roth Conversion 5-Year Rule (IRC §408A(d)(3)(F))
 */

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ComparisonInput {
  currentAge: number;
  preTaxBalance: number;
  interestRate: number;   // decimal, e.g. 0.05 for 5%
  bridgeBalance: number;  // taxable account cash
}

export interface SEPPResult {
  annualPayout: number;
  lifeExpectancy: number;
  pvaf: number;
  lockupYears: number;
  lockupAge: number;
}

export interface RothResult {
  targetAnnualIncome: number;
  bridgeRequirement: number;
  bridgeShortfall: number; // negative = shortfall, positive = surplus
  hasSurplus: boolean;
}

export interface ComparisonResult {
  sepp: SEPPResult;
  roth: RothResult;
}

// ──────────────────────────────────────────────
// IRS Single Life Expectancy Table (Ages 40–59)
// Source: IRS Publication 590-B, Table I (Uniform Lifetime Table)
// ──────────────────────────────────────────────

const LIFE_EXPECTANCY_TABLE: Record<number, number> = {
  40: 45.7, 41: 44.8, 42: 43.8, 43: 42.9, 44: 41.9,
  45: 41.0, 46: 40.0, 47: 39.0, 48: 38.1, 49: 37.1,
  50: 36.2, 51: 35.3, 52: 34.3, 53: 33.4, 54: 32.5,
  55: 31.6, 56: 30.6, 57: 29.8, 58: 28.9, 59: 28.0,
};

/**
 * Retrieves the IRS life expectancy factor for a given age.
 * Clamps to table range (40-59).
 */
function getLifeExpectancy(age: number): number {
  const clampedAge = Math.max(40, Math.min(59, Math.floor(age)));
  return LIFE_EXPECTANCY_TABLE[clampedAge];
}

// ──────────────────────────────────────────────
// Part A: 72(t) SEPP Calculation (Fixed Amortization)
// ──────────────────────────────────────────────

/**
 * Calculates the 72(t) SEPP annual payout using the Fixed Amortization method.
 *
 * Step 1: Determine life expectancy factor from IRS table
 * Step 2: Calculate Present Value Annuity Factor (PVAF) = (1 - (1+i)^-n) / i
 * Step 3: Annual Payment = Balance / PVAF
 * Step 4: Lock-up period = max(59.5 - currentAge, 5)
 */
function calculateSEPP(balance: number, age: number, interestRate: number): SEPPResult {
  const n = getLifeExpectancy(age);
  const i = interestRate;

  // PVAF = (1 - (1 + i)^-n) / i
  let pvaf: number;
  if (i === 0) {
    pvaf = n;
  } else {
    pvaf = (1 - Math.pow(1 + i, -n)) / i;
  }

  const annualPayout = balance / pvaf;

  const yearsByAge = Math.max(0, 59.5 - age);
  const lockupYears = Math.max(yearsByAge, 5);
  const lockupAge = age + lockupYears;

  return {
    annualPayout,
    lifeExpectancy: n,
    pvaf,
    lockupYears,
    lockupAge,
  };
}

// ──────────────────────────────────────────────
// Part B: Roth Conversion Ladder Calculation
// ──────────────────────────────────────────────

/**
 * Calculates the Roth Conversion Ladder bridge requirements.
 *
 * Step 1: Target income = 72(t) annual payout (apples-to-apples comparison)
 * Step 2: Bridge requirement = target × 5 (5-year rule)
 * Step 3: Shortfall = bridgeBalance - bridgeRequirement
 */
function calculateRothLadder(
  targetAnnualIncome: number,
  bridgeBalance: number
): RothResult {
  const bridgeRequirement = targetAnnualIncome * 5;
  const bridgeShortfall = bridgeBalance - bridgeRequirement;

  return {
    targetAnnualIncome,
    bridgeRequirement,
    bridgeShortfall,
    hasSurplus: bridgeShortfall >= 0,
  };
}

// ──────────────────────────────────────────────
// Main Entry Point
// ──────────────────────────────────────────────

export function calculateComparison(input: ComparisonInput): ComparisonResult {
  const { currentAge, preTaxBalance, interestRate, bridgeBalance } = input;

  const sepp = calculateSEPP(preTaxBalance, currentAge, interestRate);
  const roth = calculateRothLadder(sepp.annualPayout, bridgeBalance);

  return { sepp, roth };
}

// ──────────────────────────────────────────────
// Formatting Helpers
// ──────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatDollar(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDollarDetailed(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
