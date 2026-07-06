export type TaxRegion = 'england' | 'scotland';

export interface RedundancyInputs {
  totalGrossPackage: number;
  nonQualifyingCompensation: number;
  currentYearIncome: number;
  region: TaxRegion;
}

export interface TaxBandBreakdown {
  bandName: string;
  rate: number;
  amountInBand: number;
  taxPaid: number;
}

export interface NIBreakdown {
  qualifyingNI: number;
  nonQualifyingNI: number;
  totalNI: number;
}

export interface RedundancyResult {
  qualifyingRedundancy: number;
  taxFreePortion: number;
  taxableExcess: number;
  totalAdditionalTaxable: number;
  totalIncomeTax: number;
  employeeNI: number;
  totalDeductions: number;
  netTakeHome: number;
  incomeTaxBreakdown: TaxBandBreakdown[];
  niBreakdown: NIBreakdown;
  validationAlert?: string;
}

interface TaxBand {
  bandName: string;
  min: number;
  max: number;
  rate: number;
}

const ENGLAND_BANDS: TaxBand[] = [
  { bandName: 'Personal Allowance', min: 0, max: 12570, rate: 0 },
  { bandName: 'Basic Rate', min: 12570, max: 50270, rate: 0.2 },
  { bandName: 'Higher Rate', min: 50270, max: 125140, rate: 0.4 },
  { bandName: 'Additional Rate', min: 125140, max: Infinity, rate: 0.45 },
];

const SCOTLAND_BANDS: TaxBand[] = [
  { bandName: 'Personal Allowance', min: 0, max: 12570, rate: 0 },
  { bandName: 'Starter Rate', min: 12570, max: 14876, rate: 0.19 },
  { bandName: 'Basic Rate', min: 14876, max: 26561, rate: 0.2 },
  { bandName: 'Intermediate Rate', min: 26561, max: 43662, rate: 0.21 },
  { bandName: 'Higher Rate', min: 43662, max: 75000, rate: 0.42 },
  { bandName: 'Advanced Rate', min: 75000, max: 125140, rate: 0.45 },
  { bandName: 'Top Rate', min: 125140, max: Infinity, rate: 0.48 },
];

/**
 * Calculate adjusted personal allowance due to the taper.
 * £1 is lost for every £2 over £100,000.
 * The allowance cannot go below £0.
 */
function calculateAdjustedAllowance(income: number, bands: TaxBand[]): number {
  const baseAllowance = 12570;
  if (income <= 100000) return baseAllowance;
  const excess = income - 100000;
  const reduction = Math.min(baseAllowance, Math.ceil(excess / 2));
  return Math.max(0, baseAllowance - reduction);
}

/**
 * Calculate income tax for a given income amount using the specified tax bands.
 * Accounts for personal allowance taper when income exceeds £100,000.
 */
function calculateTaxForIncome(income: number, bands: TaxBand[]): { totalTax: number; breakdown: TaxBandBreakdown[] } {
  const adjustedAllowance = calculateAdjustedAllowance(income, bands);
  const breakdown: TaxBandBreakdown[] = [];
  let remainingIncome = income;
  let totalTax = 0;

  for (const band of bands) {
    // Calculate the effective band boundaries with adjusted personal allowance
    let effectiveMin: number;
    let effectiveMax: number;

    if (bands[0] === band) {
      // Personal Allowance band
      effectiveMin = 0;
      effectiveMax = adjustedAllowance;
    } else {
      // For non-allowance bands, shift the boundaries
      const allowanceReduction = 12570 - adjustedAllowance;
      effectiveMin = band.min + allowanceReduction;
      effectiveMax = band.max + allowanceReduction;
    }

    if (remainingIncome <= 0) {
      breakdown.push({ bandName: band.bandName, rate: band.rate, amountInBand: 0, taxPaid: 0 });
      continue;
    }

    const bandSize = Math.max(0, effectiveMax - effectiveMin);
    const amountInBand = Math.min(remainingIncome, bandSize);
    const taxPaid = amountInBand * band.rate;
    totalTax += taxPaid;

    breakdown.push({ bandName: band.bandName, rate: band.rate, amountInBand, taxPaid });
    remainingIncome -= amountInBand;
  }

  return { totalTax, breakdown };
}

