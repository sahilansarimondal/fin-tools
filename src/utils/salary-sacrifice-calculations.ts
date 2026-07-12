// UK Salary Sacrifice Pension Optimizer
// Compares Standard Pension (relief at source) vs Salary Sacrifice for 2026/27 tax year
// Covers England/Wales/NI tax bands and National Insurance rules

// --- Tax Constants (2026/27, England/Wales/NI) ---

const PERSONAL_ALLOWANCE = 12570;
const PA_TAPER_THRESHOLD = 100000;
const PA_TAPER_RATE = 0.5; // £1 reduction per £2 over threshold

const BASIC_RATE_LIMIT = 50270;
const HIGHER_RATE_LIMIT = 125140;

const BASIC_RATE = 0.20;
const HIGHER_RATE = 0.40;
const ADDITIONAL_RATE = 0.45;

const NI_PRIMARY_THRESHOLD = 12570;
const NI_UPPER_THRESHOLD = 50270;
const NI_MAIN_RATE = 0.08;
const NI_HIGHER_RATE = 0.02;

const NI_SECONDARY_THRESHOLD = 5000;
const NI_SECONDARY_RATE = 0.15;

const NMW_SAFE_THRESHOLD = 22500;

// Band widths in terms of taxable income (after personal allowance)
const BASIC_RATE_TAXABLE_BAND = BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE; // £37,700
const HIGHER_RATE_TAXABLE_BAND = HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT; // £74,870

// --- Interfaces ---

export interface SalarySacrificeInputs {
  grossSalary: number;
  employeeContributionPercent: number; // 0-100
  employerContributionPercent: number; // 0-100
  employerNiReinvestmentPercent: number; // 0-100
}

export interface TaxBreakdown {
  taxableIncome: number;
  personalAllowance: number;
  incomeTax: number;
  employeeNI: number;
  takeHomePay: number;
  employeeContribution: number;
  employerContribution: number;
}

export interface SalarySacrificeResult {
  standard: TaxBreakdown & { totalPension: number };
  salarySacrifice: TaxBreakdown & {
    totalPension: number;
    employerNiSaving: number;
    employerNiPassedOn: number;
    newGrossSalary: number;
  };
  comparison: {
    takeHomePayDifference: number; // positive = more take home in SS
    pensionDifference: number; // positive = more pension in SS
    totalBenefit: number; // takeHomePayDifference + pensionDifference
    employerNiSavingTotal: number;
  };
  warnings: string[];
  isViable: boolean; // false if new gross salary below NMW
}

// --- Helper ---

/**
 * Round a monetary value to 2 decimal places.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// --- Core Tax Functions ---

/**
 * Calculate the Personal Allowance for a given income level.
 *
 * Standard PA is £12,570. For income over £100,000, the PA is reduced by
 * £1 for every £2 earned above the threshold, reaching £0 at £125,140.
 *
 * @param grossSalary - Total income (or adjusted net income) used for the PA taper.
 * @returns The applicable personal allowance (rounded to 2 decimal places).
 */
export function calculatePersonalAllowance(grossSalary: number): number {
  const incomeOverThreshold = Math.max(0, grossSalary - PA_TAPER_THRESHOLD);
  const paReduction = Math.floor(incomeOverThreshold * PA_TAPER_RATE);
  return round2(Math.max(0, PERSONAL_ALLOWANCE - paReduction));
}

/**
 * Calculate income tax for the 2026/27 tax year (England/Wales/NI bands).
 *
 * Applies the personal allowance to determine taxable income, then taxes at:
 *   - 20% on the basic rate band (first £37,700 of taxable income)
 *   - 40% on the higher rate band (next £74,870 of taxable income)
 *   - 45% on any remaining taxable income (additional rate)
 *
 * @param taxableIncome - Total income before personal allowance deduction.
 * @param personalAllowance - The applicable personal allowance for this scenario.
 * @returns Total income tax rounded to 2 decimal places.
 */
export function calculateIncomeTax(taxableIncome: number, personalAllowance: number): number {
  const incomeAfterPA = Math.max(0, taxableIncome - personalAllowance);
  let remaining = incomeAfterPA;
  let tax = 0;

  // Basic rate: 20% on the first £37,700 of taxable income
  const basicAmount = Math.min(remaining, BASIC_RATE_TAXABLE_BAND);
  tax += basicAmount * BASIC_RATE;
  remaining -= basicAmount;

  // Higher rate: 40% on the next £74,870 of taxable income
  if (remaining > 0) {
    const higherAmount = Math.min(remaining, HIGHER_RATE_TAXABLE_BAND);
    tax += higherAmount * HIGHER_RATE;
    remaining -= higherAmount;
  }

  // Additional rate: 45% on any remaining taxable income
  if (remaining > 0) {
    tax += remaining * ADDITIONAL_RATE;
  }

  return round2(tax);
}

