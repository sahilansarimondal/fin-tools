/**
 * One More Year (OMY) Syndrome Cost Calculator — Calculation Engine
 *
 * Quantifies the financial benefit and time cost of delaying retirement
 * by 1-5 years after already hitting a FIRE number.
 */

export type OMYInput = {
  currentPortfolio: number;      // e.g., 1500000
  annualExpenses: number;        // e.g., 60000
  annualSavings: number;         // e.g., 50000 (saved from salary during extra years)
  expectedRealReturn: number;    // percentage, e.g., 6
  safeWithdrawalRate: number;    // percentage, e.g., 4
  extraYearsToWork: number;      // 1-5, default 1
};

export type YearProjection = {
  year: number;
  retireTodayPortfolio: number;
  omyPortfolio: number;
};

export type OMYResult = {
  // Baseline
  baselinePortfolio: number;
  baselineSafeIncome: number;
  // OMY scenario
  omyPortfolioValue: number;
  omySafeIncome: number;
  // Net benefits
  portfolioBoost: number;
  perpetualIncomeBoost: number;
  // Lifestyle converters
  extraVacationsPerYear: number;
  extraCarsPerYear: number;
  // Time cost
  hoursTraded: number;
  // Chart data
  projection: YearProjection[];
};

/**
 * Calculates the financial impact of working one more year (or more)
 * after already reaching a FIRE number.
 *
 * @param input - The OMY input parameters
 * @returns An OMYResult with all computed values
 */
export function calculateOMY(input: OMYInput): OMYResult {
  const {
    currentPortfolio,
    annualExpenses: _annualExpenses,
    annualSavings,
    expectedRealReturn,
    safeWithdrawalRate,
    extraYearsToWork,
  } = input;

  const r = expectedRealReturn / 100;
  const n = extraYearsToWork;

  // 1. Baseline Safe Income
  const baselineSafeIncome = currentPortfolio * (safeWithdrawalRate / 100);

  // 2. OMY Portfolio (Future Value with annual additions)
  let omyPortfolioValue: number;

  if (r === 0) {
    omyPortfolioValue = currentPortfolio + annualSavings * n;
  } else {
    omyPortfolioValue =
      currentPortfolio * Math.pow(1 + r, n) +
      annualSavings * ((Math.pow(1 + r, n) - 1) / r);
  }

  // 3. OMY Safe Income
  const omySafeIncome = omyPortfolioValue * (safeWithdrawalRate / 100);

  // 4. Portfolio Boost
  const portfolioBoost = omyPortfolioValue - currentPortfolio;

  // 5. Perpetual Income Boost
  const perpetualIncomeBoost = omySafeIncome - baselineSafeIncome;

  // 6. Lifestyle Converters
  const extraVacationsPerYear = Math.floor(perpetualIncomeBoost / 5000);
  const extraCarsPerYear = perpetualIncomeBoost / 40000;

  // 7. Time Cost
  const hoursTraded = n * 2080;

  // 8. Chart Projection (30 years from "retire today" point)
  const projection: YearProjection[] = [];
  let retireTodayBalance = currentPortfolio;
  let omyBalance = omyPortfolioValue;

  for (let year = 0; year <= 30; year++) {
    projection.push({
      year,
      retireTodayPortfolio: Math.max(retireTodayBalance, 0),
      omyPortfolio: Math.max(omyBalance, 0),
    });

    // Compound and withdraw for next year
    retireTodayBalance = retireTodayBalance * (1 + r) - baselineSafeIncome;
    if (retireTodayBalance < 0) retireTodayBalance = 0;

    omyBalance = omyBalance * (1 + r) - omySafeIncome;
    if (omyBalance < 0) omyBalance = 0;
  }

  return {
    baselinePortfolio: currentPortfolio,
    baselineSafeIncome,
    omyPortfolioValue,
    omySafeIncome,
    portfolioBoost,
    perpetualIncomeBoost,
    extraVacationsPerYear,
    extraCarsPerYear,
    hoursTraded,
    projection,
  };
}
