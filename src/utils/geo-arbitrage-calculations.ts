/**
 * Geographic Arbitrage PPP Calculator — Calculation Engine
 *
 * Computes portfolio projections comparing staying in a home country
 * vs. relocating to a lower cost-of-living target country.
 */

export type GeoArbitrageInput = {
  /** Portfolio value in home currency (e.g., $1,000,000 USD) */
  portfolioValue: number;
  /** Annual spending in home currency (e.g., $40,000 USD) */
  homeAnnualSpend: number;
  /** Cost of living ratio: target / home (e.g., 0.40 means 60% cheaper) */
  costOfLivingMultiplier: number;
  /** Exchange rate: 1 unit of home currency = N units of target currency */
  exchangeRate: number;
  /** Expected annual market return (%) */
  expectedMarketReturn: number;
  /** Home country annual inflation rate (%) */
  homeInflationRate: number;
  /** Target country annual inflation rate (%) */
  targetInflationRate: number;
};

export type ProjectionPoint = {
  year: number;
  /** Portfolio value if staying in home country */
  homePortfolio: number;
  /** Portfolio value if moving to target country */
  targetPortfolio: number;
  /** Annual spend in home currency for home scenario */
  homeSpend: number;
  /** Annual spend in home currency for target scenario */
  targetSpend: number;
};

export type GeoArbitrageResult = {
  /** Equivalent annual spend in target country (home currency) */
  targetAnnualSpendHomeCurrency: number;
  /** Equivalent annual spend in target country (target currency) */
  targetAnnualSpendTargetCurrency: number;
  /** Revised safe withdrawal rate (%) */
  revisedSWR: number;
  /** Real return in target country (%) */
  realReturnTarget: number;
  /** Real return in home country (%) */
  realReturnHome: number;
  /** 30-year projection array */
  projections: ProjectionPoint[];
  /** Year portfolio depletes in home scenario (null = survives 30 years) */
  homeDepletionYear: number | null;
  /** Year portfolio depletes in target scenario (null = survives 30 years) */
  targetDepletionYear: number | null;
  /** Portfolio value at year 30 — home scenario */
  homeFinalValue: number;
  /** Portfolio value at year 30 — target scenario */
  targetFinalValue: number;
};

export function calculateGeoArbitrage(input: GeoArbitrageInput): GeoArbitrageResult {
  const {
    portfolioValue,
    homeAnnualSpend,
    costOfLivingMultiplier,
    exchangeRate,
    expectedMarketReturn,
    homeInflationRate,
    targetInflationRate,
  } = input;

  // 1. Equivalent Target Spend (Home Currency)
  const targetAnnualSpendHomeCurrency = homeAnnualSpend * costOfLivingMultiplier;

  // 2. Equivalent Target Spend (Target Currency)
  const targetAnnualSpendTargetCurrency = targetAnnualSpendHomeCurrency * exchangeRate;

  // 3. New Safe Withdrawal Rate
  const revisedSWR = portfolioValue > 0
    ? (targetAnnualSpendHomeCurrency / portfolioValue) * 100
    : 0;

  // 4. Real Returns
  const realReturnTarget = expectedMarketReturn - targetInflationRate;
  const realReturnHome = expectedMarketReturn - homeInflationRate;

  // 5. 30-Year Runway Projection
  const projections: ProjectionPoint[] = [];
  let homePortfolio = portfolioValue;
  let targetPortfolio = portfolioValue;
  let homeSpend = homeAnnualSpend;
  let targetSpend = targetAnnualSpendHomeCurrency;
  let homeDepletionYear: number | null = null;
  let targetDepletionYear: number | null = null;

  const annualReturnRate = expectedMarketReturn / 100;

  for (let year = 0; year <= 30; year++) {
    projections.push({
      year,
      homePortfolio: Math.max(homePortfolio, 0),
      targetPortfolio: Math.max(targetPortfolio, 0),
      homeSpend,
      targetSpend,
    });

    if (year === 30) break;

    // Grow portfolio by market return, then subtract spend
    homePortfolio = homePortfolio * (1 + annualReturnRate) - homeSpend;
    targetPortfolio = targetPortfolio * (1 + annualReturnRate) - targetSpend;

    // Inflate spending for next year
    homeSpend = homeSpend * (1 + homeInflationRate / 100);
    targetSpend = targetSpend * (1 + targetInflationRate / 100);

    // Track depletion
    if (homePortfolio <= 0 && homeDepletionYear === null) {
      homeDepletionYear = year + 1;
    }
    if (targetPortfolio <= 0 && targetDepletionYear === null) {
      targetDepletionYear = year + 1;
    }
  }

  const homeFinalValue = Math.max(homePortfolio, 0);
  const targetFinalValue = Math.max(targetPortfolio, 0);

  return {
    targetAnnualSpendHomeCurrency,
    targetAnnualSpendTargetCurrency,
    revisedSWR,
    realReturnTarget,
    realReturnHome,
    projections,
    homeDepletionYear,
    targetDepletionYear,
    homeFinalValue,
    targetFinalValue,
  };
}