/**
 * Calculate Employee National Insurance contributions for 2026/27.
 *
 *   - 0% on earnings up to £12,570 (Primary Threshold)
 *   - 8% on earnings between £12,570 and £50,270
 *   - 2% on earnings above £50,270
 *
 * @param earnings - Total earnings subject to employee NI.
 * @returns Employee NI rounded to 2 decimal places.
 */
export function calculateEmployeeNI(earnings: number): number {
  if (earnings <= NI_PRIMARY_THRESHOLD) return 0;

  const abovePrimary = earnings - NI_PRIMARY_THRESHOLD;
  const inMainBand = Math.min(abovePrimary, NI_UPPER_THRESHOLD - NI_PRIMARY_THRESHOLD);
  const aboveUpper = Math.max(0, abovePrimary - (NI_UPPER_THRESHOLD - NI_PRIMARY_THRESHOLD));

  return round2(inMainBand * NI_MAIN_RATE + aboveUpper * NI_HIGHER_RATE);
}

/**
 * Calculate Employer National Insurance contributions for 2026/27.
 *
 *   - 0% on earnings up to £5,000 (Secondary Threshold)
 *   - 15% on earnings above £5,000
 *
 * @param earnings - Total earnings subject to employer NI.
 * @returns Employer NI rounded to 2 decimal places.
 */
export function calculateEmployerNI(earnings: number): number {
  if (earnings <= NI_SECONDARY_THRESHOLD) return 0;

  const aboveSecondary = earnings - NI_SECONDARY_THRESHOLD;
  return round2(aboveSecondary * NI_SECONDARY_RATE);
}

// --- Scenario Calculators ---

/**
 * Calculate the Standard Pension (relief at source) scenario.
 *
 * In a standard workplace pension:
 *   - Employee contributions reduce taxable income for income tax purposes
 *   - Employee NI is calculated on the FULL gross salary (not reduced by pension)
 *   - Employer contributions are based on the original gross salary
 *   - Take-home pay = gross - incomeTax - employeeNI - employeeContribution
 *
 * @param inputs - Salary sacrifice comparison inputs.
 * @returns Tax breakdown for the standard pension scenario.
 */
export function calculateStandardPension(
  inputs: SalarySacrificeInputs,
): TaxBreakdown & { totalPension: number } {
  const { grossSalary, employeeContributionPercent, employerContributionPercent } = inputs;

  const employeeContribution = round2(grossSalary * (employeeContributionPercent / 100));
  const employerContribution = round2(grossSalary * (employerContributionPercent / 100));

  // Taxable income for income tax (pension reduces adjusted net income)
  const taxableIncome = round2(grossSalary - employeeContribution);

  // Personal allowance based on adjusted net income
  const personalAllowance = calculatePersonalAllowance(taxableIncome);

  // Income tax on taxable income after pension deduction
  const incomeTax = calculateIncomeTax(taxableIncome, personalAllowance);

  // Employee NI is on the FULL gross salary (not reduced by pension)
  const employeeNI = calculateEmployeeNI(grossSalary);

  // Take-home = gross - incomeTax - employeeNI - employeeContribution
  const takeHomePay = round2(grossSalary - incomeTax - employeeNI - employeeContribution);

  const totalPension = round2(employeeContribution + employerContribution);

  return {
    taxableIncome,
    personalAllowance,
    incomeTax,
    employeeNI,
    takeHomePay,
    employeeContribution,
    employerContribution,
    totalPension,
  };
}

/**
 * Calculate the Salary Sacrifice scenario.
 *
 * Under salary sacrifice:
 *   - The employee agrees to a reduced gross salary in exchange for a pension contribution
 *   - Employee NI is calculated on the REDUCED gross salary
 *   - Income tax is calculated on the reduced gross salary
 *   - The employer saves NI on the sacrificed amount and may pass on some/all savings
 *   - Total pension includes the sacrificed amount + employer contribution + passed-on NI savings
 *
 * @param inputs - Salary sacrifice comparison inputs.
 * @returns Tax breakdown for the salary sacrifice scenario, including employer NI details.
 */
