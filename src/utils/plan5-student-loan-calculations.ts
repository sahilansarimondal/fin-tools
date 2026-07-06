export interface Plan5Inputs {
  annualSalary: number;
  frequency: 'annually' | 'monthly' | 'weekly';
}

export interface Plan5Results {
  threshold: number;           // £25,000
  deductibleIncome: number;    // max(0, salary - 25000)
  annualRepayment: number;     // deductibleIncome * 0.09
  periodicRepayment: number;   // based on frequency
  frequency: string;
  belowThreshold: boolean;     // salary <= 25000
}

const PLAN5_THRESHOLD = 25000;
const PLAN5_RATE = 0.09;

export function calculatePlan5(inputs: Plan5Inputs): Plan5Results {
  const { annualSalary, frequency } = inputs;

  const belowThreshold = annualSalary <= PLAN5_THRESHOLD;
  const deductibleIncome = belowThreshold ? 0 : annualSalary - PLAN5_THRESHOLD;
  const annualRepayment = deductibleIncome * PLAN5_RATE;

  let periodicRepayment: number;
  let frequencyLabel: string;

  switch (frequency) {
    case 'annually':
      periodicRepayment = annualRepayment;
      frequencyLabel = 'year';
      break;
    case 'monthly':
      periodicRepayment = annualRepayment / 12;
      frequencyLabel = 'month';
      break;
    case 'weekly':
      periodicRepayment = annualRepayment / 52;
      frequencyLabel = 'week';
      break;
  }

  return {
    threshold: PLAN5_THRESHOLD,
    deductibleIncome,
    annualRepayment,
    periodicRepayment,
    frequency: frequencyLabel,
    belowThreshold,
  };
}
