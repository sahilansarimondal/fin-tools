/**
 * VPW (Variable Percentage Withdrawal) Calculation Engine
 *
 * Implements the actuarial VPW method as described on Bogleheads.
 * All values are in real (inflation-adjusted) dollars.
 * This is a pure TypeScript module — no side effects, no DOM, no Astro.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input parameters for the VPW simulation. */
export type VPWInput = {
  /** Current age (e.g., 40 to 80). */
  currentAge: number;
  /** Target max age / depletion age (default 100). */
  targetAge: number;
  /** Starting portfolio balance ($). */
  portfolio: number;
  /** Equity allocation as a decimal (e.g., 0.75 for 75%). */
  equityAllocation: number;
  /** Bond allocation as a decimal (e.g., 0.25 for 25%). */
  bondAllocation: number;
  /** Expected annual real return on equities (decimal, e.g., 0.05 for 5%). */
  equityReturn: number;
  /** Expected annual real return on bonds (decimal, e.g., 0.019 for 1.9%). */
  bondReturn: number;
  /** Future annual real pension / Social Security income ($). */
  pensionIncome: number;
  /** Age when pension income begins. */
  pensionStartAge: number;
};

/** Market return scenario for the simulation. */
export type MarketScenario =
  | 'steady'
  | 'sequence-risk'
  | 'gfc-crash'
  | 'secular-bull';

/** Per-year state tracked for all three withdrawal strategies. */
export type YearlyState = {
  /** Calendar age during this year. */
  age: number;
  /** Year index from 0 (0 = currentAge). */
  year: number;
  /** VPW portfolio balance at end of year (after withdrawal & growth). */
  portfolioBalance: number;
  /** VPW withdrawal percentage p_t (as a decimal, e.g., 0.045). */
  vpwPercentage: number;
  /** VPW total withdrawal amount for the year — cash available to spend. */
  vpwWithdrawal: number;
  /** Cash actually drawn from the portfolio for VPW. */
  vpwPortfolioDraw: number;
  /** Constant-dollar (4% rule) withdrawal for the year. */
  constantDollarWithdrawal: number;
  /** Constant-percent (rigid 4% of balance) withdrawal for the year. */
  constantPercentWithdrawal: number;
  /** Portfolio balance for the constant-dollar strategy at end of year. */
  constantDollarPortfolioBalance: number;
  /** Portfolio balance for the constant-percent strategy at end of year. */
  constantPercentPortfolioBalance: number;
  /** Actual pension cash flow received this year ($). */
  pensionIncome: number;
  /** Present value of future pension at start of this year ($). */
  pensionPV: number;
  /** Whether pension income is currently active this year. */
  isPensionActive: boolean;
};

