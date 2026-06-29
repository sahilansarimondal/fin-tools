/**
 * Perpetual Safe Withdrawal Rate (PSWR) — Calculation Engine
 *
 * Computes the maximum safe withdrawal rate that allows a portfolio to
 * maintain its real (inflation-adjusted) value in perpetuity. Uses the
 * exact Fisher Equation to derive the real return, then subtracts
 * investment fees to arrive at the perpetual withdrawal rate.
 *
 * Key insight: The "Inflation Illusion" — while the real portfolio value
 * stays flat, the nominal value balloons enormously over long horizons
 * due to compounding inflation.
 */

export type PSWRInput = {
  /** Total portfolio value in dollars (e.g., 2000000) */
  initialPortfolio: number;
  /** Annual nominal market return as percentage (e.g., 7.5 means 7.5%) */
  nominalMarketReturn: number;
  /** Annual inflation rate as percentage (e.g., 3.0 means 3.0%) */
  inflationRate: number;
  /** Annual investment fees as percentage — Total Expense Ratio (e.g., 0.5 means 0.5%) */
  investmentFees: number;
  /** Projection time horizon in years (50–100, default 100) */
  timeHorizon: number;
};

export type YearProjection = {
  year: number;
  /** Real (inflation-adjusted) portfolio value — stays flat at initialPortfolio */
  realPortfolioValue: number;
  /** Nominal portfolio value — grows at inflation rate to maintain purchasing power */
  nominalPortfolioValue: number;
  /** Nominal annual withdrawal amount — grows at inflation rate */
  nominalAnnualSpend: number;
};

export type PSWRResult = {
  /** The exact real return rate (decimal, e.g., 0.0437 for 4.37%) */
  realReturnRate: number;
  /** The Perpetual Safe Withdrawal Rate (decimal, e.g., 0.0387 for 3.87%) */
  pswrDecimal: number;
  /** PSWR as a percentage (e.g., 3.87) */
  pswrPercentage: number;
  /** Year 1 annual safe withdrawal amount in dollars */
  annualSafeSpend: number;
  /** Nominal portfolio value at end of time horizon (the "Inflation Illusion" KPI) */
  nominalLegacyAtHorizon: number;
  /** Year-by-year projection array */
  projection: YearProjection[];
  /** Whether the portfolio can sustain perpetual withdrawals */
  isSustainable: boolean;
};

export const PSWR_DEFAULTS = {
  initialPortfolio: 2000000,
  nominalMarketReturn: 7.5,
  inflationRate: 3.0,
  investmentFees: 0.5,
  timeHorizon: 100,
} as const;

/**
 * Calculates the Perpetual Safe Withdrawal Rate and full projection.
 *
 * Mathematical steps:
 *   1. Convert percentage inputs to decimals
 *   2. Derive exact real return using the Fisher Equation: ((1 + n) / (1 + i)) - 1
 *   3. Subtract investment fees to get PSWR
 *   4. If PSWR <= 0, the portfolio is unsustainable
 *   5. Generate year-by-year nominal and real projections
 *
 * @param input - The PSWR input parameters
 * @returns A PSWRResult with withdrawal rate, spend amount, and full projection
 */
export function calculatePSWR(input: PSWRInput): PSWRResult {
  const {
    initialPortfolio,
    nominalMarketReturn,
    inflationRate,
    investmentFees,
    timeHorizon,
  } = input;

  // Edge case: invalid portfolio or horizon
  if (initialPortfolio <= 0 || timeHorizon <= 0) {
    return {
      realReturnRate: 0,
      pswrDecimal: 0,
      pswrPercentage: 0,
      annualSafeSpend: 0,
      nominalLegacyAtHorizon: 0,
      projection: [],
      isSustainable: false,
    };
  }

  // 1. Convert percentages to decimals
  const n = nominalMarketReturn / 100;
  const i = inflationRate / 100;
  const f = investmentFees / 100;

  // 2. Fisher Equation — Exact Real Return
  const realReturnRate = (1 + n) / (1 + i) - 1;

  // 3. Perpetual Safe Withdrawal Rate
  let pswrDecimal = realReturnRate - f;
  let pswrPercentage = pswrDecimal * 100;
  let isSustainable = true;

  // 4. Unsustainable check
  if (pswrDecimal <= 0) {
    pswrDecimal = 0;
    pswrPercentage = 0;
    isSustainable = false;
  }

  // 5. Year 1 annual safe withdrawal amount
  const annualSafeSpend = initialPortfolio * pswrDecimal;

  // 6. 100-Year Projection Loop
  const projection: YearProjection[] = [];
  for (let x = 1; x <= timeHorizon; x++) {
    projection.push({
      year: x,
      realPortfolioValue: initialPortfolio,
      nominalPortfolioValue: initialPortfolio * Math.pow(1 + i, x),
      nominalAnnualSpend: annualSafeSpend * Math.pow(1 + i, x),
    });
  }

  // 7. Nominal Legacy at Horizon
  const nominalLegacyAtHorizon = initialPortfolio * Math.pow(1 + i, timeHorizon);

  return {
    realReturnRate,
    pswrDecimal,
    pswrPercentage,
    annualSafeSpend,
    nominalLegacyAtHorizon,
    projection,
    isSustainable,
  };
}
