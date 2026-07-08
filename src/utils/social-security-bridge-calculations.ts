/**
 * Social Security Bridge Strategy Calculator — Calculation Engine
 *
 * Calculates the dedicated bridge fund required to cover living expenses
 * between early retirement and Social Security claiming age.
 */

export interface SocialSecurityBridgeInput {
  earlyRetirementAge: number;
  targetAnnualIncome: number;
  delayedClaimingAge: number;
  estimatedAnnualSSBenefit: number;
}

export interface YearlyData {
  age: number;
  phase: 'Bridge' | 'Stabilized';
  socialSecurityIncome: number;
  portfolioWithdrawal: number;
}

export interface SocialSecurityBridgeResult {
  bridgeYears: number;
  totalBridgeFundRequired: number;
  postClaimingAnnualDrawdown: number;
  yearlyData: YearlyData[];
  isValid: boolean;
  validationMessage: string;
}

export function calculateSocialSecurityBridge(
  input: SocialSecurityBridgeInput
): SocialSecurityBridgeResult {
  const { earlyRetirementAge, targetAnnualIncome, delayedClaimingAge, estimatedAnnualSSBenefit } = input;

  // Validation
  const bridgeYears = delayedClaimingAge - earlyRetirementAge;

  if (bridgeYears <= 0) {
    return {
      bridgeYears: 0,
      totalBridgeFundRequired: 0,
      postClaimingAnnualDrawdown: 0,
      yearlyData: [],
      isValid: false,
      validationMessage:
        'Delayed claiming age must be greater than your early retirement age.',
    };
  }

  // Calculate total bridge fund required (nominal, no growth assumed)
  const totalBridgeFundRequired = targetAnnualIncome * bridgeYears;

  // Post-claiming portfolio drawdown (clamped to $0 if SS covers everything)
  const postClaimingAnnualDrawdown = Math.max(
    0,
    targetAnnualIncome - estimatedAnnualSSBenefit
  );

  // Generate year-by-year drawdown schedule from early retirement to age 85
  const endAge = 85;
  const yearlyData: YearlyData[] = [];

  for (let age = earlyRetirementAge; age <= endAge; age++) {
    const isBridgePhase = age < delayedClaimingAge;
    const ssIncome = isBridgePhase ? 0 : estimatedAnnualSSBenefit;
    const portfolioWithdrawal = isBridgePhase
      ? targetAnnualIncome
      : Math.max(0, targetAnnualIncome - estimatedAnnualSSBenefit);

    yearlyData.push({
      age,
      phase: isBridgePhase ? 'Bridge' : 'Stabilized',
      socialSecurityIncome: ssIncome,
      portfolioWithdrawal,
    });
  }

  return {
    bridgeYears,
    totalBridgeFundRequired,
    postClaimingAnnualDrawdown,
    yearlyData,
    isValid: true,
    validationMessage: '',
  };
}
