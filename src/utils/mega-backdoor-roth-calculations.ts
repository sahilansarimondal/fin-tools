export interface MegaBackdoorRothInput {
  age: number;
  salary: number;
  regular401kContribution: number;
  employerMatchPercent: number;
  employerMatchFixed: number;
  employerMatchIsPercent: boolean;
}

export interface MegaBackdoorRothResult {
  maxElectiveDeferral: number;
  maxOverallLimit: number;
  catchUpLabel: string;
  employerContribution: number;
  totalUsed: number;
  megaSpace: number;
  isOverElectiveDeferral: boolean;
  isOverOverallLimit: boolean;
  regularPctOfCap: number;
  employerPctOfCap: number;
  megaPctOfCap: number;
  compensationCapped: boolean;
}

interface AgeLimits {
  electiveDeferral: number;
  overallLimit: number;
  catchUpLabel: string;
}

export function getLimitsForAge(age: number): AgeLimits {
  if (age < 50) {
    return {
      electiveDeferral: 24500,
      overallLimit: 72000,
      catchUpLabel: 'None',
    };
  } else if (age >= 50 && age <= 59) {
    return {
      electiveDeferral: 32500,
      overallLimit: 80000,
      catchUpLabel: 'Standard Catch-up (+$8,000)',
    };
  } else if (age >= 60 && age <= 63) {
    return {
      electiveDeferral: 35750,
      overallLimit: 83250,
      catchUpLabel: 'Super Catch-up (+$11,250)',
    };
  } else {
    // age 64+
    return {
      electiveDeferral: 32500,
      overallLimit: 80000,
      catchUpLabel: 'Standard Catch-up (+$8,000)',
    };
  }
}

export function calculateMegaBackdoorRoth(input: MegaBackdoorRothInput): MegaBackdoorRothResult {
  const limits = getLimitsForAge(input.age);

  // Cap the compensation at $360,000
  const cappedSalary = Math.min(input.salary, 360000);
  const compensationCapped = input.salary > 360000;

  // Calculate employer contribution
  let employerContribution: number;
  if (input.employerMatchIsPercent) {
    employerContribution = cappedSalary * (input.employerMatchPercent / 100);
  } else {
    employerContribution = input.employerMatchFixed;
  }

  // Clamp regular contribution to max elective deferral (for display purposes)
  const regularContribution = Math.min(input.regular401kContribution, limits.electiveDeferral);
  const isOverElectiveDeferral = input.regular401kContribution > limits.electiveDeferral;

  // Calculate mega space
  const totalUsed = regularContribution + employerContribution;
  const megaSpace = Math.max(0, limits.overallLimit - totalUsed);
  const isOverOverallLimit = totalUsed > limits.overallLimit;

  // Percentages for visual breakdown
  const regularPctOfCap = (regularContribution / limits.overallLimit) * 100;
  const employerPctOfCap = (employerContribution / limits.overallLimit) * 100;
  const megaPctOfCap = (megaSpace / limits.overallLimit) * 100;

  return {
    maxElectiveDeferral: limits.electiveDeferral,
    maxOverallLimit: limits.overallLimit,
    catchUpLabel: limits.catchUpLabel,
    employerContribution,
    totalUsed,
    megaSpace,
    isOverElectiveDeferral,
    isOverOverallLimit,
    regularPctOfCap,
    employerPctOfCap,
    megaPctOfCap,
    compensationCapped,
  };
}
