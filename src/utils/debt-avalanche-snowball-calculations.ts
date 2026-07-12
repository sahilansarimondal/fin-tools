/**
 * Debt Avalanche vs Snowball Timeline Calculation Engine
 *
 * Compares two debt payoff strategies:
 *   - Avalanche: prioritises debts by APR (highest first), then balance (lowest first)
 *   - Snowball:   prioritises debts by balance (lowest first), then APR (highest first)
 *
 * Each strategy is simulated independently month-by-month with the same
 * monthly budget. The result shows total interest paid, timeline to debt
 * freedom, and payoff milestones for both strategies.
 */

// ---------------------------------------------------------------------------
// Input / Output Types
// ---------------------------------------------------------------------------

export interface DebtInput {
  name: string;
  balance: number;
  apr: number;        // e.g., 20 for 20%
  minPayment: number;
}

export interface DebtSimulationInput {
  debts: DebtInput[];
  monthlyBudget: number;
}

export interface MonthlySnapshot {
  month: number;
  totalBalance: number;
  totalInterestPaid: number;
  totalPaidThisMonth: number;
  debts: { name: string; balance: number; interestPaid: number }[];
}

export interface StrategyResult {
  strategy: 'avalanche' | 'snowball';
  totalInterestPaid: number;
  totalMonths: number;
  timeline: MonthlySnapshot[];
  milestones: { month: number; debtName: string }[];
}

