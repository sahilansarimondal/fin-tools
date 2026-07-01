export interface GuardrailsInputs {
  initialPortfolio: number;      // e.g., 1000000
  initialWithdrawalRate: number; // e.g., 5.0 (percentage, not decimal)
  annualReturn: number;          // e.g., 7.0 (percentage)
  annualInflation: number;       // e.g., 2.5 (percentage)
  timelineYears: number;         // e.g., 30
}

export interface YearData {
  year: number;
  startPortfolio: number;
  targetWithdrawal: number;
  actualWithdrawal: number;
  testRate: number;
  guardrailAction: 'none' | 'capital-preservation' | 'prosperity';
  endPortfolio: number;
}

export interface GuardrailsResults {
  years: YearData[];
  finalPortfolio: number;
  totalWithdrawn: number;
  averageWithdrawal: number;
  depletionYear: number | null;  // year when portfolio hit 0, or null if never
}

/**
 * Calculates the year-by-year simulation of the Guyton-Klinger guardrails
 * withdrawal strategy.
 *
 * The algorithm applies upper and lower guardrails around the initial
 * withdrawal rate. If the current withdrawal rate exceeds 120% of the
 * initial rate (upper guardrail), the withdrawal is cut by 10%
 * (capital-preservation rule). If the rate falls below 80% of the
 * initial rate (lower guardrail), the withdrawal is increased by 10%
 * (prosperity rule). Otherwise, the withdrawal is simply inflation-adjusted.
 */
export function calculateGuardrails(inputs: GuardrailsInputs): GuardrailsResults {
  const {
    initialPortfolio,
    initialWithdrawalRate,
    annualReturn,
    annualInflation,
    timelineYears,
  } = inputs;

  const years: YearData[] = [];
  let totalWithdrawn = 0;
  let depletionYear: number | null = null;

  const returnDecimal = annualReturn / 100;
  const inflationDecimal = annualInflation / 100;

  // --- Year 1 initialization ---
  const startPortfolio1 = initialPortfolio;
  const baseWithdrawal1 = initialPortfolio * (initialWithdrawalRate / 100);
  const actualWithdrawal1 = baseWithdrawal1;
  const testRate1 = initialWithdrawalRate;
  const guardrailAction1: 'none' | 'capital-preservation' | 'prosperity' = 'none';
  const endPortfolio1 = (startPortfolio1 - actualWithdrawal1) * (1 + returnDecimal);

  totalWithdrawn += actualWithdrawal1;

  years.push({
    year: 1,
    startPortfolio: startPortfolio1,
    targetWithdrawal: baseWithdrawal1,
    actualWithdrawal: actualWithdrawal1,
    testRate: testRate1,
    guardrailAction: guardrailAction1,
    endPortfolio: endPortfolio1,
  });

  // --- Years 2 through timelineYears ---
  let prevActualWithdrawal = actualWithdrawal1;

  for (let t = 2; t <= timelineYears; t++) {
    const startPortfolio = years[t - 2].endPortfolio;

    // If portfolio already depleted, record zero year and continue
    if (startPortfolio <= 0) {
      years.push({
        year: t,
        startPortfolio: 0,
        targetWithdrawal: 0,
        actualWithdrawal: 0,
        testRate: 0,
        guardrailAction: 'none' as const,
        endPortfolio: 0,
      });

      if (depletionYear === null) {
        depletionYear = t - 1; // portfolio hit 0 at the end of the previous year
      }

      continue;
    }

    // Compute target withdrawal (inflation-adjusted from previous actual)
    const targetWithdrawal = prevActualWithdrawal * (1 + inflationDecimal);

    // Compute test withdrawal rate (as a percentage)
    const testRate = (targetWithdrawal / startPortfolio) * 100;

    // Guardrail thresholds
    const upperGuardrail = initialWithdrawalRate * 1.2;
    const lowerGuardrail = initialWithdrawalRate * 0.8;

    let actualWithdrawal: number;
    let guardrailAction: 'none' | 'capital-preservation' | 'prosperity';

    if (testRate > upperGuardrail) {
      // Capital-preservation rule: cut withdrawal by 10%
      actualWithdrawal = targetWithdrawal * 0.9;
      guardrailAction = 'capital-preservation';
    } else if (testRate < lowerGuardrail) {
      // Prosperity rule: increase withdrawal by 10%
      actualWithdrawal = targetWithdrawal * 1.1;
      guardrailAction = 'prosperity';
    } else {
      // Standard rule: withdrawal is simply inflation-adjusted
      actualWithdrawal = targetWithdrawal;
      guardrailAction = 'none';
    }

    // Compute end-of-year portfolio (with return growth)
    let endPortfolio = (startPortfolio - actualWithdrawal) * (1 + returnDecimal);
    if (endPortfolio < 0) {
      endPortfolio = 0;
    }

    totalWithdrawn += actualWithdrawal;

    years.push({
      year: t,
      startPortfolio,
      targetWithdrawal,
      actualWithdrawal,
      testRate,
      guardrailAction,
      endPortfolio,
    });

    prevActualWithdrawal = actualWithdrawal;
  }

  // --- Result aggregation ---
  const finalPortfolio = years.length > 0 ? years[years.length - 1].endPortfolio : 0;
  const averageWithdrawal = totalWithdrawn / timelineYears;

  // Determine depletion year: first year where endPortfolio = 0
  // (only after the first year, and only if portfolio actually went to zero)
  if (depletionYear === null) {
    for (const yr of years) {
      if (yr.endPortfolio === 0 && yr.startPortfolio > 0) {
        depletionYear = yr.year;
        break;
      }
    }
  }

  return {
    years,
    finalPortfolio,
    totalWithdrawn,
    averageWithdrawal,
    depletionYear,
  };
}

/**
 * Validates the guardrails inputs and returns an array of error messages.
 * Returns an empty array if all inputs are valid.
 */
export function validateGuardrailsInputs(inputs: GuardrailsInputs): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(inputs.initialPortfolio) || inputs.initialPortfolio <= 0) {
    errors.push('Initial portfolio must be greater than 0.');
  }

  if (
    !Number.isFinite(inputs.initialWithdrawalRate) ||
    inputs.initialWithdrawalRate <= 0 ||
    inputs.initialWithdrawalRate > 20
  ) {
    errors.push('Initial withdrawal rate must be greater than 0 and no more than 20%.');
  }

  if (
    !Number.isFinite(inputs.annualReturn) ||
    inputs.annualReturn < 0 ||
    inputs.annualReturn > 30
  ) {
    errors.push('Annual return must be between 0% and 30%.');
  }

  if (
    !Number.isFinite(inputs.annualInflation) ||
    inputs.annualInflation < 0 ||
    inputs.annualInflation > 20
  ) {
    errors.push('Annual inflation must be between 0% and 20%.');
  }

  if (
    !Number.isFinite(inputs.timelineYears) ||
    inputs.timelineYears < 10 ||
    inputs.timelineYears > 60
  ) {
    errors.push('Timeline years must be between 10 and 60.');
  }

  return errors;
}
