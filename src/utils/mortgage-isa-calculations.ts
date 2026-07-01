/**
 * Mortgage Overpayment vs ISA Investing Calculator — Calculation Engine
 *
 * Compares two strategies over the mortgage term:
 *   A) Invest surplus into an ISA
 *   B) Overpay mortgage first, then invest the freed-up budget into an ISA
 *
 * All monetary values are in GBP (£).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MortgageVsIsaInput = {
  /** Current mortgage balance (£) */
  balance: number;
  /** Remaining mortgage term (years) */
  termYears: number;
  /** Annual mortgage interest rate (%) */
  mortgageRate: number;
  /** Available monthly surplus to overpay or invest (£) */
  monthlySurplus: number;
  /** Expected ISA annual return (%) */
  isaReturn: number;
};

export type StrategyResult = {
  /** ISA balance at end of term (£) */
  isaBalance: number;
  /** Total mortgage interest paid over the period (£) */
  totalInterestPaid: number;
  /** The month (1-indexed) when the mortgage is fully paid off */
  mortgagePaidOffMonth: number;
};

export type YearDataPoint = {
  year: number;
  /** Strategy A ISA balance at end of year (£) */
  strategyA_ISA: number;
  /** Strategy A mortgage balance at end of year (£) */
  strategyA_mortgage: number;
  /** Strategy B ISA balance at end of year (£) */
  strategyB_ISA: number;
  /** Strategy B mortgage balance at end of year (£) */
  strategyB_mortgage: number;
};