/** Complete simulation result. */
export type VPWResult = {
  /** Per-year data array. */
  yearlyData: YearlyState[];
  /** Always true for VPW (mathematical guarantee of full depletion). */
  vpwNeverRuin: boolean;
  /** Age at which constant-dollar (4% rule) portfolio hits $0, or null. */
  constantDollarRuinAge: number | null;
  /** Final portfolio balance left over under the constant-percent strategy. */
  constantPercentFinalEstate: number;
  /** Total withdrawn across all years under VPW. */
  vpwTotalWithdrawn: number;
  /** Total withdrawn across all years under constant-dollar. */
  constantDollarTotalWithdrawn: number;
  /** Total withdrawn across all years under constant-percent. */
  constantPercentTotalWithdrawn: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the blended real expected return (Rreal).
 *
 * Rreal = (equityAllocation × equityReturn) + (bondAllocation × bondReturn)
 */
function computeRReal(input: VPWInput): number {
  return (
    input.equityAllocation * input.equityReturn +
    input.bondAllocation * input.bondReturn
  );
}

/**
 * Compute the VPW withdrawal percentage p_t for a given remaining horizon.
 *
 * p_t = Rreal / ((1 + Rreal) × [1 - (1 + Rreal)^(-Nt)])
 *
 * When Rreal = 0: p_t = 1 / Nt
 *
 * Verification:  When Nt = 1 → p_t = 1.0 → portfolio fully depleted.
 */
function computeVPWPercentage(Rreal: number, Nt: number): number {
  if (Rreal === 0) return 1 / Nt;

  const onePlusR = 1 + Rreal;
  return Rreal / (onePlusR * (1 - Math.pow(onePlusR, -Nt)));
}

/**
 * Compute the present value of future pension income at a given age.
 *
 * PV = Ipension × annuityFactor × discountFactor
 *
 * Where:
 *   annuityFactor = (1 - (1+R)^(-n)) / R      (n = years of pension payments)
 *   discountFactor = (1+R)^(-d)                (d = years until pension starts)
 *
 * When Rreal = 0: PV = Ipension × n
 */
function computePensionPV(
  pensionIncome: number,
  Rreal: number,
  targetAge: number,
  pensionStartAge: number,
  currentAge: number,
): number {
  const pensionYears = targetAge - pensionStartAge + 1;

  if (Rreal === 0) {
    return pensionIncome * pensionYears;
  }

  const onePlusR = 1 + Rreal;
  const annuityFactor = (1 - Math.pow(onePlusR, -pensionYears)) / Rreal;
  const discountFactor = Math.pow(onePlusR, -(pensionStartAge - currentAge));

  return pensionIncome * annuityFactor * discountFactor;
}

/**
 * Return the real portfolio return for a given year index based on the
 * selected market scenario.
 *
 * 1. **Steady Expected Return** — Portfolio grows at exactly Rreal every year.
 * 2. **Sequence Risk Shock (2000 Dot-Com)** — First 3 years: -20%, -15%, -10%
 *    then steady Rreal recovery.
 * 3. **GFC Crash & Burnout (2008)** — Year 1: -38%, Year 2: +20%
 *    then steady Rreal recovery.
 * 4. **Secular Bull Run** — First 5 years: +12% annually
 *    then steady Rreal recovery.
 */
function getYearlyReturn(
  yearIndex: number,
  baseReturn: number,
  scenario: MarketScenario,
): number {
  switch (scenario) {
    case 'steady':
      return baseReturn;

    case 'sequence-risk':
      if (yearIndex === 0) return -0.20;
      if (yearIndex === 1) return -0.15;
      if (yearIndex === 2) return -0.10;
      return baseReturn;

    case 'gfc-crash':
      if (yearIndex === 0) return -0.38;
      if (yearIndex === 1) return 0.20;
      return baseReturn;

    case 'secular-bull':
      if (yearIndex < 5) return 0.12;
      return baseReturn;

    default:
      return baseReturn;
  }
}

/**
 * Convenience function to create a VPWInput with sensible defaults.
 *
 * Override any field to customise.
 */
export function createDefaultVPWInput(overrides?: Partial<VPWInput>): VPWInput {
  const defaults: VPWInput = {
    currentAge: 65,
    targetAge: 100,
    portfolio: 1_000_000,
    equityAllocation: 0.60,
    bondAllocation: 0.40,
    equityReturn: 0.05,
    bondReturn: 0.019,
    pensionIncome: 0,
    pensionStartAge: 100,
  };
  return { ...defaults, ...overrides };
}

// ---------------------------------------------------------------------------
// Main Simulation
// ---------------------------------------------------------------------------

/**
 * Run a complete VPW simulation from currentAge to targetAge.
 *
 * Three strategies are tracked simultaneously:
 *   - **VPW**  — Actuarial variable-percentage withdrawal (with pension bridge)
 *   - **Constant Dollar** — 4% of starting portfolio, fixed real amount
 *   - **Constant Percent** — 4% of each year's beginning balance
 *
 * @param input    Investment / retirement / pension parameters.
 * @param scenario Market return scenario (default `'steady'`).
 */
export function runVPWSimulation(
  input: VPWInput,
  scenario: MarketScenario = 'steady',
): VPWResult {
  const {
    currentAge,
    targetAge,
    portfolio: initialPortfolio,
    pensionIncome,
    pensionStartAge,
  } = input;

  const Rreal = computeRReal(input);
  const totalYears = targetAge - currentAge + 1;

  // Track portfolio balances independently for each strategy.
  let vpPortfolio = initialPortfolio;
  let cdPortfolio = initialPortfolio;
  let cpPortfolio = initialPortfolio;

  // Constant-dollar (4% rule) fixed withdrawal amount.
  const constantDollarAmount = initialPortfolio * 0.04;

  const yearlyData: YearlyState[] = [];

  let vpwTotalWithdrawn = 0;
  let constantDollarTotalWithdrawn = 0;
  let constantPercentTotalWithdrawn = 0;
  let constantDollarRuinAge: number | null = null;

  for (let year = 0; year < totalYears; year++) {
    const age = currentAge + year;
    const ret = getYearlyReturn(year, Rreal, scenario);

    // -----------------------------------------------------------------------
    // VPW Strategy
    // -----------------------------------------------------------------------
    const Nt = targetAge - age + 1;
    const p_t = computeVPWPercentage(Rreal, Nt);

    const hasPension = pensionIncome > 0;
    const isPensionActive = hasPension && age >= pensionStartAge;
    const pensionWillStart =
      hasPension && age < pensionStartAge && pensionStartAge <= targetAge;

    let vpwWithdrawal: number;
    let vpwPortfolioDraw: number;
    let pensionCash: number;
    let pensionPV: number;

    if (isPensionActive) {
      // Pension is already paying — add it to the calculated portfolio draw.
      vpwPortfolioDraw = p_t * vpPortfolio;
      pensionCash = pensionIncome;
      vpwWithdrawal = vpwPortfolioDraw + pensionCash;
      pensionPV = 0;
    } else if (pensionWillStart) {
      // Pension not yet active — compute its present value and withdraw
      // against total (portfolio + PV_pension). All cash comes from portfolio.
      pensionPV = computePensionPV(
        pensionIncome,
        Rreal,
        targetAge,
        pensionStartAge,
        age,
      );
      vpwWithdrawal = p_t * (vpPortfolio + pensionPV);
      vpwPortfolioDraw = vpwWithdrawal; // entire sum drawn from portfolio
      pensionCash = 0;
    } else {
      // No pension at all or pension never starts within the horizon.
      pensionPV = 0;
      vpwWithdrawal = p_t * vpPortfolio;
      vpwPortfolioDraw = vpwWithdrawal;
      pensionCash = 0;
    }

    // VPW portfolio update.
    vpPortfolio = (vpPortfolio - vpwPortfolioDraw) * (1 + ret);

    // -----------------------------------------------------------------------
    // Constant Dollar Strategy (4% rule — fixed real withdrawal)
    // -----------------------------------------------------------------------
    let cdWithdrawal: number;
    if (cdPortfolio <= 1) {
      cdWithdrawal = 0;
      cdPortfolio = 0;
      if (constantDollarRuinAge === null) {
        constantDollarRuinAge = age;
      }
    } else {
      cdWithdrawal = Math.min(constantDollarAmount, cdPortfolio);
      cdPortfolio = (cdPortfolio - cdWithdrawal) * (1 + ret);
      if (cdPortfolio <= 1) {
        cdPortfolio = 0;
        if (constantDollarRuinAge === null) {
          constantDollarRuinAge = age;
        }
      }
    }

    // -----------------------------------------------------------------------
    // Constant Percent Strategy (rigid 4% of each year's starting balance)
    // -----------------------------------------------------------------------
    const cpWithdrawal = cpPortfolio * 0.04;
    cpPortfolio = (cpPortfolio - cpWithdrawal) * (1 + ret);

    // Sanity-clamp near-zero portfolios.
    if (cpPortfolio < 0 && cpPortfolio > -0.01) cpPortfolio = 0;

    // Accumulate totals.
    vpwTotalWithdrawn += vpwWithdrawal;
    constantDollarTotalWithdrawn += cdWithdrawal;
    constantPercentTotalWithdrawn += cpWithdrawal;

    yearlyData.push({
      age,
      year,
      portfolioBalance: vpPortfolio,
      vpwPercentage: p_t,
      vpwWithdrawal,
      vpwPortfolioDraw,
      constantDollarWithdrawal: cdWithdrawal,
      constantPercentWithdrawal: cpWithdrawal,
      constantDollarPortfolioBalance: cdPortfolio,
      constantPercentPortfolioBalance: cpPortfolio,
      pensionIncome: pensionCash,
      pensionPV,
      isPensionActive,
    });
  }

  // The VPW final-year portfolio should be ~$0 (within rounding tolerance).
  const vpwFinalBalance = yearlyData[yearlyData.length - 1].portfolioBalance;
  const vpwNeverRuin = Math.abs(vpwFinalBalance) <= 1;

  return {
    yearlyData,
    vpwNeverRuin,
    constantDollarRuinAge,
    constantPercentFinalEstate: cpPortfolio,
    vpwTotalWithdrawn,
    constantDollarTotalWithdrawn,
    constantPercentTotalWithdrawn,
  };
}

// ---------------------------------------------------------------------------
// Verification helpers
// ---------------------------------------------------------------------------

/**
 * Verify the core mathematical invariant of VPW:
 *
 * 1. The portfolio should be fully depleted (±$1) at targetAge.
 * 2. VPW percentage should be 1.0 in the final year.
 * 3. Under the steady scenario vpwNeverRuin should be true.
 *
 * Returns a list of human-readable assertion messages.
 */
export function verifyVPWIntegrity(input: VPWInput): string[] {
  const messages: string[] = [];
  const result = runVPWSimulation(input, 'steady');
  const last = result.yearlyData[result.yearlyData.length - 1];

  // 1. Final portfolio ≈ $0
  if (Math.abs(last.portfolioBalance) <= 1) {
    messages.push(
      `✅ VPW fully depletes portfolio at age ${last.age}: $${last.portfolioBalance.toFixed(2)}`,
    );
  } else {
    messages.push(
      `⚠️  VPW final balance at age ${last.age}: $${last.portfolioBalance.toFixed(2)} (expected ~$0)`,
    );
  }

  // 2. Final year VPW percentage should be 1.0
  if (Math.abs(last.vpwPercentage - 1) < 1e-9) {
    messages.push(`✅ Final year VPW percentage = 1.0 (exact depletion rate)`);
  } else {
    messages.push(
      `⚠️  Final year VPW percentage = ${last.vpwPercentage} (expected 1.0)`,
    );
  }

  // 3. vpwNeverRuin invariant
  if (result.vpwNeverRuin) {
    messages.push(`✅ vpwNeverRuin = true — mathematical guarantee holds`);
  } else {
    messages.push(`⚠️  vpwNeverRuin = false — invariant violated`);
  }

  // 4. Constant dollar can fail (may or may not — depends on parameters)
  if (result.constantDollarRuinAge !== null) {
    messages.push(
      `ℹ️  Constant-dollar (4% rule) runs out at age ${result.constantDollarRuinAge}`,
    );
  }

  return messages;
}
