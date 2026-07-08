// UK Redundancy Pay Tax Calculator
// Implements HMRC 2026/2027 tax year rules for redundancy payments over £30,000

const PERSONAL_ALLOWANCE = 12570; // 2026/27

// England/Wales/NI bands (2026/27)
const ENG_BANDS = [
  { name: 'Personal Allowance', limit: 12570, rate: 0 },
  { name: 'Basic Rate', limit: 50270, rate: 0.20 },
  { name: 'Higher Rate', limit: 125140, rate: 0.40 },
  { name: 'Additional Rate', limit: Infinity, rate: 0.45 },
];

// Scotland bands (2026/27)
const SCO_BANDS = [
  { name: 'Personal Allowance', limit: 12570, rate: 0 },
  { name: 'Starter Rate', limit: 14876, rate: 0.19 },
  { name: 'Basic Rate', limit: 26561, rate: 0.20 },
  { name: 'Intermediate Rate', limit: 43662, rate: 0.21 },
  { name: 'Higher Rate', limit: 75000, rate: 0.42 },
  { name: 'Advanced Rate', limit: 125140, rate: 0.45 },
  { name: 'Top Rate', limit: Infinity, rate: 0.48 },
];

// Employee NI rates (2026/27)
const NI_PRIMARY_THRESHOLD = 12570; // annual
const NI_UPPER_THRESHOLD = 50270;   // annual
const NI_MAIN_RATE = 0.08;          // 8% between primary and upper
const NI_HIGHER_RATE = 0.02;        // 2% above upper

export interface RedundancyInput {
  totalGrossPackage: number;         // Total gross redundancy package (£)
  nonQualifyingCompensation: number; // PILON, holiday pay, bonuses, etc.
  currentYearIncome: number;         // Taxable income earned this tax year so far
  region: 'england' | 'scotland';   // Tax region
}

export interface TaxBandBreakdown {
  band: string;
  rate: number;
  amountInBand: number;
  taxInBand: number;
}

export interface RedundancyResult {
  qualifyingRedundancy: number;       // Total Gross - Non-Qualifying (clamped to 0)
  taxFreePortion: number;             // min(qualifying, 30000)
  taxableExcess: number;              // qualifying - 30000 (clamped to 0)
  totalAdditionalTaxable: number;     // nonQualifying + taxableExcess
  incomeTaxOnPackage: number;         // Marginal income tax on the package
  employeeNIOnNonQualifying: number;  // NI on non-qualifying only
  totalDeductions: number;            // incomeTax + employeeNI
  netTakeHome: number;                // totalGross - totalDeductions
  totalTaxFree: number;               // taxFreePortion (for display)
  taxBreakdown: TaxBandBreakdown[];   // Breakdown for itemized table
  employerNIOnExcess: number;         // 15% on qualifying excess over 30k
  validationError: string | null;     // If non-qualifying > total gross
}

/**
 * Calculate income tax for a given income level using specified bands.
 * Applies Personal Allowance taper: for every £2 of income over £100,000,
 * reduce PA by £1 (minimum £0).
 */
function calculateIncomeTax(income: number, bands: { name: string; limit: number; rate: number }[]): { tax: number; breakdown: TaxBandBreakdown[] } {
  // Calculate adjusted personal allowance
  const incomeOver100k = Math.max(0, income - 100000);
  const paReduction = Math.min(PERSONAL_ALLOWANCE, Math.floor(incomeOver100k / 2));
  const adjustedPA = Math.max(0, PERSONAL_ALLOWANCE - paReduction);

  const breakdown: TaxBandBreakdown[] = [];
  let remainingIncome = income;
  let totalTax = 0;
  let previousLimit = 0;

  for (const band of bands) {
    if (remainingIncome <= 0) break;

    // For Personal Allowance band, use the adjusted PA
    if (band.rate === 0) {
      const taxableInBand = Math.min(remainingIncome, adjustedPA);
      breakdown.push({
        band: band.name,
        rate: band.rate,
        amountInBand: taxableInBand,
        taxInBand: 0,
      });
      remainingIncome -= taxableInBand;
      previousLimit = band.limit;
      continue;
    }

    const bandWidth = band.limit === Infinity ? Infinity : band.limit - previousLimit;
    const taxableInBand = Math.min(remainingIncome, bandWidth);
    const taxInBand = taxableInBand * band.rate;

    breakdown.push({
      band: band.name,
      rate: band.rate,
      amountInBand: taxableInBand,
      taxInBand,
    });

    totalTax += taxInBand;
    remainingIncome -= taxableInBand;
    previousLimit = band.limit;
  }

  return { tax: totalTax, breakdown };
}

