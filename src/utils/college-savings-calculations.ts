// 529 Plan vs UTMA/UGMA College Savings Comparison
// Compares the after-tax growth of 529 Plans vs UTMA/UGMA custodial accounts
// Covers 2026 IRS Kiddie Tax rules and FAFSA impact

// --- Tax Constants (2026 IRS Rules) ---

/** 529 Plan tax rate for qualified education expenses */
export const TAX_RATE_529 = 0;

/** UTMA 2026 Kiddie Tax: tax-free threshold */
export const KIDDIE_TAX_FREE = 1350;

/** UTMA 2026 Kiddie Tax: second bracket ceiling (tax-free + child-rate bracket) */
export const KIDDIE_TAX_CHILD_RATE_CEILING = 2700;

/** UTMA 2026 Kiddie Tax: child's tax rate for second bracket */
export const KIDDIE_TAX_CHILD_RATE = 0.10;

/** FAFSA assessment rate for 529 plans (parent asset) */
export const FAFSA_RATE_529 = 0.0564;

/** FAFSA assessment rate for UTMA/UGMA (child asset) */
export const FAFSA_RATE_UTMA = 0.20;

/** Default annual return */
export const DEFAULT_ANNUAL_RETURN = 7;

/** Default portfolio yield (taxable portion) */
export const DEFAULT_PORTFOLIO_YIELD = 2;

/** Default parent marginal tax rate */
export const DEFAULT_PARENT_TAX_RATE = 24;

/** Default initial contribution */
export const DEFAULT_INITIAL = 10000;

/** Default monthly contribution */
export const DEFAULT_MONTHLY = 500;

/** Default child age */
export const DEFAULT_CHILD_AGE = 5;

/** Default withdrawal age */
export const DEFAULT_WITHDRAWAL_AGE = 18;

// --- Interfaces ---

/** Input parameters for the college savings comparison calculation. */
export interface CollegeSavingsInputs {
  /** Starting lump sum ($) */
  initialContribution: number;
  /** Monthly contribution ($) */
  monthlyContribution: number;
  /** Child's current age */
  childAge: number;
  /** Age when funds are needed (default 18) */
  withdrawalAge: number;
  /** Expected annual return as percentage (e.g. 7 = 7%) */
  annualReturn: number;
  /** Percentage of return from taxable dividends/interest (e.g. 2 = 2%) */
  portfolioYield: number;
  /** Parent's marginal tax rate as percentage (e.g. 24 = 24%) */
  parentTaxRate: number;
}

/** Annual snapshot of both account balances and taxes paid. */
export interface AnnualSnapshot {
  /** Years from now */
  year: number;
  /** Child's age that year */
  age: number;
  /** 529 balance end of year */
  balance529: number;
  /** UTMA balance end of year */
  balanceUtma: number;
  /** Tax paid on 529 that year (always 0) */
  annualTax529: number;
  /** Tax paid on UTMA that year (kiddie tax) */
  annualTaxUtma: number;
  /** Cumulative UTMA taxes paid */
  cumulativeTaxUtma: number;
}

/** Complete result of the 529 vs UTMA comparison. */
export interface CollegeSavingsResult {
  /** Final 529 plan balance at withdrawal age */
  finalBalance529: number;
  /** Final UTMA/UGMA balance at withdrawal age */
  finalBalanceUtma: number;
  /** Total tax paid on 529 (always 0 for qualified withdrawals) */
  totalTaxPaid529: number;
  /** Total tax paid on UTMA (sum of yearly kiddie tax) */
  totalTaxPaidUtma: number;
  /** Advantage of 529 over UTMA (finalBalance529 - finalBalanceUtma) */
  advantage529: number;
  /** Advantage as a percentage of UTMA balance */
  advantagePercent: number;
  /** Total money contributed over the period */
  totalContributions: number;
  /** Total growth in 529 account */
  totalGrowth529: number;
  /** Total growth in UTMA account */
  totalGrowthUtma: number;
  /** FAFSA expected family contribution impact from 529 */
  fafsaReduction529: number;
  /** FAFSA expected family contribution impact from UTMA */
  fafsaReductionUtma: number;
  /** FAFSA advantage of 529 (how much less aid is reduced) */
  fafsaAdvantage529: number;
  /** Year-by-year timeline of account balances */
  timeline: AnnualSnapshot[];
  /** Warning messages about inputs or results */
  warnings: string[];
}

// --- Helper ---

/**
 * Round a monetary value to 2 decimal places.
 *
 * @param n - The number to round.
 * @returns The number rounded to 2 decimal places.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// --- Core Tax Functions ---

/**
 * Calculate the 2026 Kiddie Tax on a child's unearned income.
 *
 * The 2026 Kiddie Tax rules apply the following brackets:
 *   - First $1,350: tax-free (standard deduction for dependents)
 *   - Next $1,350 ($1,350 to $2,700): taxed at the child's tax rate (10%)
 *   - Amount over $2,700: taxed at the parent's marginal tax rate
 *
 * @param unearnedIncome - The child's unearned income (dividends, interest, capital gains) for the year.
 * @param parentTaxRate - The parent's marginal tax rate as a percentage (e.g. 24 = 24%).
 * @returns The kiddie tax owed for the year, rounded to 2 decimal places.
 */