export type MortgageVsIsaResult = {
  strategyA: StrategyResult;
  strategyB: StrategyResult;
  /** 'A' if ISA investing wins, 'B' if overpaying first wins */
  winner: 'A' | 'B';
  /** Absolute difference in total net worth (£) */
  difference: number;
  /** Years the mortgage was paid off early under strategy B */
  yearsShaved: number;
  /** Baseline monthly mortgage payment (P) (£) */
  monthlyPayment: number;
  /** Total mortgage payments made under strategy A (£) */
  totalMortgagePaymentsA: number;
  /** Total mortgage payments made under strategy B (£) */
  totalMortgagePaymentsB: number;
  /** Year-by-year data for charting */
  yearlyData: YearDataPoint[];
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Formats a number as GBP with comma separators and no decimals.
 * Example: 1234567 → "£1,234,567"
 */
export function formatGBP(value: number): string {
  const rounded = Math.round(value);
  const parts = rounded.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `£${parts[0]}`;
}

/**
 * Formats a number as a short GBP string for chart labels.
 * Examples:
 *   1234   → "£1K"
 *   123456 → "£123K"
 *   1234567 → "£1.2M"
 *   1234567890 → "£1.2B"
 */
export function formatGBPShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `£${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `£${(value / 1_000).toFixed(0)}K`;
  }
  return `£${Math.round(value)}`;
}

// ---------------------------------------------------------------------------
// Core calculation
// ---------------------------------------------------------------------------

/**
 * Calculates the standard monthly mortgage payment using the amortisation formula.
 *
 * P = balance * (r * (1 + r)^n) / ((1 + r)^n - 1)
 *
 * Handles the edge case where the monthly rate is effectively zero.
 *
 * @param balance - Current mortgage balance
 * @param annualRate - Annual mortgage interest rate (%)
 * @param numMonths - Total number of monthly payments
 * @returns Monthly payment amount
 */
function calcMonthlyPayment(balance: number, annualRate: number, numMonths: number): number {
  if (numMonths <= 0) return 0;

  const r = annualRate / 100 / 12;

  // When rate is 0, payment is simply balance divided by number of months
  if (r === 0) {
    return balance / numMonths;
  }

  const compoundFactor = Math.pow(1 + r, numMonths);
  return balance * (r * compoundFactor) / (compoundFactor - 1);
}

/**
 * Runs a month-by-month simulation of the overpay-then-invest strategy.
 *
 * For each month until the original term ends:
 *   1. Apply monthly interest to remaining mortgage balance
 *   2. Deduct the total housing budget (P + surplus)
 *   3. Once the mortgage is paid off (balance <= 0), redirect the
 *      full housing budget into the ISA
 *
 * @param balance - Starting mortgage balance
 * @param monthlyPayment - Standard monthly payment (P)
 * @param surplus - Monthly surplus available (X)
 * @param monthlyMortgageRate - Monthly mortgage rate (decimal)
 * @param monthlyIsaRate - Monthly ISA return rate (decimal)
 * @param totalMonths - Total term in months
 * @returns ISA balance, total mortgage interest paid, and payoff month
 */
function simulateStrategyB(
  balance: number,
  monthlyPayment: number,
  surplus: number,
  monthlyMortgageRate: number,
  monthlyIsaRate: number,
  totalMonths: number,
): { isaBalance: number; totalInterestPaid: number; payoffMonth: number } {
  let mortgageBalance = balance;
  let isaBalance = 0;
  let totalInterestPaid = 0;
  let payoffMonth = totalMonths; // default: never paid off early
  let mortgagePaidOff = false;

  for (let month = 1; month <= totalMonths; month++) {
    if (!mortgagePaidOff) {
      // Apply monthly interest to mortgage
      const interest = mortgageBalance * monthlyMortgageRate;
      totalInterestPaid += interest;
      mortgageBalance += interest;

      // Deduct the total housing budget
      const totalPayment = monthlyPayment + surplus;
      mortgageBalance -= totalPayment;

      // Check if mortgage is paid off
      if (mortgageBalance <= 0) {
        mortgageBalance = 0;
        mortgagePaidOff = true;
        payoffMonth = month;

        // Any overpayment beyond the balance is redirected to ISA this month
        const overpaid = Math.abs(mortgageBalance);
        if (overpaid > 0) {
          isaBalance += overpaid;
        }
      }
    } else {
      // Mortgage is paid off — invest the full housing budget every month
      isaBalance += monthlyPayment + surplus;
    }

    // Apply ISA growth at end of each month
    if (isaBalance > 0) {
      isaBalance *= (1 + monthlyIsaRate);
    }
  }

  return { isaBalance, totalInterestPaid, payoffMonth };
}

/**
 * Calculates the ISA balance under strategy A (invest surplus from month 1).
 *
 * ISA_Balance = X * ((1 + r_i)^n - 1) / r_i
 *
 * Handles the edge case where ISA rate is zero.
 *
 * @param surplus - Monthly surplus invested (£)
 * @param monthlyIsaRate - Monthly ISA return rate (decimal)
 * @param totalMonths - Total number of months
 * @returns ISA balance at end of term
 */
function calcIsaBalance(surplus: number, monthlyIsaRate: number, totalMonths: number): number {
  if (totalMonths <= 0 || surplus <= 0) return 0;

  if (monthlyIsaRate === 0) {
    return surplus * totalMonths;
  }

  const compoundFactor = Math.pow(1 + monthlyIsaRate, totalMonths);
  return surplus * (compoundFactor - 1) / monthlyIsaRate;
}

/**
 * Tracks the mortgage balance over time for strategy A (standard repayment).
 *
 * @param balance - Starting mortgage balance
 * @param monthlyPayment - Standard monthly payment
 * @param monthlyMortgageRate - Monthly mortgage rate (decimal)
 * @param numMonths - Total months
 * @returns Final balance (should be 0) and total interest paid
 */
function simulateStandardRepayment(
  balance: number,
  monthlyPayment: number,
  monthlyMortgageRate: number,
  numMonths: number,
): { finalBalance: number; totalInterestPaid: number } {
  let currentBalance = balance;
  let totalInterestPaid = 0;

  for (let month = 1; month <= numMonths; month++) {
    const interest = currentBalance * monthlyMortgageRate;
    totalInterestPaid += interest;
    currentBalance += interest;
    currentBalance -= monthlyPayment;

    // Clamp — should not go below zero with a correctly calculated payment
    if (currentBalance < 0) {
      currentBalance = 0;
      break;
    }
  }

  return { finalBalance: currentBalance, totalInterestPaid };
}

/**
 * Builds the year-by-year chart data for both strategies.
 *
 * Each year's data point contains the end-of-year state for both strategies.
 *
 * @param balance - Starting mortgage balance
 * @param monthlyPayment - Standard monthly payment (P)
 * @param surplus - Monthly surplus (X)
 * @param monthlyMortgageRate - Monthly mortgage rate (decimal)
 * @param monthlyIsaRate - Monthly ISA return rate (decimal)
 * @param totalMonths - Total term in months
 * @param payoffMonth - Month when mortgage is paid off under strategy B
 * @returns Array of yearly data points
 */
function buildYearlyData(
  balance: number,
  monthlyPayment: number,
  surplus: number,
  monthlyMortgageRate: number,
  monthlyIsaRate: number,
  totalMonths: number,
  payoffMonth: number,
): YearDataPoint[] {
  const totalYears = Math.ceil(totalMonths / 12);
  const data: YearDataPoint[] = [];

  // State for strategy A
  let balanceA = balance;
  let isaA = 0;

  // State for strategy B
  let balanceB = balance;
  let isaB = 0;
  let mortgagePaidOffB = false;
  let monthsSincePayoff = 0;

  // Iterate month by month, snap to yearly points
  for (let month = 1; month <= totalMonths; month++) {
    // --- Strategy A: standard mortgage + ISA investing ---
    const interestA = balanceA * monthlyMortgageRate;
    balanceA += interestA;
    balanceA -= monthlyPayment;
    if (balanceA < 0) balanceA = 0;

    // ISA growth
    if (isaA > 0) {
      isaA *= (1 + monthlyIsaRate);
    }
    isaA += surplus; // invest surplus at end of month — grows next month

    // --- Strategy B: overpay first, then invest ---
    if (!mortgagePaidOffB) {
      const interestB = balanceB * monthlyMortgageRate;
      balanceB += interestB;
      const totalPayment = monthlyPayment + surplus;
      balanceB -= totalPayment;

      if (balanceB <= 0) {
        const overpaid = Math.abs(balanceB);
        balanceB = 0;
        mortgagePaidOffB = true;
        if (overpaid > 0) {
          isaB += overpaid;
        }
      }
    } else {
      // Mortgage paid off — invest full housing budget
      monthsSincePayoff++;
      isaB += monthlyPayment + surplus;
    }

    // ISA growth for B at end of month
    if (isaB > 0) {
      isaB *= (1 + monthlyIsaRate);
    }

    // Record yearly data points (end of each year)
    if (month % 12 === 0) {
      const year = month / 12;
      data.push({
        year,
        strategyA_ISA: Math.round(isaA * 100) / 100,
        strategyA_mortgage: Math.round(balanceA * 100) / 100,
        strategyB_ISA: Math.round(isaB * 100) / 100,
        strategyB_mortgage: Math.round(balanceB * 100) / 100,
      });
    }
  }

  // If term doesn't end exactly on a year boundary, add the final partial year
  if (totalMonths % 12 !== 0) {
    const year = totalYears;
    data.push({
      year,
      strategyA_ISA: Math.round(isaA * 100) / 100,
      strategyA_mortgage: Math.round(balanceA * 100) / 100,
      strategyB_ISA: Math.round(isaB * 100) / 100,
      strategyB_mortgage: Math.round(balanceB * 100) / 100,
    });
  }

  return data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compares two strategies over the mortgage term:
 *   A) Invest monthly surplus into an ISA from day one
 *   B) Overpay the mortgage first, then invest the freed-up budget into an ISA
 *
 * Returns a result object with both strategies' outcomes and comparison metrics.
 *
 * @param input - Input parameters
 * @returns Comparison result
 */
export function calculateMortgageVsIsa(input: MortgageVsIsaInput): MortgageVsIsaResult {
  const { balance, termYears, mortgageRate, monthlySurplus, isaReturn } = input;

  const n = termYears * 12;
  const monthlyMortgageRate = mortgageRate / 100 / 12;
  const monthlyIsaRate = isaReturn / 100 / 12;

  // Edge case: zero or negative balance → both strategies are identical (empty)
  if (balance <= 0) {
    const emptyYearly: YearDataPoint[] = [];
    for (let y = 1; y <= termYears; y++) {
      emptyYearly.push({
        year: y,
        strategyA_ISA: 0,
        strategyA_mortgage: 0,
        strategyB_ISA: 0,
        strategyB_mortgage: 0,
      });
    }

    return {
      strategyA: { isaBalance: 0, totalInterestPaid: 0, mortgagePaidOffMonth: n },
      strategyB: { isaBalance: 0, totalInterestPaid: 0, mortgagePaidOffMonth: 0 },
      winner: 'A',
      difference: 0,
      yearsShaved: 0,
      monthlyPayment: 0,
      totalMortgagePaymentsA: 0,
      totalMortgagePaymentsB: 0,
      yearlyData: emptyYearly,
    };
  }

  // Edge case: zero surplus → both strategies are identical
  if (monthlySurplus <= 0) {
    const { totalInterestPaid } = simulateStandardRepayment(
      balance, calcMonthlyPayment(balance, mortgageRate, n),
      monthlyMortgageRate, n,
    );

    const yearly = buildYearlyData(
      balance, calcMonthlyPayment(balance, mortgageRate, n), 0,
      monthlyMortgageRate, monthlyIsaRate, n, n,
    );

    return {
      strategyA: { isaBalance: 0, totalInterestPaid, mortgagePaidOffMonth: n },
      strategyB: { isaBalance: 0, totalInterestPaid, mortgagePaidOffMonth: n },
      winner: 'A',
      difference: 0,
      yearsShaved: 0,
      monthlyPayment: calcMonthlyPayment(balance, mortgageRate, n),
      totalMortgagePaymentsA: calcMonthlyPayment(balance, mortgageRate, n) * n,
      totalMortgagePaymentsB: calcMonthlyPayment(balance, mortgageRate, n) * n,
      yearly,
    };
  }

  // --- Step 1: Calculate baseline monthly mortgage payment (P) ---
  const P = calcMonthlyPayment(balance, mortgageRate, n);

  // --- Step 2: Strategy A — Invest the surplus into ISA ---
  const { totalInterestPaid: interestA } = simulateStandardRepayment(
    balance, P, monthlyMortgageRate, n,
  );

  const isaBalanceA = calcIsaBalance(monthlySurplus, monthlyIsaRate, n);

  // --- Step 3: Strategy B — Overpay mortgage first, then invest ---
  const strategyBResult = simulateStrategyB(
    balance, P, monthlySurplus,
    monthlyMortgageRate, monthlyIsaRate, n,
  );

  // --- Build yearly data for charting ---
  const yearlyData = buildYearlyData(
    balance, P, monthlySurplus,
    monthlyMortgageRate, monthlyIsaRate, n,
    strategyBResult.payoffMonth,
  );

  // --- Compute comparison metrics ---
  const totalMortgagePaymentsA = P * n;
  const totalMortgagePaymentsB = (P + monthlySurplus) * strategyBResult.payoffMonth;

  const netWorthA = isaBalanceA;
  const netWorthB = strategyBResult.isaBalance;

  const difference = Math.abs(netWorthA - netWorthB);
  const winner: 'A' | 'B' = netWorthA >= netWorthB ? 'A' : 'B';
  const yearsShaved = (n - strategyBResult.payoffMonth) / 12;

  return {
    strategyA: {
      isaBalance: isaBalanceA,
      totalInterestPaid: interestA,
      mortgagePaidOffMonth: n,
    },
    strategyB: {
      isaBalance: strategyBResult.isaBalance,
      totalInterestPaid: strategyBResult.totalInterestPaid,
      mortgagePaidOffMonth: strategyBResult.payoffMonth,
    },
    winner,
    difference,
    yearsShaved,
    monthlyPayment: P,
    totalMortgagePaymentsA,
    totalMortgagePaymentsB,
    yearlyData,
  };
}
