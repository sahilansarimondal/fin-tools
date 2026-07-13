/**
 * US Bonus Withholding Tax Calculator — Calculation Engine
 *
 * Calculates federal income tax (percentage or aggregate method),
 * Social Security, and Medicare withholding on US supplemental wages
 * using projected 2026 IRS rules.
 */

export type FilingStatus = 'single' | 'married' | 'headOfHousehold';
export type CalculationMethod = 'percentage' | 'aggregate';

export interface BonusTaxInput {
  grossBonus: number;
  ytdEarnings: number;
  method: CalculationMethod;
  regularPay?: number;
  filingStatus?: FilingStatus;
  payFrequency?: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
}

export interface BonusTaxResult {
  grossBonus: number;
  federalWithholding: number;
  federalEffectiveRate: number;
  socialSecurityWithholding: number;
  socialSecurityTaxable: number;
  medicareWithholding: number;
  medicareEffectiveRate: number;
  additionalMedicare: number;
  totalTaxes: number;
  totalEffectiveRate: number;
  netPayout: number;
  method: CalculationMethod;
  breakdown: {
    federalTaxableBonus: number;
    federalRate: string;
    ssCapped: boolean;
    ssWageBase: number;
    additionalMedicareApplies: boolean;
    additionalMedicareThreshold: number;
    aggregateTaxOnRegular?: number;
    aggregateTaxOnCombined?: number;
  };
}

// --- Constants ---

const SS_WAGE_BASE = 184_500;
const SS_RATE = 0.062;
const MEDICARE_BASE_RATE = 0.0145;
const ADDITIONAL_MEDICARE_RATE = 0.009;

const ADDITIONAL_MEDICARE_THRESHOLDS: Record<FilingStatus, number> = {
  single: 200_000,
  married: 250_000,
  headOfHousehold: 200_000,
};

const PAY_FREQUENCY_MULTIPLIERS: Record<string, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

// --- 2026 IRS Percentage Method Tables (Biweekly) ---

interface Bracket {
  min: number;
  max: number;
  baseTax: number;
  rate: number;
}

const SINGLE_BRACKETS: Bracket[] = [
  { min: 0, max: 619, baseTax: 0, rate: 0 },
  { min: 619, max: 1_222, baseTax: 0, rate: 0.10 },
  { min: 1_222, max: 3_887, baseTax: 60.30, rate: 0.12 },
  { min: 3_887, max: 7_821, baseTax: 380.10, rate: 0.22 },
  { min: 7_821, max: 14_553, baseTax: 1_245.58, rate: 0.24 },
  { min: 14_553, max: 18_544, baseTax: 2_861.26, rate: 0.32 },
  { min: 18_544, max: 47_289, baseTax: 4_138.38, rate: 0.35 },
  { min: 47_289, max: Infinity, baseTax: 14_199.53, rate: 0.37 },
];

const MARRIED_BRACKETS: Bracket[] = [
  { min: 0, max: 1_238, baseTax: 0, rate: 0 },
  { min: 1_238, max: 2_444, baseTax: 0, rate: 0.10 },
  { min: 2_444, max: 7_522, baseTax: 120.60, rate: 0.12 },
  { min: 7_522, max: 14_553, baseTax: 730.96, rate: 0.22 },
  { min: 14_553, max: 27_285, baseTax: 2_267.82, rate: 0.24 },
  { min: 27_285, max: 35_268, baseTax: 5_323.54, rate: 0.32 },
  { min: 35_268, max: 63_141, baseTax: 7_878.10, rate: 0.35 },
  { min: 63_141, max: Infinity, baseTax: 17_733.65, rate: 0.37 },
];

const HOH_BRACKETS: Bracket[] = [
  { min: 0, max: 944, baseTax: 0, rate: 0 },
  { min: 944, max: 1_861, baseTax: 0, rate: 0.10 },
  { min: 1_861, max: 4_840, baseTax: 91.70, rate: 0.12 },
  { min: 4_840, max: 7_821, baseTax: 449.18, rate: 0.22 },
  { min: 7_821, max: 14_553, baseTax: 1_105.00, rate: 0.24 },
  { min: 14_553, max: 18_544, baseTax: 2_720.68, rate: 0.32 },
  { min: 18_544, max: 47_289, baseTax: 3_998.38, rate: 0.35 },
  { min: 47_289, max: Infinity, baseTax: 14_199.53, rate: 0.37 },
];

function getBrackets(status: FilingStatus): Bracket[] {
  switch (status) {
    case 'single':
      return SINGLE_BRACKETS;
    case 'married':
      return MARRIED_BRACKETS;
    case 'headOfHousehold':
      return HOH_BRACKETS;
  }
}

/**
 * Calculate tax for a given wage amount using the biweekly bracket table.
 */
function calculateBracketTax(amount: number, brackets: Bracket[]): number {
  for (const bracket of brackets) {
    if (amount > bracket.min && amount <= bracket.max) {
      return bracket.baseTax + (amount - bracket.min) * bracket.rate;
    }
  }
  // If amount exceeds all defined brackets (shouldn't happen with Infinity bracket)
  const last = brackets[brackets.length - 1];
  return last.baseTax + (amount - last.min) * last.rate;
}

/**
 * Calculate federal withholding using the percentage method.
 */
