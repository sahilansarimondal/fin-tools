/**
 * Sequence of Returns Risk (SRR) Stress Tester — Calculation Engine
 *
 * Compares a portfolio's 30-year retirement projection under a constant
 * average return vs. a historical stress scenario (dot-com, GFC,
 * stagflation, or custom) to show how the timing of market crashes
 * impacts portfolio survival.
 */

export type StressScenarioKey = 'dotcom' | 'gfc' | 'stagflation' | 'custom';

export type SRRInput = {
  /** Total portfolio value at the start of retirement (e.g., 1,000,000) */
  initialPortfolio: number;
  /** Amount withdrawn in the first year (e.g., 40,000) */
  initialAnnualWithdrawal: number;
  /** Expected annual inflation rate as a percentage (e.g., 3) */
  annualInflationRate: number;
  /** Constant annual return for the baseline scenario as a percentage (e.g., 7) */
  averageReturn: number;
  /** The stress scenario to simulate */
  stressScenario: StressScenarioKey;
  /** Custom 3-year returns (only used when stressScenario === 'custom') */
  customReturns?: [number, number, number];
};

/** A single year's projection data for one scenario */
export type YearData = {
  /** Year number (1-indexed) */
  year: number;
  /** Portfolio balance at the start of the year before withdrawal */
  balance: number;
  /** Inflation-adjusted withdrawal for this year */
  withdrawal: number;
  /** Market return rate applied this year as a percentage */
  returnRate: number;
  /** Portfolio balance at the end of the year after withdrawal and growth */
  endBalance: number;
};

export type SRRResult = {
  /** 30-year projection under the constant average return scenario */
  averageData: YearData[];
  /** 30-year projection under the stress scenario */
  stressData: YearData[];
  /** Number of years the portfolio survives under the average scenario (max 30) */
  averageSurvivalYears: number;
  /** Number of years the portfolio survives under the stress scenario (max 30) */
  stressSurvivalYears: number;
  /** Initial safe withdrawal rate as a percentage */
  initialSWR: number;
  /** Final portfolio balance at year 30 under the average scenario */
  averageFinalBalance: number;
  /** Final portfolio balance at year 30 under the stress scenario */
  stressFinalBalance: number;
  /** The 30-element annual return array used for the stress scenario (for display) */
  stressReturns: number[];
};

/**
 * Predefined historical stress scenarios with crash returns and recovery rate.
 *
 * Each scenario defines:
 * - `crashReturns`: The annual returns during the crash period (years 1-N).
 * - `recoveryReturn`: The constant annual return applied for all remaining years.
 */
export const STRESS_SCENARIOS = {
  dotcom: {
    name: 'Dot-Com Bubble (2000–2002)',
    description: 'Three-year tech crash: -9%, -12%, -22%, then +10.5% recovery',
    crashReturns: [-9, -12, -22],
    recoveryReturn: 10.5,
  },
  gfc: {
    name: 'Global Financial Crisis (2008)',
    description: 'Two-year housing crash: -37%, +26%, then +8.5% recovery',
    crashReturns: [-37, 26],
    recoveryReturn: 8.5,
  },
  stagflation: {
    name: 'Stagflation (1973–1974)',
    description: 'Two-year oil crisis: -14%, -26%, then +9.5% recovery',
    crashReturns: [-14, -26],
    recoveryReturn: 9.5,
  },
  custom: {
    name: 'Custom Stress Test',
    description: 'Define your own 3-year crash returns',
    crashReturns: [0, 0, 0],
    recoveryReturn: 7,
  },
} as const;

const PROJECTION_YEARS = 30;

/**
 * Builds a 30-element array of annual returns (as percentages) for the given
 * stress scenario. The first N years use the scenario's crash returns, and
 * all subsequent years use the scenario's recovery return.
 *
 * For the `custom` scenario, the user-provided `customReturns` are used for
 * the first 3 years, and `defaultRecovery` is used for years 4-30.
 *
 * @param scenario - The stress scenario key
 * @param defaultRecovery - The constant return to use after crash years
 *                          (usually the user's averageReturn for custom)
 * @param customReturns - Optional 3-year custom returns
 * @returns A 30-element array of annual return percentages
 */
export function buildStressReturns(
  scenario: StressScenarioKey,
  defaultRecovery: number,
  customReturns?: [number, number, number],
): number[] {
  const { crashReturns, recoveryReturn } = STRESS_SCENARIOS[scenario];
  const recovery = scenario === 'custom' ? defaultRecovery : recoveryReturn;
  const crash = scenario === 'custom' && customReturns ? customReturns : crashReturns;

  const returns: number[] = [];

  // Crash period years
  for (const r of crash) {
    returns.push(r);
  }

  // Recovery years — pad to 30 total
  while (returns.length < PROJECTION_YEARS) {
    returns.push(recovery);
  }

  return returns;
}

