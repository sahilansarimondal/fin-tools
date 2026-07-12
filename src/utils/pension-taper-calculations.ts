/**
 * UK Pension Taper Calculator — HMRC 2024/25 Tapered Annual Allowance
 *
 * Calculates Threshold Income, Adjusted Income, and Tapered Annual Allowance
 * based on HMRC rules for high earners.
 *
 * @module pension-taper-calculations
 */

// --- HMRC Constants (2024/25 tax year) ---
const STANDARD_ANNUAL_ALLOWANCE = 60000;
const THRESHOLD_INCOME_LIMIT = 200000;
const ADJUSTED_INCOME_LIMIT = 260000;
const MINIMUM_ANNUAL_ALLOWANCE = 10000;
const TAPER_RATE = 0.5; // Lose £1 of allowance for every £2 over the Adjusted Income Limit
const BASIC_RATE_TAX = 0.2; // Used to gross up Relief at Source contributions

export type ContributionMethod = 'relief-at-source' | 'net-pay';

export interface PensionTaperInputs {
  baseSalary: number;
  bonusesCommissions: number;
  otherTaxableIncome: number; // Dividends, rental income, savings interest
  employeeContributions: number; // Net if Relief at Source, Gross if Net Pay/Salary Sacrifice
  employerContributions: number;
  contributionMethod: ContributionMethod;
}

export interface PensionTaperResult {
  totalIncome: number;
  thresholdIncome: number;
  adjustedIncome: number;
  taperedAnnualAllowance: number;
  totalPensionInput: number;
  remainingAllowance: number;
  isTapered: boolean;
  exceedsThreshold: boolean;
  exceedsAdjusted: boolean;
  hasTaxCharge: boolean;
  reduction: number;
  explanation: string;
  warnings: string[];
}

/**
 * Formats a number as GBP currency string.
 */