/**
 * Calculate employee National Insurance contributions.
 * NI is 8% on earnings between £12,570 and £50,270, and 2% on earnings above £50,270.
 * There is no NI on earnings below £12,570 (Primary Threshold).
 */
function calculateNIContributions(income: number): number {
  const primaryThreshold = 12570;
  const upperEarningsLimit = 50270;

  if (income <= primaryThreshold) return 0;

  const earningsInMainBand = Math.min(income, upperEarningsLimit) - primaryThreshold;
  const earningsAboveUpper = Math.max(0, income - upperEarningsLimit);

  return earningsInMainBand * 0.08 + earningsAboveUpper * 0.02;
}

/**
 * Calculate redundancy tax breakdown based on HMRC 2026/27 rules.
 *
 * @param inputs - The redundancy package inputs
 * @returns Detailed breakdown of tax, NI, and net take-home pay
 */
export function calculateRedundancyTax(inputs: RedundancyInputs): RedundancyResult {
  const { totalGrossPackage, nonQualifyingCompensation, currentYearIncome, region } = inputs;

  // Clamp negative values to 0
  const grossPackage = Math.max(0, totalGrossPackage);
  const nonQualifying = Math.max(0, nonQualifyingCompensation);
  const yearIncome = Math.max(0, currentYearIncome);

  // Validation: non-qualifying cannot exceed total gross
  let qualifyingRedundancy: number;
  let validationAlert: string | undefined;

  if (nonQualifying > grossPackage) {
    qualifyingRedundancy = 0;
    validationAlert = 'Non-qualifying compensation exceeds the total gross package. The qualifying redundancy has been set to £0.';
  } else {
    qualifyingRedundancy = grossPackage - nonQualifying;
  }

  // Apply £30,000 tax-free exemption
  const taxFreePortion = Math.min(qualifyingRedundancy, 30000);
  const taxableExcess = Math.max(0, qualifyingRedundancy - 30000);

  // Total additional taxable income from the redundancy
  const totalAdditionalTaxable = nonQualifying + taxableExcess;

  // Select tax bands based on region
  const bands = region === 'scotland' ? SCOTLAND_BANDS : ENGLAND_BANDS;

  // Calculate income tax with marginal approach:
  // Tax on (currentYearIncome + totalAdditionalTaxable) minus tax on (currentYearIncome)
  const taxWithPackage = calculateTaxForIncome(yearIncome + totalAdditionalTaxable, bands);
  const taxWithoutPackage = calculateTaxForIncome(yearIncome, bands);

  const totalIncomeTax = Math.max(0, taxWithPackage.totalTax - taxWithoutPackage.totalTax);

  // Build the income tax breakdown for the package portion only
  // We take the breakdown WITH the package and subtract the breakdown WITHOUT it
  const incomeTaxBreakdown: TaxBandBreakdown[] = taxWithPackage.breakdown.map((bandWith, index) => {
    const bandWithout = taxWithoutPackage.breakdown[index];
    return {
      bandName: bandWith.bandName,
      rate: bandWith.rate,
      amountInBand: bandWith.amountInBand - (bandWithout?.amountInBand || 0),
      taxPaid: bandWith.taxPaid - (bandWithout?.taxPaid || 0),
    };
  });

  // Employee National Insurance
  // Qualifying redundancy is ALWAYS exempt from employee NI
  // Only non-qualifying compensation is subject to employee NI
  const niWithPackage = calculateNIContributions(yearIncome + nonQualifying);
  const niWithoutPackage = calculateNIContributions(yearIncome);
  const nonQualifyingNI = Math.max(0, niWithPackage - niWithoutPackage);

  const niBreakdown: NIBreakdown = {
    qualifyingNI: 0,
    nonQualifyingNI,
    totalNI: nonQualifyingNI,
  };

  const employeeNI = nonQualifyingNI;
  const totalDeductions = totalIncomeTax + employeeNI;
  const netTakeHome = grossPackage - totalDeductions;

  return {
    qualifyingRedundancy,
    taxFreePortion,
    taxableExcess,
    totalAdditionalTaxable,
    totalIncomeTax,
    employeeNI,
    totalDeductions,
    netTakeHome,
    incomeTaxBreakdown,
    niBreakdown,
    validationAlert,
  };
}