/**
 * Runs a 30-year retirement projection simulation.
 *
 * For each year:
 * 1. The withdrawal is adjusted for inflation: `initialWithdrawal * (1 + inflation)^(year-1)`
 * 2. The withdrawal is subtracted from the portfolio balance first
 * 3. The market return is applied to the remaining balance
 * 4. The balance is floored at $0 (portfolio cannot go negative)
 *
 * @param initialPortfolio - Starting portfolio balance
 * @param initialWithdrawal - First-year withdrawal amount
 * @param inflationRate - Annual inflation rate as a percentage
 * @param annualReturns - 30-element array of annual return percentages
 * @returns An object containing the year-by-year projection data and summary stats
 */
function runSimulation(
  initialPortfolio: number,
  initialWithdrawal: number,
  inflationRate: number,
  annualReturns: number[],
): { data: YearData[]; survivalYears: number; finalBalance: number } {
  const data: YearData[] = [];
  let balance = initialPortfolio;
  const inflationDecimal = inflationRate / 100;

  for (let year = 1; year <= PROJECTION_YEARS; year++) {
    const returnRate = annualReturns[year - 1];

    // 1. Inflation-adjusted withdrawal
    const withdrawal = initialWithdrawal * Math.pow(1 + inflationDecimal, year - 1);

    // 2. Withdraw first
    const balanceAfterWithdrawal = balance - withdrawal;

    // 3. Apply market return
    let endBalance = balanceAfterWithdrawal * (1 + returnRate / 100);

    // 4. Zero-floor
    endBalance = Math.max(endBalance, 0);

    data.push({
      year,
      balance,
      withdrawal,
      returnRate,
      endBalance,
    });

    balance = endBalance;
  }

  // Count survival years: the last year with a positive end balance.
  // As soon as the portfolio hits $0 it stays at $0 (zero-floor), so we
  // simply track the max year with endBalance > 0. If it never hits zero,
  // survival projects the full 30 years.
  let survivalYears = 0;
  for (const d of data) {
    if (d.endBalance > 0) {
      survivalYears = d.year;
    } else {
      // Portfolio exhausted — it stays at $0 from here on out
      break;
    }
  }

  const finalBalance = data.length > 0 ? data[data.length - 1].endBalance : 0;

  return { data, survivalYears, finalBalance };
}

/**
 * Calculates the Sequence of Returns Risk (SRR) comparison between a
 * constant-average-return scenario and a stress scenario.
 *
 * The function:
 * 1. Builds the 30-year return arrays for both the average and stress scenarios
 * 2. Simulates a 30-year retirement withdrawal schedule under both scenarios
 * 3. Computes survival years and final balances for comparison
 *
 * @param input - The SRR input parameters
 * @returns An SRRResult with both scenarios' projections and summary metrics
 */
export function calculateSRR(input: SRRInput): SRRResult {
  const {
    initialPortfolio,
    initialAnnualWithdrawal,
    annualInflationRate,
    averageReturn,
    stressScenario,
    customReturns,
  } = input;

  // Edge case: no portfolio
  if (initialPortfolio <= 0) {
    const emptyData = Array.from({ length: PROJECTION_YEARS }, (_, i) => ({
      year: i + 1,
      balance: 0,
      withdrawal: 0,
      returnRate: 0,
      endBalance: 0,
    }));

    return {
      averageData: emptyData,
      stressData: emptyData,
      averageSurvivalYears: 0,
      stressSurvivalYears: 0,
      initialSWR: 0,
      averageFinalBalance: 0,
      stressFinalBalance: 0,
      stressReturns: Array.from({ length: PROJECTION_YEARS }, () => 0),
    };
  }

  // Build the average scenario return array (constant return every year)
  const averageReturns: number[] = Array.from(
    { length: PROJECTION_YEARS },
    () => averageReturn,
  );

  // Build the stress scenario return array
  const stressReturns = buildStressReturns(stressScenario, averageReturn, customReturns);

  // Run both simulations
  const averageSim = runSimulation(
    initialPortfolio,
    initialAnnualWithdrawal,
    annualInflationRate,
    averageReturns,
  );

  const stressSim = runSimulation(
    initialPortfolio,
    initialAnnualWithdrawal,
    annualInflationRate,
    stressReturns,
  );

  // Initial safe withdrawal rate
  const initialSWR = initialPortfolio > 0
    ? (initialAnnualWithdrawal / initialPortfolio) * 100
    : 0;

  return {
    averageData: averageSim.data,
    stressData: stressSim.data,
    averageSurvivalYears: averageSim.survivalYears,
    stressSurvivalYears: stressSim.survivalYears,
    initialSWR,
    averageFinalBalance: averageSim.finalBalance,
    stressFinalBalance: stressSim.finalBalance,
    stressReturns,
  };
}
