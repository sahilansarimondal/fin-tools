export type CoastFireByAgeInput = {
  currentAge: number;
  targetRetirementAge: number;
  annualExpenses: number;
  safeWithdrawalRate: number;
  currentNetWorth: number;
  realAnnualReturn: number;
};

export type AgeRow = {
  age: number;
  coastRequired: number;
  projectedPortfolio: number;
};

export type CoastFireByAgeResult = {
  fireTarget: number;
  currentCoastRequired: number;
  hasReachedCoast: boolean;
  surplus: number;
  gap: number;
  ageGrid: AgeRow[];
};

export function calculateCoastFireByAge(input: CoastFireByAgeInput): CoastFireByAgeResult {
  const { currentAge, targetRetirementAge, annualExpenses, safeWithdrawalRate, currentNetWorth, realAnnualReturn } = input;

  // 1. FIRE Target = E / (SWR / 100)
  const fireTarget = annualExpenses / (safeWithdrawalRate / 100);

  const r = realAnnualReturn / 100;

  // 2. Current Coast FIRE status
  const yearsToRetirement = Math.max(targetRetirementAge - currentAge, 0);
  const currentCoastRequired = yearsToRetirement > 0
    ? fireTarget / Math.pow(1 + r, yearsToRetirement)
    : fireTarget;

  const hasReachedCoast = currentNetWorth >= currentCoastRequired;
  const surplus = hasReachedCoast ? currentNetWorth - currentCoastRequired : 0;
  const gap = hasReachedCoast ? 0 : currentCoastRequired - currentNetWorth;

  // 3. Age-by-age grid
  const ageGrid: AgeRow[] = [];
  for (let age = currentAge; age <= targetRetirementAge; age++) {
    const tA = targetRetirementAge - age;
    const coastRequired = tA > 0 ? fireTarget / Math.pow(1 + r, tA) : fireTarget;

    const yearsFromNow = age - currentAge;
    const projectedPortfolio = currentNetWorth * Math.pow(1 + r, yearsFromNow);

    ageGrid.push({ age, coastRequired, projectedPortfolio });
  }

  return {
    fireTarget,
    currentCoastRequired,
    hasReachedCoast,
    surplus,
    gap,
    ageGrid,
  };
}
