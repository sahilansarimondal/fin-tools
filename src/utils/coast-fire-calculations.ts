export type CoastFireInput = {
  currentAge: number;
  retirementAge: number;
  annualExpenses: number;
  currentSavings: number;
  monthlyContributions: number;
  annualReturnRate: number;
  inflationRate: number;
  safeWithdrawalRate: number;
  annualFees: number;
  withdrawalMultiplier: number;
};

export type CoastFireProjection = {
  age: number;
  year: number;
  savings: number;
  contributions: number;
  growth: number;
  fees: number;
  target: number;
};

export type CoastFireResult = {
  fireNumber: number;
  futureFireNumber: number;
  coastNumber: number;
  hasReachedCoast: boolean;
  gap: number;
  surplus: number;
  progress: number;
  coastAge: number | null;
  projectedValueAtRetirement: number;
  projectedAnnualIncome: number;
  projectedAnnualIncomeShortfall: number;
  totalContributions: number;
  totalGrowth: number;
  totalFees: number;
  yearsToRetirement: number;
  projection: CoastFireProjection[];
};

export function calculateCoastFire(input: CoastFireInput): CoastFireResult {
  const {
    currentAge,
    retirementAge,
    annualExpenses,
    currentSavings,
    monthlyContributions,
    annualReturnRate,
    inflationRate,
    safeWithdrawalRate,
    annualFees,
    withdrawalMultiplier,
  } = input;

  const yearsToRetirement = Math.max(retirementAge - currentAge, 0);

  const fireNumber = annualExpenses * withdrawalMultiplier;

  const effectiveNominalRate = Math.max((annualReturnRate - annualFees) / 100, 0);
  const monthlyRate = effectiveNominalRate / 12;
  const inflationRateDecimal = inflationRate / 100;

  const futureFireNumber = fireNumber * Math.pow(1 + inflationRateDecimal, yearsToRetirement);

  const coastNumber = yearsToRetirement > 0
    ? futureFireNumber / Math.pow(1 + effectiveNominalRate, yearsToRetirement)
    : futureFireNumber;

  let projection: CoastFireProjection[] = [];
  let balance = currentSavings;
  let totalContributions = 0;
  let totalGrowth = 0;
  let totalFees = 0;
  let foundCoastAge = false;
  let coastAge: number | null = null;

  for (let year = 0; year <= yearsToRetirement; year++) {
    const age = currentAge + year;
    const targetAtAge = fireNumber * Math.pow(1 + inflationRateDecimal, year);

    if (year > 0) {
      const yearlyContributions = monthlyContributions * 12;
      const yearlyGrowth = balance * effectiveNominalRate;
      const yearlyFees = balance * (annualFees / 100);

      balance = balance + yearlyGrowth + yearlyContributions - yearlyFees;
      totalContributions += yearlyContributions;
      totalGrowth += yearlyGrowth;
      totalFees += yearlyFees;
    }

    projection.push({
      age,
      year,
      savings: balance,
      contributions: totalContributions,
      growth: totalGrowth,
      fees: totalFees,
      target: targetAtAge,
    });

    if (!foundCoastAge && balance >= targetAtAge && age >= currentAge) {
      coastAge = age;
      foundCoastAge = true;
    }
  }

  const hasReachedCoast = currentSavings >= coastNumber;
  const gap = hasReachedCoast ? 0 : coastNumber - currentSavings;
  const surplus = hasReachedCoast ? currentSavings - coastNumber : 0;
  const progress = Math.min((currentSavings / coastNumber) * 100, 100);

  const projectedValueAtRetirement = balance;
  const projectedAnnualIncome = projectedValueAtRetirement * (safeWithdrawalRate / 100);
  const projectedAnnualIncomeShortfall = Math.max(annualExpenses * Math.pow(1 + inflationRateDecimal, yearsToRetirement) - projectedAnnualIncome, 0);

  return {
    fireNumber,
    futureFireNumber,
    coastNumber,
    hasReachedCoast,
    gap,
    surplus,
    progress,
    coastAge,
    projectedValueAtRetirement,
    projectedAnnualIncome,
    projectedAnnualIncomeShortfall,
    totalContributions,
    totalGrowth,
    totalFees,
    yearsToRetirement,
    projection,
  };
}
