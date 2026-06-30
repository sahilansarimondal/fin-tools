export type CoastFireShiftInput = {
  currentAge: number;
  transitionAge: number;
  retirementAge: number;
  currentNetWorth: number;
  annualSavings: number;
  fullRetirementExpenses: number;
  partTimeExpenses: number;
  partTimeIncome: number;
  annualReturnRate: number;
  inflationRate: number;
  safeWithdrawalRate: number;
  useRealRate: boolean;
};

export type CoastFireShiftProjection = {
  age: number;
  year: number;
  savings: number;
  contributions: number;
  growth: number;
  drawdown: number;
  target: number;
  phase: 'accumulation' | 'part-time' | 'retirement';
};

export type CoastFireShiftResult = {
  nestEggTarget: number;
  realRate: number;
  transitionRequired: number;
  transitionProjected: number;
  hasAchievedCoast: boolean;
  gap: number;
  surplus: number;
  progress: number;
  projection: CoastFireShiftProjection[];
  yearsInAccumulation: number;
  yearsInPartTime: number;
  yearsInRetirement: number;
  annualGap: number;
  oneMoreYearCost: number;
};

function calculateRealRate(nominalRate: number, inflationRate: number, useRealRate: boolean): number {
  if (useRealRate) {
    return (1 + nominalRate / 100) / (1 + inflationRate / 100) - 1;
  }
  return (nominalRate - inflationRate) / 100;
}

function calculateNestEggTarget(fullRetirementExpenses: number, swr: number): number {
  return fullRetirementExpenses / (swr / 100);
}

function calculateTransitionRequired(
  nestEggTarget: number,
  realRate: number,
  yearsInPartTime: number,
  annualGap: number
): number {
  if (yearsInPartTime <= 0) return nestEggTarget;

  const discountFactor = Math.pow(1 + realRate, yearsInPartTime);
  const baseRequired = nestEggTarget / discountFactor;

  if (annualGap <= 0) {
    return baseRequired;
  }

  // Model 2: Part-time requires drawdown support
  // Geometric series sum: Gap * [1 - (1+r)^-n] / r
  const drawdownPresentValue = annualGap * ((1 - Math.pow(1 + realRate, -yearsInPartTime)) / realRate);
  return baseRequired + drawdownPresentValue;
}

function calculateTransitionProjected(
  currentNetWorth: number,
  realRate: number,
  yearsInAccumulation: number,
  annualSavings: number
): number {
  if (yearsInAccumulation <= 0) return currentNetWorth;
  // Future value of current savings + future value of annuity (annual savings)
  const futureValueOfSavings = currentNetWorth * Math.pow(1 + realRate, yearsInAccumulation);
  if (annualSavings <= 0 || realRate === 0) {
    return futureValueOfSavings + annualSavings * yearsInAccumulation;
  }
  const futureValueOfAnnuity = annualSavings * ((Math.pow(1 + realRate, yearsInAccumulation) - 1) / realRate);
  return futureValueOfSavings + futureValueOfAnnuity;
}