export function calculateSalarySacrifice(
  inputs: SalarySacrificeInputs,
): TaxBreakdown & {
  totalPension: number;
  employerNiSaving: number;
  employerNiPassedOn: number;
  newGrossSalary: number;
} {
  const { grossSalary, employeeContributionPercent, employerContributionPercent, employerNiReinvestmentPercent } = inputs;

  const sacrificeAmount = round2(grossSalary * (employeeContributionPercent / 100));
  const newGrossSalary = round2(grossSalary - sacrificeAmount);

  // Employer contribution is based on the ORIGINAL gross salary
  const employerContribution = round2(grossSalary * (employerContributionPercent / 100));

  // Personal allowance based on the new (reduced) gross salary
  const personalAllowance = calculatePersonalAllowance(newGrossSalary);

  // Income tax on the new gross salary
  const incomeTax = calculateIncomeTax(newGrossSalary, personalAllowance);

  // Employee NI on the REDUCED gross salary
  const employeeNI = calculateEmployeeNI(newGrossSalary);

  // Take-home = newGross - incomeTax - employeeNI (no separate contribution deducted)
  const takeHomePay = round2(newGrossSalary - incomeTax - employeeNI);

  // Employer NI saving: difference between NI on original vs reduced salary
  const oldEmployerNI = calculateEmployerNI(grossSalary);
  const newEmployerNI = calculateEmployerNI(newGrossSalary);
  const employerNiSaving = round2(oldEmployerNI - newEmployerNI);

  // Employer NI saving passed on to the pension
  const employerNiPassedOn = round2(employerNiSaving * (employerNiReinvestmentPercent / 100));

  // Total pension = sacrificed amount + employer contribution + passed-on NI savings
  const totalPension = round2(sacrificeAmount + employerContribution + employerNiPassedOn);

  return {
    taxableIncome: newGrossSalary,
    personalAllowance,
    incomeTax,
    employeeNI,
    takeHomePay,
    employeeContribution: sacrificeAmount,
    employerContribution,
    totalPension,
    employerNiSaving,
    employerNiPassedOn,
    newGrossSalary,
  };
}

/**
 * Run a full comparison between Standard Pension and Salary Sacrifice scenarios.
 *
 * Calculates both scenarios side-by-side, computes differences in take-home pay
 * and pension accumulation, and validates against the National Minimum Wage
 * threshold.
 *
 * @param inputs - Salary sacrifice comparison inputs.
 * @returns Full comparison result with both scenarios, differences, and warnings.
 */
export function calculateSalarySacrificeComparison(
  inputs: SalarySacrificeInputs,
): SalarySacrificeResult {
  const warnings: string[] = [];

  // Validate input ranges
  if (inputs.employeeContributionPercent < 0 || inputs.employeeContributionPercent > 100) {
    warnings.push('Employee contribution percentage must be between 0 and 100.');
  }
  if (inputs.employerContributionPercent < 0 || inputs.employerContributionPercent > 100) {
    warnings.push('Employer contribution percentage must be between 0 and 100.');
  }
  if (inputs.employerNiReinvestmentPercent < 0 || inputs.employerNiReinvestmentPercent > 100) {
    warnings.push('Employer NI reinvestment percentage must be between 0 and 100.');
  }

  // Run both scenarios
  const standard = calculateStandardPension(inputs);
  const salarySacrifice = calculateSalarySacrifice(inputs);

  // Compare outcomes
  const takeHomePayDifference = round2(salarySacrifice.takeHomePay - standard.takeHomePay);
  const pensionDifference = round2(salarySacrifice.totalPension - standard.totalPension);
  const totalBenefit = round2(takeHomePayDifference + pensionDifference);

  // NMW viability check
  const isViable = salarySacrifice.newGrossSalary >= NMW_SAFE_THRESHOLD;
  if (!isViable) {
    warnings.push(
      `Your new gross salary of £${salarySacrifice.newGrossSalary.toFixed(2)} is below the estimated ` +
      `National Minimum Wage threshold of £${NMW_SAFE_THRESHOLD.toFixed(2)} for full-time work ` +
      `(37.5 hrs/wk × 52 wks × £11.44/hr). Salary sacrifice may not be legally viable.`,
    );
  }

  // Employer NI edge case warning
  if (salarySacrifice.newGrossSalary > 0 && salarySacrifice.newGrossSalary < NI_SECONDARY_THRESHOLD) {
    warnings.push(
      `Your new gross salary of £${salarySacrifice.newGrossSalary.toFixed(2)} falls below the ` +
      `employer NI Secondary Threshold of £${NI_SECONDARY_THRESHOLD.toFixed(2)}. ` +
      `The employer NI saving calculation assumes marginal savings at 15%, which may differ ` +
      `if the threshold is crossed.`,
    );
  }

  // Personal allowance taper warning
  if (salarySacrifice.personalAllowance < PERSONAL_ALLOWANCE) {
    warnings.push(
      `Your personal allowance of £${salarySacrifice.personalAllowance.toFixed(2)} has been ` +
      `tapered due to income above £${PA_TAPER_THRESHOLD.toLocaleString()}. ` +
      `Higher earners may experience marginal tax rates above 60% in the taper band.`,
    );
  }

  return {
    standard: {
      ...standard,
      totalPension: standard.totalPension,
    },
    salarySacrifice: {
      ...salarySacrifice,
      totalPension: salarySacrifice.totalPension,
    },
    comparison: {
      takeHomePayDifference,
      pensionDifference,
      totalBenefit,
      employerNiSavingTotal: salarySacrifice.employerNiSaving,
    },
    warnings,
    isViable,
  };
}