export function calculateKiddieTax(unearnedIncome: number, parentTaxRate: number): number {
  if (unearnedIncome <= KIDDIE_TAX_FREE) {
    return 0;
  }

  if (unearnedIncome <= KIDDIE_TAX_CHILD_RATE_CEILING) {
    return round2((unearnedIncome - KIDDIE_TAX_FREE) * KIDDIE_TAX_CHILD_RATE);
  }

  const childRatePortion = KIDDIE_TAX_FREE * KIDDIE_TAX_CHILD_RATE;
  const parentRatePortion = (unearnedIncome - KIDDIE_TAX_CHILD_RATE_CEILING) * (parentTaxRate / 100);
  return round2(childRatePortion + parentRatePortion);
}

// --- Main Comparison Function ---

/**
 * Run a full comparison between a 529 Plan and a UTMA/UGMA custodial account for college savings.
 *
 * Simulates the year-by-year growth of both account types, applying:
 *   - 529 Plan: tax-free growth, no annual tax drag
 *   - UTMA/UGMA: annual Kiddie Tax on unearned income (dividends/interest), taxed at
 *     the child's or parent's rate depending on the amount
 *
 * Also calculates FAFSA impact using standard assessment rates:
 *   - 529 plans assessed at 5.64% (parent asset)
 *   - UTMA/UGMA assessed at 20% (child asset)
 *
 * @param inputs - The college savings comparison inputs.
 * @returns A full comparison result with final balances, tax totals, FAFSA impact, and warnings.
 */
export function calculateCollegeSavingsComparison(
  inputs: CollegeSavingsInputs,
): CollegeSavingsResult {
  const warnings: string[] = [];

  // Convert percentages to decimals
  const annualReturnDecimal = inputs.annualReturn / 100;
  const portfolioYieldDecimal = inputs.portfolioYield / 100;

  // Calculate time horizon and contribution totals
  const numberOfYears = inputs.withdrawalAge - inputs.childAge;
  const annualContribution = inputs.monthlyContribution * 12;
  const totalContributions = round2(
    inputs.initialContribution + annualContribution * numberOfYears,
  );

  // Validate age inputs
  if (inputs.childAge >= inputs.withdrawalAge) {
    warnings.push(
      `Child's age (${inputs.childAge}) must be less than the withdrawal age (${inputs.withdrawalAge}). ` +
      `No projection years available.`,
    );
  }

  // Initialize running balances
  let balance529 = inputs.initialContribution;
  let balanceUtma = inputs.initialContribution;
  let cumulativeTaxUtma = 0;
  const timeline: AnnualSnapshot[] = [];

  // Loop for each year of the projection
  for (let year = 0; year < numberOfYears; year++) {
    const age = inputs.childAge + year + 1;

    // 529 Plan: grow tax-free, add contribution after growth
    const annualGrowth529 = balance529 * annualReturnDecimal;
    balance529 = round2(balance529 + annualGrowth529 + annualContribution);

    // UTMA/UGMA: grow with tax drag, add contribution after growth and tax
    const annualGrowthUtma = balanceUtma * annualReturnDecimal;
    const unearnedIncome = round2(balanceUtma * portfolioYieldDecimal);
    const annualTaxUtma = calculateKiddieTax(unearnedIncome, inputs.parentTaxRate);
    balanceUtma = round2(balanceUtma + annualGrowthUtma - annualTaxUtma + annualContribution);

    // Track cumulative taxes
    cumulativeTaxUtma = round2(cumulativeTaxUtma + annualTaxUtma);

    // Record annual snapshot
    timeline.push({
      year: year + 1,
      age,
      balance529: round2(balance529),
      balanceUtma: round2(balanceUtma),
      annualTax529: 0,
      annualTaxUtma,
      cumulativeTaxUtma,
    });
  }

  // Final balances
  const finalBalance529 = round2(balance529);
  const finalBalanceUtma = round2(balanceUtma);
  const totalTaxPaidUtma = round2(cumulativeTaxUtma);

  // Comparison metrics
  const advantage529 = round2(finalBalance529 - finalBalanceUtma);
  const advantagePercent =
    finalBalanceUtma > 0 ? round2((advantage529 / finalBalanceUtma) * 100) : 0;

  // Growth calculations
  const totalGrowth529 = round2(finalBalance529 - totalContributions);
  const totalGrowthUtma = round2(finalBalanceUtma - totalContributions + totalTaxPaidUtma);

  // FAFSA impact
  const fafsaReduction529 = round2(finalBalance529 * FAFSA_RATE_529);
  const fafsaReductionUtma = round2(finalBalanceUtma * FAFSA_RATE_UTMA);
  const fafsaAdvantage529 = round2(fafsaReductionUtma - fafsaReduction529);

  // Build warnings
  if (advantagePercent > 15 && finalBalanceUtma > 0) {
    warnings.push(
      `The 529 Plan advantage is ${advantagePercent.toFixed(1)}%, indicating a significant ` +
      `benefit over a UTMA/UGMA account for your time horizon and tax situation.`,
    );
  }

  if (inputs.portfolioYield > inputs.annualReturn) {
    warnings.push(
      `Portfolio yield (${inputs.portfolioYield}%) exceeds the expected annual return ` +
      `(${inputs.annualReturn}%). This scenario is unrealistic as dividends and interest ` +
      `cannot exceed total return.`,
    );
  }

  return {
    finalBalance529,
    finalBalanceUtma,
    totalTaxPaid529: 0,
    totalTaxPaidUtma,
    advantage529,
    advantagePercent,
    totalContributions,
    totalGrowth529,
    totalGrowthUtma,
    fafsaReduction529,
    fafsaReductionUtma,
    fafsaAdvantage529,
    timeline,
    warnings,
  };
}