/**
 * Calculate employee National Insurance for non-qualifying compensation.
 * Stack the non-qualifying compensation on top of current year income.
 */
function calculateEmployeeNI(currentYearIncome: number, nonQualifyingComp: number): number {
  const totalForNI = currentYearIncome + nonQualifyingComp;

  // NI on combined income
  const niOnCombined = calculateSingleNI(totalForNI);
  // NI on current income alone
  const niOnCurrent = calculateSingleNI(currentYearIncome);

  // Marginal NI is the difference
  return Math.max(0, niOnCombined - niOnCurrent);
}

function calculateSingleNI(income: number): number {
  if (income <= NI_PRIMARY_THRESHOLD) return 0;

  const abovePrimary = income - NI_PRIMARY_THRESHOLD;
  const inMainBand = Math.min(abovePrimary, NI_UPPER_THRESHOLD - NI_PRIMARY_THRESHOLD);
  const aboveUpper = Math.max(0, abovePrimary - (NI_UPPER_THRESHOLD - NI_PRIMARY_THRESHOLD));

  return inMainBand * NI_MAIN_RATE + aboveUpper * NI_HIGHER_RATE;
}

/**
 * Calculate the full UK redundancy tax breakdown.
 */
export function calculateRedundancyTax(input: RedundancyInput): RedundancyResult {
  const { totalGrossPackage, nonQualifyingCompensation, currentYearIncome, region } = input;

  // Validation: non-qualifying cannot exceed total gross
  let validationError: string | null = null;
  if (nonQualifyingCompensation > totalGrossPackage) {
    validationError = 'Non-qualifying compensation exceeds total gross package. Qualifying redundancy set to £0.';
  }

  // 1. Qualifying redundancy
  const qualifyingRedundancy = Math.max(0, totalGrossPackage - nonQualifyingCompensation);

  // 2. £30,000 tax-free exemption
  const taxFreePortion = Math.min(qualifyingRedundancy, 30000);

  // 3. Taxable excess (over £30k)
  const taxableExcess = Math.max(0, qualifyingRedundancy - 30000);

  // 4. Total additional taxable income from the package
  const totalAdditionalTaxable = nonQualifyingCompensation + taxableExcess;

  // 5. Income Tax on package (marginal calculation)
  const bands = region === 'scotland' ? SCO_BANDS : ENG_BANDS;

  // Tax on combined income (current year + additional taxable)
  const combinedIncome = currentYearIncome + totalAdditionalTaxable;
  const { tax: taxOnCombined, breakdown: combinedBreakdown } = calculateIncomeTax(combinedIncome, bands);

  // Tax on current year income alone
  const { tax: taxOnCurrent } = calculateIncomeTax(currentYearIncome, bands);

  // Marginal tax on the package
  const incomeTaxOnPackage = Math.max(0, taxOnCombined - taxOnCurrent);

  // Get the breakdown for the additional taxable portion by comparing bands
  // We'll use the combined breakdown to show the marginal bands
  const taxBreakdown = combinedBreakdown;

  // 6. Employee NI on non-qualifying compensation only
  const employeeNIOnNonQualifying = calculateEmployeeNI(currentYearIncome, nonQualifyingCompensation);

  // 7. Total deductions
  const totalDeductions = incomeTaxOnPackage + employeeNIOnNonQualifying;

  // 8. Net take-home
  const netTakeHome = totalGrossPackage - totalDeductions;

  // 9. Employer NI on excess over £30k (informational)
  const employerNIOnExcess = Math.max(0, taxableExcess) * 0.15;

  return {
    qualifyingRedundancy,
    taxFreePortion,
    taxableExcess,
    totalAdditionalTaxable,
    incomeTaxOnPackage,
    employeeNIOnNonQualifying,
    totalDeductions,
    netTakeHome,
    totalTaxFree: taxFreePortion,
    taxBreakdown,
    employerNIOnExcess,
    validationError,
  };
}