export interface DebtSimulationResult {
  avalanche: StrategyResult;
  snowball: StrategyResult;
  interestSaved: number;        // snowball total interest – avalanche total interest
  minTotalPayments: number;     // sum of all minimum payments
  budgetSufficient: boolean;    // monthlyBudget >= minTotalPayments
  error?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Round to two decimal places (cents). */
function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Sorting comparators
// ---------------------------------------------------------------------------

/**
 * Avalanche sort: descending by APR, tie-break ascending by balance.
 * Debts earlier in this order receive extra cash first.
 */
function avalancheSort(a: DebtInput, b: DebtInput): number {
  if (b.apr !== a.apr) return b.apr - a.apr;       // higher APR first
  return a.balance - b.balance;                     // lower balance first
}

/**
 * Snowball sort: ascending by balance, tie-break descending by APR.
 * Debts earlier in this order receive extra cash first.
 */
function snowballSort(a: DebtInput, b: DebtInput): number {
  if (a.balance !== b.balance) return a.balance - b.balance;  // lower balance first
  return b.apr - a.apr;                                        // higher APR first
}

// ---------------------------------------------------------------------------
// Core simulation
// ---------------------------------------------------------------------------

/**
 * Run a single-strategy month-by-month simulation.
 *
 * @param debts         – The original debt inputs (immutable).
 * @param monthlyBudget – Total amount available for debt payments each month.
 * @param priorityOrder – Indices into `debts` in the order extra cash should
 *                        be applied (fully sorted by the strategy's rules).
 * @param strategy      – Label returned in the result.
 * @throws              – If the simulation exceeds 600 months.
 */
function simulateStrategy(
  debts: DebtInput[],
  monthlyBudget: number,
  priorityOrder: number[],
  strategy: 'avalanche' | 'snowball',
): StrategyResult {
  // --- Mutable per-debt state ---
  const tracked: {
    name: string;
    balance: number;
    apr: number;
    minPayment: number;
    paidOff: boolean;
  }[] = debts.map((d) => ({
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    minPayment: d.minPayment,
    paidOff: false,
  }));

  let cumulativeInterest = 0;
  const timeline: MonthlySnapshot[] = [];
  const milestones: { month: number; debtName: string }[] = [];

  // Cap at 600 months (50 years) to prevent infinite loops on
  // unsustainable debt structures.
  const MAX_MONTHS = 600;

  for (let month = 1; month <= MAX_MONTHS; month++) {
    // ---- Step a: interest compounding + minimum payments ----
    //
    // For each active (not yet paid-off) debt, in priority order:
    //   balance += balance * (APR / 100 / 12)  – monthly interest
    //   balance -= minPayment
    //
    // Any debt whose balance drops to 0 or below is marked paid-off;
    // the overpayment amount becomes rollover cash for extra payments.
    // ----------------------------------------------------------

    let thisMonthMinPayments = 0;
    let rollover = 0;
    const thisMonthInterestByIndex = new Map<number, number>();

    for (const idx of priorityOrder) {
      const debt = tracked[idx];
      if (debt.paidOff) continue;

      // Register the minimum payment against this (still-active) debt
      thisMonthMinPayments += debt.minPayment;

      // Monthly interest charge
      const interest = roundCents(debt.balance * (debt.apr / 100 / 12));
      thisMonthInterestByIndex.set(idx, interest);

      // Apply interest then minimum payment
      debt.balance = roundCents(debt.balance + interest - debt.minPayment);

      // ---- Step b: collect overpayment as rollover ----
      if (debt.balance <= 0) {
        rollover += roundCents(Math.abs(debt.balance));
        debt.balance = 0;
        debt.paidOff = true;
        milestones.push({ month, debtName: debt.name });
      }
    }

    // ---- Step c: Min_total = sum of min payments for still-active debts ----
    const minTotal = tracked
      .filter((d) => !d.paidOff)
      .reduce((sum, d) => sum + d.minPayment, 0);

    // ---- Step d: Extra_cash = budget – Min_total + rollover ----
    let extraCash = roundCents(monthlyBudget - minTotal + rollover);
    let extraCashApplied = 0;

    // ---- Steps e–f: apply extra cash in priority order ----
    for (const idx of priorityOrder) {
      const debt = tracked[idx];
      if (debt.paidOff) continue;
      if (extraCash <= 0) break;

      if (extraCash >= debt.balance) {
        // Pay off this debt completely
        extraCash = roundCents(extraCash - debt.balance);
        extraCashApplied += debt.balance;
        debt.balance = 0;
        debt.paidOff = true;
        milestones.push({ month, debtName: debt.name });
      } else {
        // Apply what we can
        debt.balance = roundCents(debt.balance - extraCash);
        extraCashApplied += extraCash;
        extraCash = 0;
      }
    }

    // ---- Step g: record snapshot ----
    const totalBalance = roundCents(tracked.reduce((s, d) => s + d.balance, 0));
    cumulativeInterest = roundCents(
      cumulativeInterest +
        [...thisMonthInterestByIndex.values()].reduce((s, v) => s + v, 0),
    );

    timeline.push({
      month,
      totalBalance,
      totalInterestPaid: cumulativeInterest,
      totalPaidThisMonth: roundCents(thisMonthMinPayments + extraCashApplied),
      debts: tracked.map((d, i) => ({
        name: d.name,
        balance: d.balance,
        interestPaid: thisMonthInterestByIndex.get(i) ?? 0,
      })),
    });

    // ---- Step h: all debts paid off? ----
    if (tracked.every((d) => d.paidOff)) {
      return {
        strategy,
        totalInterestPaid: cumulativeInterest,
        totalMonths: month,
        timeline,
        milestones,
      };
    }
  }

  // If we exhaust the month cap the debt structure is unsustainable
  throw new Error('Debt structure appears unsustainable');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compares the Avalanche and Snowball debt-payoff strategies for a given
 * set of debts and monthly budget.
 *
 * The function is pure – no DOM access, no side effects.
 *
 * @param input – Debt list and monthly budget.
 * @returns     – Side-by-side simulation results plus summary metrics.
 *
 * @throws If @type {DebtSimulationInput} contains invalid data (negative
 *         balances, non-positive APR values, etc.) the returned result will
 *         have `budgetSufficient: false` and an `error` message.
 */
export function calculateDebtPayoff(
  input: DebtSimulationInput,
): DebtSimulationResult {
  const { debts, monthlyBudget } = input;

  // ---- Input validation ----
  const validationError = validateInput(input);
  if (validationError) {
    return {
      avalanche: {
        strategy: 'avalanche',
        totalInterestPaid: 0,
        totalMonths: 0,
        timeline: [],
        milestones: [],
      },
      snowball: {
        strategy: 'snowball',
        totalInterestPaid: 0,
        totalMonths: 0,
        timeline: [],
        milestones: [],
      },
      interestSaved: 0,
      minTotalPayments: debts.reduce((s, d) => s + d.minPayment, 0),
      budgetSufficient: false,
      error: validationError,
    };
  }

  // Check budget sufficiency before simulating
  const minTotalPayments = debts.reduce((s, d) => s + d.minPayment, 0);
  const budgetSufficient = monthlyBudget >= minTotalPayments;

  if (!budgetSufficient) {
    return {
      avalanche: {
        strategy: 'avalanche',
        totalInterestPaid: 0,
        totalMonths: 0,
        timeline: [],
        milestones: [],
      },
      snowball: {
        strategy: 'snowball',
        totalInterestPaid: 0,
        totalMonths: 0,
        timeline: [],
        milestones: [],
      },
      interestSaved: 0,
      minTotalPayments,
      budgetSufficient: false,
      error: `Monthly budget (${monthlyBudget}) is less than the sum of minimum payments (${minTotalPayments}). Increase the budget or reduce minimum payments.`,
    };
  }

  // ---- Build priority order indices ----
  const indices = debts.map((_, i) => i);

  const avalancheOrder = [...indices].sort((a, b) =>
    avalancheSort(debts[a], debts[b]),
  );

  const snowballOrder = [...indices].sort((a, b) =>
    snowballSort(debts[a], debts[b]),
  );

  // ---- Run simulations ----
  let avalanche: StrategyResult;
  let snowball: StrategyResult;

  try {
    avalanche = simulateStrategy(debts, monthlyBudget, avalancheOrder, 'avalanche');
    snowball = simulateStrategy(debts, monthlyBudget, snowballOrder, 'snowball');
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown simulation error';
    return {
      avalanche: {
        strategy: 'avalanche',
        totalInterestPaid: 0,
        totalMonths: 0,
        timeline: [],
        milestones: [],
      },
      snowball: {
        strategy: 'snowball',
        totalInterestPaid: 0,
        totalMonths: 0,
        timeline: [],
        milestones: [],
      },
      interestSaved: 0,
      minTotalPayments,
      budgetSufficient,
      error: message,
    };
  }

  // ---- Aggregate results ----
  const interestSaved = roundCents(
    snowball.totalInterestPaid - avalanche.totalInterestPaid,
  );

  return {
    avalanche,
    snowball,
    interestSaved,
    minTotalPayments,
    budgetSufficient: true,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Returns an error message string if inputs are invalid, or `null` if valid.
 */
function validateInput(input: DebtSimulationInput): string | null {
  const { debts, monthlyBudget } = input;

  if (!Array.isArray(debts) || debts.length === 0) {
    return 'At least one debt is required.';
  }

  if (!Number.isFinite(monthlyBudget) || monthlyBudget < 0) {
    return 'Monthly budget must be a non-negative number.';
  }

  for (let i = 0; i < debts.length; i++) {
    const d = debts[i];

    if (!d.name || typeof d.name !== 'string') {
      return `Debt at index ${i} is missing a name.`;
    }

    if (!Number.isFinite(d.balance) || d.balance < 0) {
      return `Debt "${d.name}" has an invalid balance (${d.balance}). Balance must be a non-negative number.`;
    }

    if (!Number.isFinite(d.apr) || d.apr < 0) {
      return `Debt "${d.name}" has an invalid APR (${d.apr}). APR must be a non-negative number.`;
    }

    if (!Number.isFinite(d.minPayment) || d.minPayment < 0) {
      return `Debt "${d.name}" has an invalid minimum payment (${d.minPayment}). Minimum payment must be a non-negative number.`;
    }

    if (d.balance === 0 && d.minPayment === 0) {
      // Both zero — technically fine, but pointless
    }
  }

  return null;
}