function formatGBP(value: number): string {
  return '£' + value.toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Rounds a number to 2 decimal places.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculates the Tapered Annual Allowance based on HMRC 2024/25 rules.
 *
 * The taper reduces the annual allowance by £1 for every £2 of Adjusted Income
 * above £260,000, down to a minimum of £10,000. The taper only applies if
 * Threshold Income exceeds £200,000.
 *
 * @param inputs - The income and contribution details
 * @returns The calculated allowance, income values, warnings, and an explanation
 *
 * @example
 * ```typescript
 * const result = calculatePensionTaper({
 *   baseSalary: 250000,
 *   bonusesCommissions: 30000,
 *   otherTaxableIncome: 5000,
 *   employeeContributions: 8000,
 *   employerContributions: 20000,
 *   contributionMethod: 'relief-at-source',
 * });
 * ```
 */
export function calculatePensionTaper(inputs: PensionTaperInputs): PensionTaperResult {
  const warnings: string[] = [];
  const {
    baseSalary,
    bonusesCommissions,
    otherTaxableIncome,
    employeeContributions,
    employerContributions,
    contributionMethod,
  } = inputs;

  // Step 1: Calculate Total Taxable Income
  const totalIncome = round2(baseSalary + bonusesCommissions + otherTaxableIncome);

  // Step 2: Calculate Threshold Income
  let thresholdIncome: number;
  let grossEmployeeContributions = 0;

  if (contributionMethod === 'relief-at-source') {
    // Gross up the net contribution: £8,000 net → £10,000 gross
    grossEmployeeContributions = round2(employeeContributions / (1 - BASIC_RATE_TAX));
    thresholdIncome = round2(totalIncome - grossEmployeeContributions);
  } else {
    // Net Pay / Salary Sacrifice — salary already reduced
    thresholdIncome = totalIncome;
  }

  let taperedAnnualAllowance: number;
  let reduction: number;
  let isTapered: boolean;
  let exceedsThreshold: boolean;
  let exceedsAdjusted: boolean;
  let adjustedIncome: number;

  // Step 3: Check Threshold Condition
  exceedsThreshold = thresholdIncome > THRESHOLD_INCOME_LIMIT;

  if (!exceedsThreshold) {
    // Taper does NOT apply
    taperedAnnualAllowance = STANDARD_ANNUAL_ALLOWANCE;
    reduction = 0;
    adjustedIncome = 0;
    exceedsAdjusted = false;
    isTapered = false;
  } else {
    // Step 4: Calculate Adjusted Income (only if exceedsThreshold)
    warnings.push('Your Threshold Income exceeds £200,000, so the tapered annual allowance applies.');

    if (contributionMethod === 'relief-at-source') {
      // Relief at Source: Adjusted Income = total income + employer contributions + gross employee contributions
      adjustedIncome = round2(totalIncome + employerContributions + grossEmployeeContributions);
    } else {
      // Net Pay / Salary Sacrifice: Adjusted Income = total income + employer contributions
      adjustedIncome = round2(totalIncome + employerContributions);
    }

    // Step 5: Calculate Tapered Allowance
    exceedsAdjusted = adjustedIncome > ADJUSTED_INCOME_LIMIT;

    if (!exceedsAdjusted) {
      taperedAnnualAllowance = STANDARD_ANNUAL_ALLOWANCE;
      reduction = 0;
      isTapered = false;
    } else {
      warnings.push('Your Adjusted Income exceeds £260,000, so your annual allowance is being reduced.');

      const excess = round2(adjustedIncome - ADJUSTED_INCOME_LIMIT);
      reduction = round2(excess * TAPER_RATE);
      taperedAnnualAllowance = round2(Math.max(MINIMUM_ANNUAL_ALLOWANCE, STANDARD_ANNUAL_ALLOWANCE - reduction));
      isTapered = true;

      if (taperedAnnualAllowance <= MINIMUM_ANNUAL_ALLOWANCE) {
        warnings.push('You have reached the minimum tapered annual allowance of £10,000.');
      }
    }
  }

  // Step 6: Calculate Headroom / Tax Charge
  const totalPensionInput = round2(employeeContributions + employerContributions);
  const remainingAllowance = round2(taperedAnnualAllowance - totalPensionInput);
  const hasTaxCharge = remainingAllowance < 0;

  if (hasTaxCharge) {
    warnings.push('Your pension contributions exceed your tapered annual allowance. You may face an annual allowance tax charge.');
  }

  // Step 7: Generate Plain English Explanation
  const explanationParts: string[] = [];

  if (!exceedsThreshold) {
    explanationParts.push(
      `Your Threshold Income of ${formatGBP(thresholdIncome)} does not exceed the ${formatGBP(THRESHOLD_INCOME_LIMIT)} limit, so the pension taper does not apply. Your annual allowance remains the full ${formatGBP(STANDARD_ANNUAL_ALLOWANCE)}.`,
    );
  } else {
    explanationParts.push(
      `Your Threshold Income of ${formatGBP(thresholdIncome)} exceeds the ${formatGBP(THRESHOLD_INCOME_LIMIT)} limit, so the taper applies.`,
    );

    if (exceedsAdjusted) {
      const excess = round2(adjustedIncome - ADJUSTED_INCOME_LIMIT);
      explanationParts.push(
        `Your Adjusted Income of ${formatGBP(adjustedIncome)} is ${formatGBP(excess)} above the ${formatGBP(ADJUSTED_INCOME_LIMIT)} threshold, reducing your annual allowance by ${formatGBP(reduction)} from ${formatGBP(STANDARD_ANNUAL_ALLOWANCE)} to ${formatGBP(taperedAnnualAllowance)}.`,
      );
    } else {
      explanationParts.push(
        `However, your Adjusted Income of ${formatGBP(adjustedIncome)} does not exceed ${formatGBP(ADJUSTED_INCOME_LIMIT)}, so your annual allowance remains the full ${formatGBP(STANDARD_ANNUAL_ALLOWANCE)}.`,
      );
    }
  }

  if (hasTaxCharge) {
    explanationParts.push(
      `Your total pension input of ${formatGBP(totalPensionInput)} exceeds your tapered annual allowance of ${formatGBP(taperedAnnualAllowance)} by ${formatGBP(Math.abs(remainingAllowance))}. You may face an annual allowance tax charge on the excess.`,
    );
  }

  const explanation = explanationParts.join(' ');

  return {
    totalIncome,
    thresholdIncome,
    adjustedIncome,
    taperedAnnualAllowance,
    totalPensionInput,
    remainingAllowance,
    isTapered,
    exceedsThreshold,
    exceedsAdjusted,
    hasTaxCharge,
    reduction,
    explanation,
    warnings,
  };
}
