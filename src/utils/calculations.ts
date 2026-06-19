export type FIREType = 'lean' | 'regular' | 'fat' | 'coast' | 'barista';

export type FIREMultipliers = Record<FIREType, number>;

export const FIRE_MULTIPLIERS: FIREMultipliers = {
  lean: 20,
  regular: 25,
  fat: 30,
  coast: 25,
  barista: 25,
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
  partTimeIncome: number;
  lifestyleMultiplier?: number;
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
  yearsToFIRE: number | null;
  traditionalFireNumber: number;
  baristaSavings: number;
  baristaGapPerMonth: number;
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
    partTimeIncome,
  } = input;

  const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
  const multiplier = input.lifestyleMultiplier ?? FIRE_MULTIPLIERS[fireType];
  const annualExpenses = monthlyExpenses * 12;
  const adjustedExpenses = annualExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);
  const traditionalFireNumber = adjustedExpenses * multiplier;
  const effectiveExpenses = fireType === 'barista'
    ? Math.max(adjustedExpenses - partTimeIncome * 12, 0)
    : adjustedExpenses;
  const fireNumber = effectiveExpenses * multiplier;
  const baristaSavings = Math.max(traditionalFireNumber - fireNumber, 0);
  const baristaGapPerMonth = fireType === 'barista' ? effectiveExpenses / 12 : 0;

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

  const yearsToFIRE = calculateYearsToFIRE(
    currentSavings,
    fireNumber,
    annualReturnRate,
    monthlyIncome,
    savingsRate,
    currentAge
  );

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
    yearsToFIRE,
    traditionalFireNumber,
    baristaSavings,
    baristaGapPerMonth,
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

function calculateYearsToFIRE(
  currentSavings: number,
  fireNumber: number,
  annualReturnRate: number,
  monthlyIncome: number,
  savingsRate: number,
  currentAge: number
): number | null {
  if (currentSavings >= fireNumber) return 0;

  const annualReturnRateDecimal = annualReturnRate / 100;
  const monthlySavings = monthlyIncome * (savingsRate / 100);
  const yearlyContribution = monthlySavings * 12;

  let balance = currentSavings;
  const maxAge = 70;

  for (let age = currentAge + 1; age <= maxAge; age++) {
    const yearlyGrowth = balance * annualReturnRateDecimal;
    balance = balance + yearlyGrowth + yearlyContribution;

    if (balance >= fireNumber) {
      return age - currentAge;
    }
  }

  return null;
}

export type CoastFireNumberInput = {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  annualReturnRate: number;
  annualExpenses: number;
};

export type CoastFireNumberResult = {
  fireNumber: number;
  coastNumber: number;
  gap: number;
  hasCoasted: boolean;
  progress: number;
  projectedValue: number;
  projection: { age: number; savings: number; target: number }[];
};

export function calculateCoastFireNumber(input: CoastFireNumberInput): CoastFireNumberResult {
  const { currentAge, retirementAge, currentSavings, annualReturnRate, annualExpenses } = input;

  const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
  const fireNumber = annualExpenses * 25;
  const rate = annualReturnRate / 100;

  const coastNumber = yearsToRetirement > 0
    ? fireNumber / Math.pow(1 + rate, yearsToRetirement)
    : fireNumber;

  const hasCoasted = currentSavings >= coastNumber;
  const gap = hasCoasted ? 0 : coastNumber - currentSavings;
  const progress = Math.min((currentSavings / coastNumber) * 100, 100);
  const projectedValue = currentSavings * Math.pow(1 + rate, yearsToRetirement);

  const projection: { age: number; savings: number; target: number }[] = [];
  for (let year = 0; year <= yearsToRetirement; year++) {
    projection.push({
      age: currentAge + year,
      savings: currentSavings * Math.pow(1 + rate, year),
      target: fireNumber,
    });
  }

  return { fireNumber, coastNumber, gap, hasCoasted, progress, projectedValue, projection };
}

export function generateScenarios(input: FIREInput): Record<FIREType, FIREResult> {
  const { lifestyleMultiplier, ...baseInput } = input;
  return {
    lean: calculateFIRE({ ...baseInput, fireType: 'lean' }),
    regular: calculateFIRE({ ...baseInput, fireType: 'regular' }),
    fat: calculateFIRE({ ...baseInput, fireType: 'fat' }),
    coast: calculateFIRE({ ...baseInput, fireType: 'coast' }),
    barista: calculateFIRE({ ...baseInput, fireType: 'barista' }),
  };
}
