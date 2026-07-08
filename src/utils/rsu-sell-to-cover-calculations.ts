export interface RsuInput {
  sharesVesting: number;        // Gross number of RSU shares vesting
  sharePrice: number;           // FMV on vest date ($)
  federalRate: number;          // 22 or 37 (percent)
  stateRate: number;            // State withholding rate (percent, e.g. 5)
  hitSSCap: boolean;            // true = already hit SS wage cap, false = need to pay 6.2%
}

export interface RsuResult {
  grossIncome: number;          // sharesVesting * sharePrice
  federalTax: number;           // grossIncome * federalRate/100
  stateTax: number;             // grossIncome * stateRate/100
  socialSecurityTax: number;    // grossIncome * 6.2/100 or 0
  medicareTax: number;          // grossIncome * 1.45/100
  totalWithholding: number;     // Sum of all taxes
  totalTaxRate: number;         // totalWithholding / grossIncome * 100
  sharesSoldToCover: number;    // Math.ceil(totalWithholding / sharePrice)
  cashGeneratedBySale: number;  // sharesSoldToCover * sharePrice
  excessCashRefund: number;     // cashGeneratedBySale - totalWithholding
  netSharesDelivered: number;   // sharesVesting - sharesSoldToCover
  netSharesValue: number;       // netSharesDelivered * sharePrice
}

export function calculateRsuSellToCover(input: RsuInput): RsuResult {
  // Step 1: Gross Income
  const grossIncome = input.sharesVesting * input.sharePrice;

  // Step 2: Tax calculations
  const federalTax = grossIncome * (input.federalRate / 100);
  const stateTax = grossIncome * (input.stateRate / 100);
  const socialSecurityTax = input.hitSSCap ? 0 : grossIncome * 0.062;
  const medicareTax = grossIncome * 0.0145;
  const totalWithholding = federalTax + stateTax + socialSecurityTax + medicareTax;
  const totalTaxRate = grossIncome > 0 ? (totalWithholding / grossIncome) * 100 : 0;

  // Step 3: Sell-to-cover mechanics (round UP to nearest whole share)
  const sharesSoldToCover = Math.ceil(totalWithholding / input.sharePrice);
  const cashGeneratedBySale = sharesSoldToCover * input.sharePrice;
  const excessCashRefund = cashGeneratedBySale - totalWithholding;

  // Step 4: Net shares
  const netSharesDelivered = input.sharesVesting - sharesSoldToCover;
  const netSharesValue = netSharesDelivered * input.sharePrice;

  return {
    grossIncome,
    federalTax,
    stateTax,
    socialSecurityTax,
    medicareTax,
    totalWithholding,
    totalTaxRate,
    sharesSoldToCover,
    cashGeneratedBySale,
    excessCashRefund,
    netSharesDelivered,
    netSharesValue,
  };
}
