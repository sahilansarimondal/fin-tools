export interface MortgageVsIsaInputs {
  balance: number;
  termYears: number;
  mortgageRate: number;
  monthlySurplus: number;
  isaReturn: number;
}

export interface YearlyDataPoint {
  year: number;
  strategyA_ISA: number;
  strategyA_mortgage: number;
  strategyB_ISA: number;
  strategyB_mortgage: number;
}

export interface MortgageVsIsaResult {
  monthlyPayment: number;
  strategyA: {
    isaBalance: number;
    totalInterestPaid: number;
  };
  strategyB: {
    isaBalance: number;
    totalInterestPaid: number;
  };
  yearsShaved: number;
  winner: 'A' | 'B';
  difference: number;
  yearlyData: YearlyDataPoint[];
}

/**
 * Calculate standard monthly mortgage payment using the amortisation formula:
 * M = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * where r is the monthly interest rate and n is the number of months.
 */
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  totalMonths: number,
): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / totalMonths;
  const factor = Math.pow(1 + r, totalMonths);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Simulate a mortgage balance over time given a monthly payment.
 * Returns an array of month-by-month {balance, interestPaid} objects.
 */
function simulateMortgage(
  principal: number,
  annualRate: number,
  monthlyPayment: number,
  maxMonths: number,
): { balance: number; interestPaid: number; isPaidOff: boolean; paidOffMonth: number }[] {
  const r = annualRate / 100 / 12;
  let balance = principal;
  const months: { balance: number; interestPaid: number; isPaidOff: boolean; paidOffMonth: number }[] = [];

  for (let m = 1; m <= maxMonths; m++) {
    if (balance <= 0) {
      months.push({ balance: 0, interestPaid: 0, isPaidOff: true, paidOffMonth: m - 1 });
      continue;
    }
    const interest = balance * r;
    let principalPayment = monthlyPayment - interest;
    if (principalPayment >= balance) {
      principalPayment = balance;
    }
    balance -= principalPayment;
    months.push({
      balance: Math.max(0, balance),
      interestPaid: interest,
      isPaidOff: balance <= 0,
      paidOffMonth: balance <= 0 ? m : 0,
    });
  }

  return months;
}

/**
 * Main calculation engine: compares investing surplus vs overpaying mortgage.
 */
export function calculateMortgageVsIsa(inputs: MortgageVsIsaInputs): MortgageVsIsaResult {
  const { balance, termYears, mortgageRate, monthlySurplus, isaReturn } = inputs;
  const totalMonths = termYears * 12;
  const monthlyPayment = calculateMonthlyPayment(balance, mortgageRate, totalMonths);

  // ---- Strategy A: Invest first ----
  // Pay standard mortgage for full term, invest surplus in ISA from month one
  const rISA = isaReturn / 100 / 12; // monthly ISA return
  let isaA = 0;
  const strategyAMonths = simulateMortgage(balance, mortgageRate, monthlyPayment, totalMonths);
  let totalInterestA = 0;

  for (let m = 0; m < totalMonths; m++) {
    totalInterestA += strategyAMonths[m].interestPaid;
    // ISA grows by return first, then add surplus
    isaA = isaA * (1 + rISA) + monthlySurplus;
  }

  // ---- Strategy B: Overpay first ----
  // Pay standard + surplus toward mortgage until cleared, then redirect full budget to ISA
  const overpaymentTotal = monthlyPayment + monthlySurplus;
  const strategyBMonths = simulateMortgage(balance, mortgageRate, overpaymentTotal, totalMonths);
  let totalInterestB = 0;
  let isaB = 0;
  let paidOffMonth = totalMonths; // default: never paid off early

  for (let m = 0; m < totalMonths; m++) {
    totalInterestB += strategyBMonths[m].interestPaid;
    if (strategyBMonths[m].isPaidOff && paidOffMonth === totalMonths) {
      paidOffMonth = m + 1; // month is 0-indexed, so +1
    }
  }

  // Now simulate ISA for Strategy B: nothing invested until mortgage is paid off,
  // then full budget (payment + surplus) goes into ISA for remaining months
  for (let m = 0; m < totalMonths; m++) {
    if (m >= paidOffMonth) {
      // Mortgage is paid off, redirect full budget to ISA
      isaB = isaB * (1 + rISA) + overpaymentTotal;
    } else {
      // Still paying mortgage, no surplus for ISA (all surplus went to mortgage)
      isaB = isaB * (1 + rISA);
    }
  }

  // ---- Aggregate yearly data ----
  const yearlyData: YearlyDataPoint[] = [];
  for (let y = 1; y <= termYears; y++) {
    const monthEnd = y * 12;
    const monthStart = monthEnd - 12;

    // Recalculate ISA balances at year boundaries for display
    let isaAYear = 0;
    let isaBYear = 0;

    // Recaculate to get year-end balances
    for (let m = 0; m < monthEnd && m < totalMonths; m++) {
      isaAYear = isaAYear * (1 + rISA) + monthlySurplus;

      if (m >= paidOffMonth) {
        isaBYear = isaBYear * (1 + rISA) + overpaymentTotal;
      } else {
        isaBYear = isaBYear * (1 + rISA);
      }
    }

    // Get mortgage balances at year end
    const idxA = Math.min(monthEnd - 1, totalMonths - 1);
    const idxB = Math.min(monthEnd - 1, totalMonths - 1);

    yearlyData.push({
      year: y,
      strategyA_ISA: Math.round(isaAYear),
      strategyA_mortgage: Math.round(strategyAMonths[idxA]?.balance ?? 0),
      strategyB_ISA: Math.round(isaBYear),
      strategyB_mortgage: Math.round(strategyBMonths[idxB]?.balance ?? 0),
    });
  }

  // ---- Determine winner ----
  // Net worth at end = ISA balance (mortgage is 0 since both are paid off by end of original term)
  // Strategy A: mortgage is paid off at original term, ISA has invested all surplus
  // Strategy B: mortgage paid off early, ISA invested full budget for remaining time
  // Since both mortgages reach 0 by the end of the original term (by definition),
  // the winner is whoever has the higher ISA balance.
  const finalISA_A = isaA;
  const finalISA_B = isaB;

  const winner: 'A' | 'B' = finalISA_A >= finalISA_B ? 'A' : 'B';
  const difference = Math.abs(finalISA_A - finalISA_B);

  // Years shaved = original term - actual payoff time in years
  const yearsShaved = paidOffMonth < totalMonths
    ? Math.round((totalMonths - paidOffMonth) / 12 * 10) / 10
    : 0;

  return {
    monthlyPayment: Math.round(monthlyPayment),
    strategyA: {
      isaBalance: Math.round(finalISA_A),
      totalInterestPaid: Math.round(totalInterestA),
    },
    strategyB: {
      isaBalance: Math.round(finalISA_B),
      totalInterestPaid: Math.round(totalInterestB),
    },
    yearsShaved,
    winner,
    difference: Math.round(difference),
    yearlyData,
  };
}

/**
 * Format a number as GBP: £1,234
 */
export function formatGBP(value: number): string {
  if (value < 0) {
    return '-£' + Math.abs(value).toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return '£' + value.toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format a number as short GBP: £1.2K, £3.5M
 */
export function formatGBPShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return sign + '£' + (abs / 1_000_000).toFixed(1) + 'M';
  }
  if (abs >= 1_000) {
    return sign + '£' + (abs / 1_000).toFixed(0) + 'K';
  }
  return sign + '£' + abs.toFixed(0);
}