function calculatePercentageMethod(bonus: number): number {
  if (bonus <= 1_000_000) {
    return bonus * 0.22;
  }
  return 220_000 + (bonus - 1_000_000) * 0.37;
}

/**
 * Calculate federal withholding using the aggregate method.
 */
function calculateAggregateMethod(
  bonus: number,
  annualSalary: number,
  filingStatus: FilingStatus,
  payFrequency: string
): { federalWithholding: number; taxOnRegular: number; taxOnCombined: number } {
  const multiplier = PAY_FREQUENCY_MULTIPLIERS[payFrequency] || 26;
  const brackets = getBrackets(filingStatus);

  // Convert annual salary to per-pay-period amount
  const regularPerPeriod = annualSalary / multiplier;

  // Calculate withholding on regular pay alone
  const taxOnRegular = calculateBracketTax(regularPerPeriod, brackets);

  // Calculate withholding on (regular pay + bonus) combined
  const combinedPerPeriod = regularPerPeriod + bonus;
  const taxOnCombined = calculateBracketTax(combinedPerPeriod, brackets);

  // Bonus withholding = combined - regular
  const federalWithholding = Math.max(0, taxOnCombined - taxOnRegular);

  return { federalWithholding, taxOnRegular, taxOnCombined };
}

/**
 * Calculate Social Security tax on bonus.
 */
function calculateSocialSecurity(
  bonus: number,
  ytdEarnings: number
): { withholding: number; taxable: number; capped: boolean } {
  if (ytdEarnings >= SS_WAGE_BASE) {
    return { withholding: 0, taxable: 0, capped: true };
  }

  const remainingBase = SS_WAGE_BASE - ytdEarnings;
  const taxable = Math.min(bonus, remainingBase);
  const withholding = taxable * SS_RATE;

  return { withholding, taxable, capped: taxable < bonus };
}

/**
 * Calculate Medicare tax (base + additional).
 */
function calculateMedicare(
  bonus: number,
  ytdEarnings: number,
  filingStatus: FilingStatus
): { totalWithholding: number; additionalMedicare: number; applies: boolean; threshold: number } {
  const baseMedicare = bonus * MEDICARE_BASE_RATE;
  const threshold = ADDITIONAL_MEDICARE_THRESHOLDS[filingStatus];

  const totalCompensation = ytdEarnings + bonus;
  let additionalMedicare = 0;

  if (totalCompensation > threshold) {
    // Only the portion of the bonus that pushes compensation above threshold is subject to additional Medicare
    const amountOverThreshold = totalCompensation - threshold;
    additionalMedicare = Math.min(bonus, amountOverThreshold) * ADDITIONAL_MEDICARE_RATE;
  }

  return {
    totalWithholding: baseMedicare + additionalMedicare,
    additionalMedicare,
    applies: additionalMedicare > 0,
    threshold,
  };
}

/**
 * Main calculation function.
 */
export function calculateBonusTax(input: BonusTaxInput): BonusTaxResult {
  const {
    grossBonus,
    ytdEarnings,
    method,
    regularPay = 100_000,
    filingStatus = 'single',
    payFrequency = 'biweekly',
  } = input;

  // 1. Federal Income Tax
  let federalWithholding: number;
  let federalRate: string;
  let aggregateTaxOnRegular: number | undefined;
  let aggregateTaxOnCombined: number | undefined;

  if (method === 'percentage') {
    federalWithholding = calculatePercentageMethod(grossBonus);
    federalRate = grossBonus <= 1_000_000 ? '22%' : '22% / 37%';
  } else {
    const aggResult = calculateAggregateMethod(grossBonus, regularPay, filingStatus, payFrequency);
    federalWithholding = aggResult.federalWithholding;
    aggregateTaxOnRegular = aggResult.taxOnRegular;
    aggregateTaxOnCombined = aggResult.taxOnCombined;
    federalRate = 'Progressive (Aggregate)';
  }

  // 2. Social Security
  const ss = calculateSocialSecurity(grossBonus, ytdEarnings);

  // 3. Medicare
  const medicare = calculateMedicare(grossBonus, ytdEarnings, filingStatus);

  // 4. Totals
  const totalTaxes = federalWithholding + ss.withholding + medicare.totalWithholding;
  const netPayout = grossBonus - totalTaxes;

  const federalEffectiveRate = grossBonus > 0 ? (federalWithholding / grossBonus) * 100 : 0;
  const medicareEffectiveRate = grossBonus > 0 ? (medicare.totalWithholding / grossBonus) * 100 : 0;
  const totalEffectiveRate = grossBonus > 0 ? (totalTaxes / grossBonus) * 100 : 0;

  return {
    grossBonus,
    federalWithholding,
    federalEffectiveRate,
    socialSecurityWithholding: ss.withholding,
    socialSecurityTaxable: ss.taxable,
    medicareWithholding: medicare.totalWithholding,
    medicareEffectiveRate,
    additionalMedicare: medicare.additionalMedicare,
    totalTaxes,
    totalEffectiveRate,
    netPayout,
    method,
    breakdown: {
      federalTaxableBonus: grossBonus,
      federalRate,
      ssCapped: ss.capped,
      ssWageBase: SS_WAGE_BASE,
      additionalMedicareApplies: medicare.applies,
      additionalMedicareThreshold: medicare.threshold,
      aggregateTaxOnRegular,
      aggregateTaxOnCombined,
    },
  };
}
