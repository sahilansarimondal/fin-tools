/**
 * RSU Vesting Tax Withholding Calculator — Calculation Engine
 *
 * Calculates federal (supplemental 22%/37%), FICA (SS + Medicare + Additional Medicare),
 * and state withholding for RSU vesting events under 2026 IRS rules.
 *
 * Uses the IRS supplemental wage withholding method:
 *   - 22% flat on supplemental wages up to $1M per year
 *   - 37% on supplemental wages over $1M per year
 */

// ---------------------------------------------------------------------------
// 2026 IRS Constants
// ---------------------------------------------------------------------------

/** Flat supplemental withholding rate for wages under $1M */
const FEDERAL_SUPPLEMENTAL_RATE = 0.22;

/** Flat supplemental withholding rate for wages over $1M */
const FEDERAL_SUPPLEMENTAL_HIGH_RATE = 0.37;

/** Annual threshold above which supplemental wages are taxed at 37% */
const FEDERAL_SUPPLEMENTAL_THRESHOLD = 1_000_000;

/** Social Security wage base for 2026 */
const SS_WAGE_BASE = 184_500;

/** Social Security OASDI rate (6.2%) */
const SS_RATE = 0.062;

/** Medicare HI rate (1.45%) */
const MEDICARE_RATE = 0.0145;

/** Income threshold for Additional Medicare Tax (single filer) */
const ADDITIONAL_MEDICARE_THRESHOLD = 200_000;

/** Additional Medicare Tax rate (0.9%) */
const ADDITIONAL_MEDICARE_RATE = 0.009;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface RsuVestingInput {
  /** Number of RSU shares vesting in this event */
  sharesVesting: number;

  /** Fair Market Value per share on the vesting date ($) */
  fmvPerShare: number;

  /** Year-to-date income BEFORE this vesting event ($) */
  ytdIncome: number;

  /** State supplemental withholding rate as a percentage (e.g. 10.23 for CA) */
  stateTaxRate: number;
}

export interface RsuVestingResult {
  // Gross
  /** Total value of this vesting event (sharesVesting * fmvPerShare) */
  grossVestValue: number;

  // Federal
  /** Federal supplemental withholding calculated under the 22%/37% split */
  federalSupplementalTax: number;

  /** Human-readable label for the federal rate applied (e.g. "22%" or "22% + 37% on $X") */
  federalRateApplied: string;

  // FICA
  /** Social Security tax at 6.2% up to the wage base cap */
  socialSecurityTax: number;

  /** Medicare tax at 1.45% on all wages */
  medicareTax: number;

  /** Additional Medicare Tax at 0.9% on wages exceeding $200K */
  additionalMedicareTax: number;

  // State
  /** State withholding tax at the specified supplemental rate */
  stateTax: number;

  // Totals
  /** Sum of all federal, FICA, and state taxes */
  totalTaxLiability: number;

  /** Effective tax rate as a percentage of gross vest value */
  effectiveTaxRate: number;

  // Sell-to-Cover
  /** Whole shares sold to cover the total tax liability (rounded up) */
  sellToCoverShares: number;

  /** Shares remaining after the sell-to-cover (can be negative) */
  netSharesDelivered: number;

  /** Cash surplus from rounding up to whole shares: (soldShares * fmv) - totalTax */
  cashRefund: number;
}

// ---------------------------------------------------------------------------
// Edge-case helpers
// ---------------------------------------------------------------------------

/**
 * Safely clamps a YTD income value to zero if it is negative or NaN.
 * The IRS does not allow negative wages to reduce withholding — at minimum,
 * year-to-date wages are treated as $0 for cap calculations.
 */
function safeYtdIncome(ytdIncome: number): number {
  return Number.isFinite(ytdIncome) && ytdIncome > 0 ? ytdIncome : 0;
}

/**
 * Clamps a number to non-negative. Used to prevent negative tax base amounts.
 */
function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

// ---------------------------------------------------------------------------
// Main calculation function
// ---------------------------------------------------------------------------

/**
 * Calculates all federal, FICA, and state withholding taxes for an RSU
 * vesting event under 2026 IRS rules, and computes sell-to-cover mechanics.
 *
 * @param input - RSU vesting parameters (shares, FMV, YTD income, state rate)
 * @returns Detailed withholding breakdown including sell-to-cover results
 */
