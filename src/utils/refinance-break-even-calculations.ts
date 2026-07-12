export type Region = 'US' | 'UK';

export interface BreakEvenInputs {
  region: Region;
  remainingBalance: number;       // Current mortgage principal
  currentRate: number;            // Annual interest rate (percentage, e.g. 5.5)
  remainingTermYears: number;     // Years left on current mortgage
  newRate: number;                // New annual interest rate
  newTermYears: number;           // New mortgage term in years
  upfrontFees: number;            // Closing costs (US) or arrangement fees (UK)
  financeFees: boolean;           // If true, add fees to new principal
}

export interface MonthlyScheduleEntry {
  month: number;
  oldBalance: number;
  newBalance: number;
  oldPayment: number;
  newPayment: number;
  cumulativeOldInterest: number;
  cumulativeNewInterest: number;
  cumulativeSavings: number;
}

export interface BreakEvenResult {
  // Core outputs
  currentMonthlyPayment: number;
  newMonthlyPayment: number;
  monthlySavings: number;
  breakEvenMonths: number;
  breakEvenYears: number;
  breakEvenRemainingMonths: number;  // months remainder after full years

  // Lifetime analysis
  oldTotalCost: number;
  newTotalCost: number;
  lifetimeSavings: number;
  oldTotalInterest: number;
  newTotalInterest: number;

  // New principal breakdown
  newPrincipal: number;
  feesFinanced: boolean;

  // Status
  isPositiveSavings: boolean;        // false if new payment > old payment
  message: string;                   // Human-readable result message

  // Chart data
  schedule: MonthlyScheduleEntry[];

  // Localization
  currencySymbol: string;
  regionLabel: string;               // "Refinance" or "Remortgage"
}

/**
 * Standard amortization formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n - 1 ]
 * P = principal, i = monthly rate, n = total months
 */
function calculateMonthlyPayment(principal: number, annualRatePercent: number, termYears: number): number {
  if (principal <= 0) return 0;
  const i = annualRatePercent / 100 / 12;
  const n = termYears * 12;
  if (i === 0) return principal / n;
  const factor = Math.pow(1 + i, n);
  return principal * (i * factor) / (factor - 1);
}

/**
 * Calculate total interest paid over the life of a loan
 * by simulating month-by-month amortization.
 */
function calculateTotalInterest(
  principal: number,
  annualRatePercent: number,
  termYears: number
): number {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRatePercent, termYears);
  return (monthlyPayment * termYears * 12) - principal;
}

/**
 * Generate month-by-month schedule showing old vs new loan trajectories
 * and cumulative savings up to and beyond the break-even point.
 */
function generateSchedule(
  inputs: BreakEvenInputs,
  newPrincipal: number,
  currentMonthlyPayment: number,
  newMonthlyPayment: number,
): MonthlyScheduleEntry[] {
  const schedule: MonthlyScheduleEntry[] = [];

  const oldMonthlyRate = inputs.currentRate / 100 / 12;
  const newMonthlyRate = inputs.newRate / 100 / 12;
  const maxMonths = Math.max(inputs.remainingTermYears, inputs.newTermYears) * 12;

  let oldBalance = inputs.remainingBalance;
  let newBalance = newPrincipal;
  let cumulativeOldInterest = 0;
  let cumulativeNewInterest = 0;

  for (let month = 1; month <= maxMonths; month++) {
    const oldInterest = oldBalance * oldMonthlyRate;
    const newInterest = newBalance * newMonthlyRate;

    const oldPrincipalPaid = Math.max(0, currentMonthlyPayment - oldInterest);
    const newPrincipalPaid = Math.max(0, newMonthlyPayment - newInterest);

    cumulativeOldInterest += oldInterest;
    cumulativeNewInterest += newInterest;

    oldBalance = Math.max(0, oldBalance - oldPrincipalPaid);
    newBalance = Math.max(0, newBalance - newPrincipalPaid);

    const cumulativeSavings = cumulativeOldInterest - cumulativeNewInterest
      + (inputs.remainingBalance - inputs.financeFees - newPrincipal) /* adjust for fee financing */
      + (inputs.financeFees ? 0 : -inputs.upfrontFees);  /* out-of-pocket fees */

    schedule.push({
      month,
      oldBalance,
      newBalance,
      oldPayment: currentMonthlyPayment,
      newPayment: newMonthlyPayment,
      cumulativeOldInterest,
      cumulativeNewInterest,
      cumulativeSavings,
    });

    if (oldBalance <= 0 && newBalance <= 0) break;
  }

  return schedule;
}

/**
 * Main calculation function
 */
