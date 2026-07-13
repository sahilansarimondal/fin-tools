export type SchemeType = '2013-2021' | '2021-2023';

export interface HelpToBuyInput {
  purchasePrice: number;        // Original property purchase price (£)
  equityLoanPercent: number;    // Usually 20%, up to 40% in London
  currentValue: number;         // Current estimated property value (£)
  schemeType: SchemeType;       // Which HTB scheme
  inflationRate: number;        // Expected RPI or CPI as decimal (e.g. 0.05 for 5%)
  yearsSincePurchase: number;   // 1 to 25
}

export interface YearData {
  year: number;
  interestRate: number;         // As percentage, e.g. 1.75
  annualFee: number;            // Annual interest cost in £
  monthlyPayment: number;       // Monthly cost in £
  capitalOwed: number;          // Current equity share owed in £
}

export interface HelpToBuyResult {
  originalLoan: number;
  currentCapitalOwed: number;
  capitalGrowthTrap: number;
  yearData: YearData[];
  monthlyCostAtSelectedYear: number;
  annualCostAtSelectedYear: number;
  interestRateAtSelectedYear: number;
  validationError: string | null;
}

const defaultResult: HelpToBuyResult = {
  originalLoan: 0,
  currentCapitalOwed: 0,
  capitalGrowthTrap: 0,
  yearData: [],
  monthlyCostAtSelectedYear: 0,
  annualCostAtSelectedYear: 0,
  interestRateAtSelectedYear: 0,
  validationError: null,
};

export function calculateHelpToBuy(input: HelpToBuyInput): HelpToBuyResult {
  // Validation
  if (input.purchasePrice <= 0) return { ...defaultResult, validationError: 'Purchase price must be greater than zero.' };
  if (input.equityLoanPercent <= 0 || input.equityLoanPercent > 100) return { ...defaultResult, validationError: 'Equity loan percentage must be between 0.01% and 100%.' };
  if (input.currentValue <= 0) return { ...defaultResult, validationError: 'Current property value must be greater than zero.' };
  if (input.inflationRate < 0 || input.inflationRate > 0.20) return { ...defaultResult, validationError: 'Inflation rate must be between 0% and 20%.' };
  if (input.yearsSincePurchase < 1 || input.yearsSincePurchase > 25) return { ...defaultResult, validationError: 'Years since purchase must be between 1 and 25.' };

  // Capital calculations
  const originalLoan = input.purchasePrice * (input.equityLoanPercent / 100);
  const currentCapitalOwed = input.currentValue * (input.equityLoanPercent / 100);
  const capitalGrowthTrap = currentCapitalOwed - originalLoan;

  // Interest rate progression
  const multiplier = input.schemeType === '2013-2021'
    ? 1 + input.inflationRate + 0.01   // RPI + 1%
    : 1 + input.inflationRate + 0.02;  // CPI + 2%

  const yearData: YearData[] = [];
  let previousRate = 0;

  for (let year = 1; year <= 25; year++) {
    let rate: number;

    if (year <= 5) {
      rate = 0;
    } else if (year === 6) {
      rate = 1.75;
    } else {
      // Compound: R_n = R_{n-1} × multiplier
      rate = parseFloat((previousRate * multiplier).toFixed(4));
    }

    // Interest is charged on ORIGINAL loan amount, NOT current property value
    const annualFee = originalLoan * (rate / 100);
    const monthlyPayment = (annualFee / 12) + 1; // + £1 management fee

    yearData.push({
      year,
      interestRate: rate,
      annualFee,
      monthlyPayment,
      capitalOwed: currentCapitalOwed,
    });

    previousRate = rate;
  }

  const selectedYear = input.yearsSincePurchase;
  const selectedData = yearData[selectedYear - 1];

  return {
    originalLoan,
    currentCapitalOwed,
    capitalGrowthTrap,
    yearData,
    monthlyCostAtSelectedYear: selectedData.monthlyPayment,
    annualCostAtSelectedYear: selectedData.annualFee,
    interestRateAtSelectedYear: selectedData.interestRate,
    validationError: null,
  };
}