export function calculateRsuVestingTax(input: RsuVestingInput): RsuVestingResult {
  const { sharesVesting, fmvPerShare, stateTaxRate } = input;

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  // If inputs are invalid (non-positive shares or FMV), return zeroed result.
  // This prevents division by zero and nonsensical calculations downstream.

  if (
    !Number.isFinite(sharesVesting) ||
    !Number.isFinite(fmvPerShare) ||
    sharesVesting <= 0 ||
    fmvPerShare <= 0
  ) {
    return {
      grossVestValue: 0,
      federalSupplementalTax: 0,
      federalRateApplied: 'N/A (invalid input)',
      socialSecurityTax: 0,
      medicareTax: 0,
      additionalMedicareTax: 0,
      stateTax: 0,
      totalTaxLiability: 0,
      effectiveTaxRate: 0,
      sellToCoverShares: 0,
      netSharesDelivered: 0,
      cashRefund: 0,
    };
  }

  const ytd = safeYtdIncome(input.ytdIncome);

  // -------------------------------------------------------------------------
  // 1. Gross Vest Value
  // -------------------------------------------------------------------------

  const grossVestValue = sharesVesting * fmvPerShare;

  // -------------------------------------------------------------------------
  // 2. Federal Supplemental Withholding (22% / 37% split)
  //
  // The IRS requires supplemental wages (RSUs) to be withheld at 22% for
  // amounts up to $1M in a calendar year. Any supplemental wages above $1M
  // are withheld at 37%.
  //
  // Because YTD income may already include prior supplemental wages, we check
  // the cumulative YTD + this vest to determine which portion falls in each bracket.
  // -------------------------------------------------------------------------

  const cumulativeIncome = ytd + grossVestValue;

  let federalSupplementalTax: number;
  let federalRateApplied: string;

  if (ytd >= FEDERAL_SUPPLEMENTAL_THRESHOLD) {
    // Already past the $1M threshold — all taxed at 37%
    federalSupplementalTax = grossVestValue * FEDERAL_SUPPLEMENTAL_HIGH_RATE;
    federalRateApplied = '37% (YTD income already exceeds $1M)';
  } else if (cumulativeIncome <= FEDERAL_SUPPLEMENTAL_THRESHOLD) {
    // Entire vest fits within the $1M threshold — all taxed at 22%
    federalSupplementalTax = grossVestValue * FEDERAL_SUPPLEMENTAL_RATE;
    federalRateApplied = '22%';
  } else {
    // Split: part at 22% up to $1M, remainder at 37%
    const amountAtTwentyTwo = FEDERAL_SUPPLEMENTAL_THRESHOLD - ytd;
    const amountAtThirtySeven = grossVestValue - amountAtTwentyTwo;

    federalSupplementalTax =
      amountAtTwentyTwo * FEDERAL_SUPPLEMENTAL_RATE +
      amountAtThirtySeven * FEDERAL_SUPPLEMENTAL_HIGH_RATE;

    federalRateApplied = `22% on $${amountAtTwentyTwo.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} + 37% on $${amountAtThirtySeven.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  // -------------------------------------------------------------------------
  // 3. Social Security Tax (6.2% up to $184,500 wage base)
  //
  // Social Security OASDI is capped at the annual wage base. If YTD wages
  // already exceed the cap, no additional SS tax is due on this vest.
  // -------------------------------------------------------------------------

  let socialSecurityTax: number;

  if (ytd >= SS_WAGE_BASE) {
    // Already hit the cap this year
    socialSecurityTax = 0;
  } else if (cumulativeIncome <= SS_WAGE_BASE) {
    // Entire vest is below the cap
    socialSecurityTax = grossVestValue * SS_RATE;
  } else {
    // Only the portion up to the cap is taxed
    const ssTaxableWages = SS_WAGE_BASE - ytd;
    socialSecurityTax = ssTaxableWages * SS_RATE;
  }

  // -------------------------------------------------------------------------
  // 4. Medicare Tax (1.45% on ALL wages — no cap)
  // -------------------------------------------------------------------------

  const medicareTax = grossVestValue * MEDICARE_RATE;

  // -------------------------------------------------------------------------
  // 5. Additional Medicare Tax (0.9% on wages exceeding $200,000)
  //
  // Once cumulative wages exceed the $200K threshold, the excess is charged
  // an extra 0.9%. This tax is on the employee only (no employer match).
  // -------------------------------------------------------------------------

  let additionalMedicareTax: number;

  if (ytd >= ADDITIONAL_MEDICARE_THRESHOLD) {
    // Already above threshold — entire vest is subject to Additional Medicare
    additionalMedicareTax = grossVestValue * ADDITIONAL_MEDICARE_RATE;
  } else if (cumulativeIncome <= ADDITIONAL_MEDICARE_THRESHOLD) {
    // Still below threshold — no Additional Medicare Tax
    additionalMedicareTax = 0;
  } else {
    // Only the portion above the threshold is taxed
    const excessWages = cumulativeIncome - ADDITIONAL_MEDICARE_THRESHOLD;
    additionalMedicareTax = excessWages * ADDITIONAL_MEDICARE_RATE;
  }

  // -------------------------------------------------------------------------
  // 6. State Withholding
  //
  // Most states follow the IRS supplemental rate approach. We apply the
  // user-provided supplemental withholding rate (expressed as a percentage)
  // to the full gross vest value.
  // -------------------------------------------------------------------------

  const effectiveStateRate = Number.isFinite(stateTaxRate) ? clampNonNegative(stateTaxRate) : 0;
  const stateTax = grossVestValue * (effectiveStateRate / 100);

  // -------------------------------------------------------------------------
  // 7. Total Tax Liability
  // -------------------------------------------------------------------------

  const totalTaxLiability =
    federalSupplementalTax +
    socialSecurityTax +
    medicareTax +
    additionalMedicareTax +
    stateTax;

  // -------------------------------------------------------------------------
  // 8. Effective Tax Rate
  // -------------------------------------------------------------------------

  const effectiveTaxRate =
    grossVestValue > 0 ? (totalTaxLiability / grossVestValue) * 100 : 0;

  // -------------------------------------------------------------------------
  // 9. Sell-to-Cover Mechanics
  //
  // The employer sells enough whole shares (rounded UP) to cover the total
  // tax liability. Because we round up, there may be a small cash refund.
  // -------------------------------------------------------------------------

  const sellToCoverShares =
    fmvPerShare > 0
      ? Math.ceil(clampNonNegative(totalTaxLiability) / fmvPerShare)
      : 0;

  const cashGenerated = sellToCoverShares * fmvPerShare;

  const netSharesDelivered = sharesVesting - sellToCoverShares;

  const cashRefund = cashGenerated - totalTaxLiability;

  // -------------------------------------------------------------------------
  // Return Result
  // -------------------------------------------------------------------------

  return {
    grossVestValue,
    federalSupplementalTax,
    federalRateApplied,
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    stateTax,
    totalTaxLiability,
    effectiveTaxRate,
    sellToCoverShares,
    netSharesDelivered,
    cashRefund,
  };
}