export function calculateBreakEven(inputs: BreakEvenInputs): BreakEvenResult {
  const { region, remainingBalance, currentRate, remainingTermYears, newRate, newTermYears, upfrontFees, financeFees } = inputs;

  const currencySymbol = region === 'US' ? '$' : '£';
  const regionLabel = region === 'US' ? 'Refinance' : 'Remortgage';

  // Step 1: Current monthly payment
  const currentMonthlyPayment = calculateMonthlyPayment(remainingBalance, currentRate, remainingTermYears);

  // Step 2: New principal
  const newPrincipal = financeFees ? remainingBalance + upfrontFees : remainingBalance;
  const feesFinanced = financeFees;

  // Step 3: New monthly payment
  const newMonthlyPayment = calculateMonthlyPayment(newPrincipal, newRate, newTermYears);

  // Step 4: Monthly savings
  const monthlySavings = currentMonthlyPayment - newMonthlyPayment;
  const isPositiveSavings = monthlySavings > 0;

  // Step 5: Break-even months (cashflow method)
  let breakEvenMonths = 0;
  let breakEvenYears = 0;
  let breakEvenRemainingMonths = 0;

  if (isPositiveSavings && upfrontFees > 0) {
    breakEvenMonths = Math.ceil(upfrontFees / monthlySavings);
    breakEvenYears = Math.floor(breakEvenMonths / 12);
    breakEvenRemainingMonths = breakEvenMonths % 12;
  } else if (!isPositiveSavings) {
    breakEvenMonths = -1; // sentinel: never breaks even
  }
  // If upfrontFees === 0, break-even is immediate (0 months)

  // Step 6: Lifetime cost comparison
  const oldTotalCost = currentMonthlyPayment * remainingTermYears * 12;
  const newTotalCost = (newMonthlyPayment * newTermYears * 12) + (financeFees ? 0 : upfrontFees);
  const lifetimeSavings = oldTotalCost - newTotalCost;

  const oldTotalInterest = oldTotalCost - remainingBalance;
  const newTotalInterest = newTotalCost - remainingBalance;

  // Generate schedule for chart
  const schedule = generateSchedule(inputs, newPrincipal, currentMonthlyPayment, newMonthlyPayment);

  // Message
  let message = '';
  if (!isPositiveSavings) {
    message = `Your new ${regionLabel.toLowerCase()} payment (${currencySymbol}${newMonthlyPayment.toFixed(2)}/mo) is higher than your current payment (${currencySymbol}${currentMonthlyPayment.toFixed(2)}/mo). You will not break even on monthly cash flow.`;
  } else if (upfrontFees === 0) {
    message = `With no upfront fees, you save ${currencySymbol}${monthlySavings.toFixed(2)}/mo immediately. There is no break-even period — every month is pure savings.`;
  } else {
    message = `By spending ${currencySymbol}${upfrontFees.toLocaleString()} on ${region === 'US' ? 'closing costs' : 'arrangement fees'}, you save ${currencySymbol}${monthlySavings.toFixed(2)}/mo. You will recoup your costs in ${breakEvenMonths} months${breakEvenYears > 0 ? ` (${breakEvenYears} year${breakEvenYears > 1 ? 's' : ''}${breakEvenRemainingMonths > 0 ? `, ${breakEvenRemainingMonths} month${breakEvenRemainingMonths > 1 ? 's' : ''}` : ''})` : ''}.`;
  }

  return {
    currentMonthlyPayment: Math.round(currentMonthlyPayment * 100) / 100,
    newMonthlyPayment: Math.round(newMonthlyPayment * 100) / 100,
    monthlySavings: Math.round(monthlySavings * 100) / 100,
    breakEvenMonths,
    breakEvenYears,
    breakEvenRemainingMonths,
    oldTotalCost: Math.round(oldTotalCost),
    newTotalCost: Math.round(newTotalCost),
    lifetimeSavings: Math.round(lifetimeSavings),
    oldTotalInterest: Math.round(oldTotalInterest),
    newTotalInterest: Math.round(newTotalInterest),
    newPrincipal: Math.round(newPrincipal),
    feesFinanced,
    isPositiveSavings,
    message,
    schedule,
    currencySymbol,
    regionLabel,
  };
}

// Formatting helpers
export function formatCurrency(value: number, region: Region): string {
  const symbol = region === 'US' ? '$' : '£';
  const locale = region === 'US' ? 'en-US' : 'en-GB';
  return `${symbol}${value.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCurrencyDetailed(value: number, region: Region): string {
  const symbol = region === 'US' ? '$' : '£';
  const locale = region === 'US' ? 'en-US' : 'en-GB';
  return `${symbol}${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatBreakEvenText(months: number, years: number, remainingMonths: number): string {
  if (months <= 0) return 'Immediate';
  if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
  if (remainingMonths === 0) return `${months} months (${years} year${years !== 1 ? 's' : ''})`;
  return `${months} months (${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''})`;
}
