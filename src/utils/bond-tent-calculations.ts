export type CrashScenarioKey = 'severe' | 'moderate' | 'flat';

export type BondTentInput = {
  portfolioValue: number;
  annualSpending: number;
  rampUpYears: number;
  rampDownYears: number;
  baselineEquityPct: number;
  peakBondPct: number;
  crashScenario: CrashScenarioKey;
};

export type YearData = {
  year: number;
  bondAllocPct: number;
  tentPortfolio: number;
  staticPortfolio: number;
  tentEquity: number;
  tentBonds: number;
  staticEquity: number;
  staticBonds: number;
  spending: number;
  stockReturn: number;
};

export type BondTentResult = {
  years: YearData[];
  tentFinalBalance: number;
  staticFinalBalance: number;
  tentAdvantage: number;
  tentMinBalance: number;
  staticMinBalance: number;
  totalSpending: number;
};

const STANDARD_STOCK_RETURN = 0.07;
const STANDARD_BOND_RETURN = 0.035;
const INFLATION_RATE = 0.025;

export const CRASH_SCENARIOS: Record<CrashScenarioKey, { name: string; stockReturnYear1: number; flatYears?: number }> = {
  severe: { name: 'Severe Crash (-30%)', stockReturnYear1: -0.30 },
  moderate: { name: 'Moderate Crash (-15%)', stockReturnYear1: -0.15 },
  flat: { name: 'Flat Market (0% for 3 Years)', stockReturnYear1: 0, flatYears: 3 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getStockReturnForYear(year: number, scenario: CrashScenarioKey): number {
  const scenarioConfig = CRASH_SCENARIOS[scenario];

  if (year < 1) {
    // Pre-retirement: use standard returns
    return STANDARD_STOCK_RETURN;
  }

  if (year === 1) {
    return scenarioConfig.stockReturnYear1;
  }

  // For flat scenario: years 2 and 3 also get 0% return
  if (scenario === 'flat' && scenarioConfig.flatYears && year <= scenarioConfig.flatYears) {
    return 0;
  }

  return STANDARD_STOCK_RETURN;
}

export function calculateBondTent(input: BondTentInput): BondTentResult {
  // Clamp inputs to valid ranges
  const portfolioValue = Math.max(0, input.portfolioValue);
  const annualSpending = Math.max(0, input.annualSpending);
  const rampUpYears = clamp(Math.round(input.rampUpYears), 1, 10);
  const rampDownYears = clamp(Math.round(input.rampDownYears), 1, 15);
  const baselineEquityPct = clamp(input.baselineEquityPct, 50, 100);
  const peakBondPct = clamp(input.peakBondPct, 10, 70);
  const crashScenario = input.crashScenario;

  const B_start = 1 - baselineEquityPct / 100; // e.g., 0.10 for 90% equity
  const B_peak = peakBondPct / 100; // e.g., 0.40

  const totalYears = rampUpYears + rampDownYears + 5;

  const years: YearData[] = [];

  let tentPortfolio = portfolioValue;
  let staticPortfolio = portfolioValue;

  let tentMinBalance = portfolioValue;
  let staticMinBalance = portfolioValue;

  for (let i = -rampUpYears; i <= rampDownYears + 5; i++) {
    let bondAllocPct: number;

    if (i < 0) {
      // Phase 1: Pre-retirement — linear increase to B_peak
      const t = rampUpYears + i; // 0 at start, rampUpYears at retirement
      bondAllocPct = B_start + (t / rampUpYears) * (B_peak - B_start);
      // Ensure bond allocation doesn't go below B_start or above B_peak
      bondAllocPct = clamp(bondAllocPct, B_start, B_peak);
    } else if (i <= rampDownYears) {
      // Phase 2: Post-retirement ramp-down — linear decrease from B_peak to B_start
      bondAllocPct = B_peak - (i / rampDownYears) * (B_peak - B_start);
      bondAllocPct = clamp(bondAllocPct, B_start, B_peak);
    } else {
      // Phase 3: Post-glide path — hold flat at B_start
      bondAllocPct = B_start;
    }

    // Calculate inflation-adjusted spending
    const spending = i >= 0 ? annualSpending * Math.pow(1 + INFLATION_RATE, i) : 0;

    // Stock return for this year
    // Note: i=0 is the retirement year. No crash in year 0 (it's the start).
    // Crash happens in year 1 (first year of retirement).
    const stockReturn = i > 0 ? getStockReturnForYear(i, crashScenario) : STANDARD_STOCK_RETURN;

    // --- Tent Portfolio ---
    let tentAdjusted = tentPortfolio - spending;
    tentAdjusted = Math.max(0, tentAdjusted);

    const tentBondAlloc = bondAllocPct;
    const tentEquityAlloc = 1 - tentBondAlloc;

    const tentEquityPart = tentAdjusted * tentEquityAlloc;
    const tentBondPart = tentAdjusted * tentBondAlloc;

    const tentEnd = tentEquityPart * (1 + stockReturn) + tentBondPart * (1 + STANDARD_BOND_RETURN);
    tentPortfolio = Math.max(0, tentEnd);

    // --- Static Portfolio ---
    let staticAdjusted = staticPortfolio - spending;
    staticAdjusted = Math.max(0, staticAdjusted);

    const staticBondAlloc = B_start;
    const staticEquityAlloc = 1 - staticBondAlloc;

    const staticEquityPart = staticAdjusted * staticEquityAlloc;
    const staticBondPart = staticAdjusted * staticBondAlloc;

    const staticEnd = staticEquityPart * (1 + stockReturn) + staticBondPart * (1 + STANDARD_BOND_RETURN);
    staticPortfolio = Math.max(0, staticEnd);

    // Track minimum balances
    if (tentPortfolio < tentMinBalance) tentMinBalance = tentPortfolio;
    if (staticPortfolio < staticMinBalance) staticMinBalance = staticPortfolio;

    years.push({
      year: i,
      bondAllocPct: parseFloat((bondAllocPct * 100).toFixed(2)),
      tentPortfolio: parseFloat(tentPortfolio.toFixed(0)),
      staticPortfolio: parseFloat(staticPortfolio.toFixed(0)),
      tentEquity: parseFloat((tentEquityPart * (1 + stockReturn)).toFixed(0)),
      tentBonds: parseFloat((tentBondPart * (1 + STANDARD_BOND_RETURN)).toFixed(0)),
      staticEquity: parseFloat((staticEquityPart * (1 + stockReturn)).toFixed(0)),
      staticBonds: parseFloat((staticBondPart * (1 + STANDARD_BOND_RETURN)).toFixed(0)),
      spending: parseFloat(spending.toFixed(0)),
      stockReturn: stockReturn,
    });
  }

  const tentFinalBalance = tentPortfolio;
  const staticFinalBalance = staticPortfolio;
  const tentAdvantage = tentFinalBalance - staticFinalBalance;

  const totalSpending = years
    .filter(y => y.year >= 0)
    .reduce((sum, y) => sum + y.spending, 0);

  return {
    years,
    tentFinalBalance: parseFloat(tentFinalBalance.toFixed(0)),
    staticFinalBalance: parseFloat(staticFinalBalance.toFixed(0)),
    tentAdvantage: parseFloat(tentAdvantage.toFixed(0)),
    tentMinBalance: parseFloat(tentMinBalance.toFixed(0)),
    staticMinBalance: parseFloat(staticMinBalance.toFixed(0)),
    totalSpending: parseFloat(totalSpending.toFixed(0)),
  };
}
