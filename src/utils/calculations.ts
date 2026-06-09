export type FIREType = 'lean' | 'regular' | 'fat' | 'coast';

export type FIREMultipliers = Record<FIREType, number>;

export const FIRE_MULTIPLIERS: FIREMultipliers = {
  lean: 20,
  regular: 25,
  fat: 30,
  coast: 25,
};

export type FIREInput = {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyIncome: number;
  savingsRate: number;
  monthlyExpenses: number;
  annualReturnRate: number;
  inflationRate: number;
  safeWithdrawalRate: number;
  fireType: FIREType;
};

export type FIREProjection = {
  year: number;
  age: number;
  savings: number;
  contributions: number;
  growth: number;
  target: number;
  isRetired: boolean;
};

export type FIREResult = {
  fireNumber: number;
  yearsToRetirement: number;
  monthsToRetirement: number;
  monthlyInvestmentNeeded: number;
  totalContributions: number;
  totalGrowth: number;
  fireProgress: number;
  coastFireNumber: number;
  coastFireProgress: number;
  currentCoastFireAge: number;
  projection: FIREProjection[];
  survivabilityYears: number;
  annualExpenses: number;
  monthlyExpensesInRetirement: number;
};

export function calculateFIRE(input: FIREInput): FIREResult {
  const {
    currentAge,
    retirementAge,
    currentSavings,
    monthlyIncome,
    savingsRate,
    monthlyExpenses,
    annualReturnRate,
    inflationRate,
    safeWithdrawalRate,
    fireType,
  } = input;

  const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
  const multiplier = FIRE_MULTIPLIERS[fireType];
  const annualExpenses = monthlyExpenses * 12;
  const adjustedExpenses = annualExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);
  const fireNumber = adjustedExpenses * multiplier;

  const monthlyReturnRate = annualReturnRate / 100 / 12;
  const monthlySavingsAmount = monthlyIncome * (savingsRate / 100);

  let balance = currentSavings;
  const projection: FIREProjection[] = [];
  let totalContributions = 0;
  let totalGrowth = 0;

  for (let year = 0; year <= yearsToRetirement + 10; year++) {
    const age = currentAge + year;
    const target = fireNumber * Math.pow(1 + inflationRate / 100, year);
    const isRetired = age >= retirementAge;

    if (year > 0) {
      const yearlyContribution = isRetired ? 0 : monthlySavingsAmount * 12;
      const yearlyGrowth = balance * (annualReturnRate / 100);

      balance = balance + yearlyGrowth + yearlyContribution;
      totalContributions += yearlyContribution;
      totalGrowth += yearlyGrowth;
    }

    projection.push({
      year,
      age,
      savings: balance,
      contributions: totalContributions,
      growth: totalGrowth,
      target,
      isRetired,
    });
  }

  const fireProgress = Math.min((currentSavings / fireNumber) * 100, 100);

  const coastFireNumber = fireNumber / Math.pow(1 + annualReturnRate / 100, yearsToRetirement);
  const coastFireProgress = Math.min((currentSavings / coastFireNumber) * 100, 100);

  const currentCoastFireAge = calculateCoastFireAge(
    currentSavings,
    fireNumber,
    annualReturnRate,
    currentAge
  );

  let monthlyInvestmentNeeded = 0;
  if (monthlyReturnRate > 0 && yearsToRetirement > 0) {
    const months = yearsToRetirement * 12;
    const fvFactor = Math.pow(1 + monthlyReturnRate, months);
    monthlyInvestmentNeeded =
      ((fireNumber - currentSavings * fvFactor) * monthlyReturnRate) / (fvFactor - 1);
    monthlyInvestmentNeeded = Math.max(monthlyInvestmentNeeded, 0);
  } else if (yearsToRetirement > 0) {
    monthlyInvestmentNeeded = Math.max(
      (fireNumber - currentSavings) / (yearsToRetirement * 12),
      0
    );
  }

  const monthlyExpensesInRetirement = adjustedExpenses / 12;
  const survivabilityYears = fireNumber > 0
    ? fireNumber / (adjustedExpenses > 0 ? adjustedExpenses : 1)
    : 0;

  return {
    fireNumber,
    yearsToRetirement,
    monthsToRetirement: yearsToRetirement * 12,
    monthlyInvestmentNeeded,
    totalContributions,
    totalGrowth,
    fireProgress,
    coastFireNumber,
    coastFireProgress,
    currentCoastFireAge,
    projection,
    survivabilityYears,
    annualExpenses: adjustedExpenses,
    monthlyExpensesInRetirement,
  };
}

function calculateCoastFireAge(
  currentSavings: number,
  target: number,
  annualReturnRate: number,
  currentAge: number
): number {
  if (currentSavings >= target) return currentAge;
  if (annualReturnRate <= 0) return Infinity;

  const rate = annualReturnRate / 100;
  const yearsNeeded = Math.log(target / currentSavings) / Math.log(1 + rate);
  return Math.ceil(currentAge + yearsNeeded);
}

export function generateScenarios(input: FIREInput): Record<FIREType, FIREResult> {
  return {
    lean: calculateFIRE({ ...input, fireType: 'lean' }),
    regular: calculateFIRE({ ...input, fireType: 'regular' }),
    fat: calculateFIRE({ ...input, fireType: 'fat' }),
    coast: calculateFIRE({ ...input, fireType: 'coast' }),
  };
}
