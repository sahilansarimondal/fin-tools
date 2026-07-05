/**
 * House Hacking Cash Flow Calculator — Calculation Engine
 *
 * Calculates PITI (Principal, Interest, Taxes, Insurance) + PMI,
 * subtracts net rental income to determine net monthly living cost.
 */

export interface HouseHackingInput {
  purchasePrice: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  propertyTaxPercent: number;
  annualInsurance: number;
  monthlyRent: number;
  maintenancePercent: number;
  vacancyPercent: number;
}

export interface HouseHackingResult {
  principal: number;
  monthlyPI: number;
  monthlyPMI: number;
  monthlyTaxes: number;
  monthlyInsurance: number;
  grossMonthlyMortgage: number;
  monthlyVacancyLoss: number;
  monthlyMaintenance: number;
  totalOperatingExpenses: number;
  netRentalIncome: number;
  netMonthlyCost: number;
  isCashFlowPositive: boolean;
}

/**
 * Calculate house hacking cash flow using standard US mortgage math.
 */
export function calculateHouseHacking(input: HouseHackingInput): HouseHackingResult {
  const {
    purchasePrice,
    downPaymentPercent,
    interestRate,
    loanTermYears,
    propertyTaxPercent,
    annualInsurance,
    monthlyRent,
    maintenancePercent,
    vacancyPercent,
  } = input;

  // 1. Principal = Purchase Price - Down Payment
  const downPaymentAmount = purchasePrice * (downPaymentPercent / 100);
  const principal = purchasePrice - downPaymentAmount;

  // 2. Monthly P&I using standard amortization formula:
  //    M = P [ i(1 + i)^n ] / [ (1 + i)^n - 1 ]
  const monthlyRate = interestRate / 100 / 12;
  const totalMonths = loanTermYears * 12;

  let monthlyPI: number;
  if (interestRate === 0 || monthlyRate === 0) {
    // Edge case: 0% interest — simple division
    monthlyPI = principal / totalMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    monthlyPI = principal * (monthlyRate * factor) / (factor - 1);
  }

  // 3. PMI: Required if down payment < 20%
  //    Standard rate: 0.5% of loan amount per year
  const monthlyPMI = downPaymentPercent < 20 ? (principal * 0.005) / 12 : 0;

  // 4. Monthly Property Taxes
  const monthlyTaxes = (purchasePrice * (propertyTaxPercent / 100)) / 12;

  // 5. Monthly Insurance
  const monthlyInsurance = annualInsurance / 12;

  // 6. Gross Monthly Mortgage (PITI + PMI)
  const grossMonthlyMortgage = monthlyPI + monthlyTaxes + monthlyInsurance + monthlyPMI;

  // 7. Operating Expenses
  const monthlyVacancyLoss = monthlyRent * (vacancyPercent / 100);
  const monthlyMaintenance = monthlyRent * (maintenancePercent / 100);
  const totalOperatingExpenses = monthlyVacancyLoss + monthlyMaintenance;

  // 8. Net Rental Income = Gross Rent - Operating Expenses
  const netRentalIncome = monthlyRent - totalOperatingExpenses;

  // 9. Net Monthly Cost = Net Rental Income - Gross Mortgage
  const netMonthlyCost = netRentalIncome - grossMonthlyMortgage;

  return {
    principal,
    monthlyPI,
    monthlyPMI,
    monthlyTaxes,
    monthlyInsurance,
    grossMonthlyMortgage,
    monthlyVacancyLoss,
    monthlyMaintenance,
    totalOperatingExpenses,
    netRentalIncome,
    netMonthlyCost,
    isCashFlowPositive: netMonthlyCost >= 0,
  };
}
