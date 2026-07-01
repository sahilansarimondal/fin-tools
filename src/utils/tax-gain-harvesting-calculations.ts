export type FilingStatus = 'single' | 'mfj' | 'hoh';

export interface TaxConstants {
  standardDeductions: Record<FilingStatus, number>;
  ltcgTiers: Record<FilingStatus, { zero: number; fifteen: number; twenty: number }>;
}

export interface CalculationInput {
  filingStatus: FilingStatus;
  grossOrdinaryIncome: number;
  useStandardDeduction: boolean;
  itemizedDeduction: number;
  alreadyRealizedGains: number;
  potentialHarvest: number;
}

export interface BracketBreakdown {
  ordinaryIncomePortion: number;
  zeroPercentPortion: number;
  fifteenPercentPortion: number;
  twentyPercentPortion: number;
}

export interface CalculationResult {
  totalDeduction: number;
  taxableOrdinaryIncome: number;
  headroom: number;
  totalCapitalGains: number;
  brackets: BracketBreakdown;
  taxOnZeroPercent: number;
  taxOnFifteenPercent: number;
  taxOnTwentyPercent: number;
  totalTax: number;
  taxOnHarvestedGains: number;
  effectiveRate: number;
  isHarvestTaxFree: boolean;
}

export const TAX_CONSTANTS: TaxConstants = {
  standardDeductions: {
    single: 16100,
    mfj: 32200,
    hoh: 24150,
  },
  ltcgTiers: {
    single: { zero: 49450, fifteen: 545500, twenty: Infinity },
    mfj: { zero: 98900, fifteen: 613700, twenty: Infinity },
    hoh: { zero: 66200, fifteen: 579600, twenty: Infinity },
  },
};

/**
 * Calculates the federal tax impact of harvesting long-term capital gains.
 *
 * The function determines how much of the total capital gains (already realized
 * + potential harvest) falls into the 0%, 15%, and 20% LTCG brackets based on
 * the taxpayer's filing status and ordinary income. It also computes the
 * marginal tax attributable specifically to the harvest.
 */
export function calculateTaxGainHarvesting(input: CalculationInput): CalculationResult {
  const {
    filingStatus,
    grossOrdinaryIncome,
    useStandardDeduction,
    itemizedDeduction,
    alreadyRealizedGains,
    potentialHarvest,
  } = input;

  // 1. Determine total deduction
  const standardDeduction = TAX_CONSTANTS.standardDeductions[filingStatus];
  const totalDeduction = useStandardDeduction ? standardDeduction : Math.max(itemizedDeduction, 0);

  // 2. Taxable ordinary income
  const taxableOrdinaryIncome = Math.max(0, grossOrdinaryIncome - totalDeduction);

  // 3. LTCG brackets for filing status
  const tiers = TAX_CONSTANTS.ltcgTiers[filingStatus];
  const zeroThreshold = tiers.zero;
  const fifteenThreshold = tiers.fifteen;

  // 4. Headroom in the 0% LTCG bracket
  const headroom = Math.max(0, zeroThreshold - taxableOrdinaryIncome);

  // 5. Total capital gains
  const totalCapitalGains = alreadyRealizedGains + potentialHarvest;

  // 6. Compute bracket breakdown for total gains
  const brackets = computeBracketBreakdown(
    taxableOrdinaryIncome,
    totalCapitalGains,
    zeroThreshold,
    fifteenThreshold
  );

  // 7. Tax calculations
  const taxOnZeroPercent = 0;
  const taxOnFifteenPercent = brackets.fifteenPercentPortion * 0.15;
  const taxOnTwentyPercent = brackets.twentyPercentPortion * 0.20;
  const totalTax = taxOnFifteenPercent + taxOnTwentyPercent;

  // 8. Compute tax on harvest specifically
  //    Tax with harvest = totalTax (already computed using totalCapitalGains)
  //    Tax without harvest = compute using alreadyRealizedGains only
  const bracketsWithoutHarvest = computeBracketBreakdown(
    taxableOrdinaryIncome,
    alreadyRealizedGains,
    zeroThreshold,
    fifteenThreshold
  );
  const taxWithoutHarvest = bracketsWithoutHarvest.fifteenPercentPortion * 0.15
    + bracketsWithoutHarvest.twentyPercentPortion * 0.20;

  const taxOnHarvestedGains = totalTax - taxWithoutHarvest;
  const effectiveRate = potentialHarvest > 0 ? taxOnHarvestedGains / potentialHarvest : 0;
  const isHarvestTaxFree = taxOnHarvestedGains === 0;

  return {
    totalDeduction,
    taxableOrdinaryIncome,
    headroom,
    totalCapitalGains,
    brackets,
    taxOnZeroPercent,
    taxOnFifteenPercent,
    taxOnTwentyPercent,
    totalTax,
    taxOnHarvestedGains,
    effectiveRate,
    isHarvestTaxFree,
  };
}

/**
 * Computes how total capital gains are split across the 0%, 15%, and 20%
 * LTCG brackets, given the taxable ordinary income and bracket thresholds.
 *
 * LTCG stack on top of ordinary income. The stacking order is:
 *   [Ordinary Income] -> [0% LTCG] -> [15% LTCG] -> [20% LTCG]
 */
function computeBracketBreakdown(
  taxableOrdinaryIncome: number,
  totalCapitalGains: number,
  zeroThreshold: number,
  fifteenThreshold: number
): BracketBreakdown {
  if (totalCapitalGains <= 0) {
    return {
      ordinaryIncomePortion: taxableOrdinaryIncome,
      zeroPercentPortion: 0,
      fifteenPercentPortion: 0,
      twentyPercentPortion: 0,
    };
  }

  let remaining = totalCapitalGains;

  // 0% bracket: space between zeroThreshold and what ordinary income already consumes
  const headroom = Math.max(0, zeroThreshold - taxableOrdinaryIncome);
  const zeroPercentPortion = Math.min(remaining, headroom);
  remaining -= zeroPercentPortion;

  // 15% bracket: space between what's already stacked and the fifteenThreshold
  // The "top" of income so far is at max(taxableOrdinaryIncome, zeroThreshold)
  // (because ordinary income fills first, then 0% LTCG fills up to zeroThreshold)
  const topAfterZero = Math.max(taxableOrdinaryIncome, zeroThreshold) + zeroPercentPortion;
  // Actually, let me reconsider. After ordinary income and 0% LTCG:
  // If OI < Z: we filled OI to Z (with portion of gains going 0%)
  // If OI >= Z: we filled OI (all the way past Z already)
  // So the 15% bracket starts at max(OI, Z) in the stack
  const fifteenStart = Math.max(taxableOrdinaryIncome + zeroPercentPortion, zeroThreshold);
  const fifteenSpace = Math.max(0, fifteenThreshold - fifteenStart);
  const fifteenPercentPortion = Math.min(remaining, fifteenSpace);
  remaining -= fifteenPercentPortion;

  // 20% bracket: everything else
  const twentyPercentPortion = remaining;

  return {
    ordinaryIncomePortion: taxableOrdinaryIncome,
    zeroPercentPortion,
    fifteenPercentPortion,
    twentyPercentPortion,
  };
}

/**
 * Formats a number as a USD currency string.
 */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return '$0';
  }
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}
