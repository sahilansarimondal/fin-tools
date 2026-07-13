function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// 2026 IRS Constants
const SS_WAGE_BASE = 184500;        // 2026 Social Security wage base
const SS_RATE = 0.124;              // 12.4% total SE tax for SS
const MEDICARE_RATE = 0.029;        // 2.9% standard Medicare
const ADDITIONAL_MEDICARE_RATE = 0.009; // 0.9% Additional Medicare Tax
const SE_DEDUCTION_FACTOR = 0.9235; // 92.35% (100% - 7.65% employer-equivalent deduction)
const ADDL_MED_THRESHOLDS: Record<string, number> = {
  single: 200000,
  mfj: 250000,
  mfs: 125000,
  hoh: 200000,
};

export type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh';

export interface SEEmploymentInputs {
  grossRevenue: number;
  deductibleExpenses: number;
  w2Salary: number;
  filingStatus: FilingStatus;
}

export interface SEEmploymentResult {
  netProfit: number;
  nese: number;                     // Net Earnings from Self-Employment
  socialSecurityTax: number;
  medicareTax: number;
  additionalMedicareTax: number;
  totalSETax: number;
  effectiveRate: number;            // totalSE / netProfit
  effectiveRateOnNESE: number;      // totalSE / NESE
  takeHome: number;                 // netProfit - totalSE
  breakdown: {
    grossRevenue: number;
    deductibleExpenses: number;
    netProfit: number;
    seDeduction: number;            // netProfit * 0.0765
    nese: number;
    remainingSSCap: number;
    taxableSSEarnings: number;
    w2Salary: number;
    addlMedThreshold: number;
    addlMedThresholdUsedByW2: number;
    addlMedThresholdAvailableForSE: number;
    addlMedIncomeSubjectToTax: number;
  };
  warnings: string[];
}

export function calculateSEEmploymentTax(inputs: SEEmploymentInputs): SEEmploymentResult {
  const warnings: string[] = [];

  // 1. Net Profit
  const netProfit = round2(Math.max(0, inputs.grossRevenue - inputs.deductibleExpenses));

  if (inputs.grossRevenue < inputs.deductibleExpenses) {
    warnings.push('Deductible expenses exceed gross revenue. Net profit is $0.');
  }

  // 2. Net Earnings from Self-Employment (7.65% deduction)
  const nese = round2(netProfit * SE_DEDUCTION_FACTOR);

  // 3. Social Security Tax (12.4%)
  // W-2 wages apply to the SS cap first
  const remainingSSCap = round2(Math.max(0, SS_WAGE_BASE - inputs.w2Salary));
  const taxableSSEarnings = round2(Math.min(nese, remainingSSCap));
  const socialSecurityTax = round2(taxableSSEarnings * SS_RATE);

  if (inputs.w2Salary >= SS_WAGE_BASE) {
    warnings.push('Your W-2 salary already exceeds the Social Security wage base ($184,500). You owe no Social Security tax on your side hustle income.');
  } else if (taxableSSEarnings < nese && nese > 0) {
    warnings.push(`Only $${taxableSSEarnings.toLocaleString()} of your $${nese.toLocaleString()} NESE is subject to Social Security tax. The remaining $${round2(nese - taxableSSEarnings).toLocaleString()} is only subject to Medicare tax.`);
  }

  // 4. Standard Medicare Tax (2.9% on all NESE, no cap)
  const medicareTax = round2(nese * MEDICARE_RATE);

  // 5. Additional Medicare Tax (0.9%)
  const addlMedThreshold = ADDL_MED_THRESHOLDS[inputs.filingStatus] ?? 200000;
  const combinedIncome = inputs.w2Salary + nese;
  let additionalMedicareTax = 0;
  const addlMedThresholdUsedByW2 = Math.min(inputs.w2Salary, addlMedThreshold);
  const addlMedThresholdAvailableForSE = Math.max(0, addlMedThreshold - inputs.w2Salary);
  let addlMedIncomeSubjectToTax = 0;

  if (combinedIncome > addlMedThreshold) {
    addlMedIncomeSubjectToTax = round2(Math.max(0, nese - addlMedThresholdAvailableForSE));
    additionalMedicareTax = round2(addlMedIncomeSubjectToTax * ADDITIONAL_MEDICARE_RATE);
  }

  // 6. Totals
  const totalSETax = round2(socialSecurityTax + medicareTax + additionalMedicareTax);
  const effectiveRate = netProfit > 0 ? round2((totalSETax / netProfit) * 10000) / 100 : 0;
  const effectiveRateOnNESE = nese > 0 ? round2((totalSETax / nese) * 10000) / 100 : 0;
  const takeHome = round2(netProfit - totalSETax);

  // Warnings for zero/negative
  if (netProfit === 0) {
    warnings.push('Net profit is $0. No self-employment tax is owed, but you may still owe income tax on other earnings.');
  }

  return {
    netProfit,
    nese,
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    totalSETax,
    effectiveRate,
    effectiveRateOnNESE,
    takeHome,
    breakdown: {
      grossRevenue: inputs.grossRevenue,
      deductibleExpenses: inputs.deductibleExpenses,
      netProfit,
      seDeduction: round2(netProfit * 0.0765),
      nese,
      remainingSSCap,
      taxableSSEarnings,
      w2Salary: inputs.w2Salary,
      addlMedThreshold,
      addlMedThresholdUsedByW2,
      addlMedThresholdAvailableForSE,
      addlMedIncomeSubjectToTax,
    },
    warnings,
  };
}