export function calculateCoastFireShift(input: CoastFireShiftInput): CoastFireShiftResult {
  const {
    currentAge,
    transitionAge,
    retirementAge,
    currentNetWorth,
    annualSavings,
    fullRetirementExpenses,
    partTimeExpenses,
    partTimeIncome,
    annualReturnRate,
    inflationRate,
    safeWithdrawalRate,
    useRealRate,
  } = input;

  const yearsInAccumulation = Math.max(transitionAge - currentAge, 0);
  const yearsInPartTime = Math.max(retirementAge - transitionAge, 0);
  const yearsInRetirement = Math.max(retirementAge - currentAge, 0);

  const realRate = calculateRealRate(annualReturnRate, inflationRate, useRealRate);
  const nestEggTarget = calculateNestEggTarget(fullRetirementExpenses, safeWithdrawalRate);
  const annualGap = Math.max(partTimeExpenses - partTimeIncome, 0);

  const transitionRequired = calculateTransitionRequired(
    nestEggTarget,
    realRate,
    yearsInPartTime,
    annualGap
  );

  const transitionProjected = calculateTransitionProjected(
    currentNetWorth,
    realRate,
    yearsInAccumulation,
    annualSavings
  );

  const hasAchievedCoast = transitionProjected >= transitionRequired;
  const gap = hasAchievedCoast ? 0 : transitionRequired - transitionProjected;
  const surplus = hasAchievedCoast ? transitionProjected - transitionRequired : 0;
  const progress = Math.min((transitionProjected / transitionRequired) * 100, 100);

  // Calculate "One More Year" cost index
  // What happens if you work one more year at full income?
  // This accelerates accumulation by one year
  const oneMoreYearProjected = calculateTransitionProjected(
    currentNetWorth,
    realRate,
    yearsInAccumulation + 1,
    annualSavings
  );
  const oneMoreYearCost = transitionRequired - oneMoreYearProjected;
  const oneMoreYearCostAdjusted = Math.max(0, oneMoreYearCost);

  // Build projection array
  const projection: CoastFireShiftProjection[] = [];
  let balance = currentNetWorth;

  // Accumulation phase (current age to transition age)
  for (let year = 0; year <= yearsInAccumulation; year++) {
    const age = currentAge + year;
    const targetAtAge = transitionRequired / Math.pow(1 + realRate, yearsInAccumulation - year);

    if (year > 0) {
      const yearlyGrowth = balance * realRate;
      balance = balance + yearlyGrowth + annualSavings;
    }

    projection.push({
      age,
      year,
      savings: balance,
      contributions: year > 0 ? annualSavings : 0,
      growth: year > 0 ? (balance - annualSavings) * realRate / (1 + realRate) : 0,
      drawdown: 0,
      target: targetAtAge,
      phase: 'accumulation',
    });
  }

  // Part-time phase (transition age to retirement age)
  let partTimeBalance = balance;
  for (let year = 1; year <= yearsInPartTime; year++) {
    const age = transitionAge + year;
    const yearsRemaining = yearsInPartTime - year + 1;
    let targetAtAge = transitionRequired / Math.pow(1 + realRate, yearsRemaining);
    if (annualGap > 0) {
      targetAtAge += annualGap * ((1 - Math.pow(1 + realRate, -yearsRemaining)) / realRate);
    }

    const yearlyGrowth = partTimeBalance * realRate;
    const yearlyDrawdown = annualGap;
    partTimeBalance = partTimeBalance + yearlyGrowth - yearlyDrawdown;
    partTimeBalance = Math.max(partTimeBalance, 0);

    projection.push({
      age,
      year: yearsInAccumulation + year,
      savings: partTimeBalance,
      contributions: 0,
      growth: yearlyGrowth,
      drawdown: yearlyDrawdown,
      target: targetAtAge,
      phase: 'part-time',
    });
  }

  // Retirement phase (retirement age + 20 years for visibility)
  let retirementBalance = partTimeBalance;
  for (let year = 1; year <= 20; year++) {
    const age = retirementAge + year;
    const yearlyGrowth = retirementBalance * realRate;
    const yearlyDrawdown = fullRetirementExpenses;
    retirementBalance = retirementBalance + yearlyGrowth - yearlyDrawdown;
    retirementBalance = Math.max(retirementBalance, 0);

    projection.push({
      age,
      year: yearsInAccumulation + yearsInPartTime + year,
      savings: retirementBalance,
      contributions: 0,
      growth: yearlyGrowth,
      drawdown: yearlyDrawdown,
      target: nestEggTarget,
      phase: 'retirement',
    });
  }

  return {
    nestEggTarget,
    realRate: realRate * 100,
    transitionRequired,
    transitionProjected,
    hasAchievedCoast,
    gap,
    surplus,
    progress,
    projection,
    yearsInAccumulation,
    yearsInPartTime,
    yearsInRetirement,
    annualGap,
    oneMoreYearCost: oneMoreYearCostAdjusted,
  };
}

export function generateCoastFireShiftScenarios(input: CoastFireShiftInput): Record<string, CoastFireShiftResult> {
  return {
    current: calculateCoastFireShift(input),
    // Could add scenario variations here (e.g., different transition ages)
  };
}