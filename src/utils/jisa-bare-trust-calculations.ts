export interface JisaBareTrustInput {
  initialInvestment: number;
  monthlyContribution: number;
  annualGrowthRate: number;
  dividendYield: number;
  funder: 'parent' | 'grandparent';
  parentTaxBracket: 'basic' | 'higher' | 'additional';
  yearsToGrow: number;
}

export interface YearData {
  year: number;
  jisaBalance: number;
  bareTrustBalance: number;
  jisaContribution: number;
  bareTrustContribution: number;
  dividendIncome: number;
  dividendTax: number;
  totalTaxLost: number;
}

export interface JisaBareTrustResult {
  finalJisaValue: number;
  finalBareTrustValue: number;
  totalTaxLost: number;
  exceedsJisaLimit: boolean;
  yearData: YearData[];
}

const JISA_LIMIT = 9000;

const DIVIDEND_TAX_RATES: Record<string, number> = {
  basic: 0.0875,
  higher: 0.3375,
  additional: 0.3935,
};

export function calculateJisaVsBareTrust(input: JisaBareTrustInput): JisaBareTrustResult {
  const {
    initialInvestment,
    monthlyContribution,
    annualGrowthRate,
    dividendYield,
    funder,
    parentTaxBracket,
    yearsToGrow,
  } = input;

  const totalRate = (annualGrowthRate + dividendYield) / 100;
  const dividendRate = dividendYield / 100;
  const taxRate = DIVIDEND_TAX_RATES[parentTaxBracket] ?? 0.3375;

  let exceedsJisaLimit = false;
  const yearData: YearData[] = [];

  let jisaBalance = 0;
  let bareTrustBalance = 0;
  let cumulativeTaxLost = 0;

  for (let year = 1; year <= yearsToGrow; year++) {
    // JISA: cap contributions at JISA limit
    const jisaAnnualContribution =
      year === 1
        ? Math.min(JISA_LIMIT, initialInvestment + monthlyContribution * 12)
        : Math.min(JISA_LIMIT, monthlyContribution * 12);

    const totalAttempted =
      year === 1
        ? initialInvestment + monthlyContribution * 12
        : monthlyContribution * 12;

    if (totalAttempted > JISA_LIMIT) {
      exceedsJisaLimit = true;
    }

    // JISA: apply total rate to opening balance, then add capped contribution
    jisaBalance = (jisaBalance + jisaAnnualContribution) * (1 + totalRate);

    // Bare Trust: full contribution, no limit
    const bareTrustContribution =
      year === 1 ? initialInvestment + monthlyContribution * 12 : monthlyContribution * 12;

    // Dividend income on opening balance
    const dividendIncome = bareTrustBalance * dividendRate;

    // Parent settlement rule: if parent funds and dividend > 100, entire dividend taxed
    let dividendTax = 0;
    if (funder === 'parent' && dividendIncome > 100) {
      dividendTax = dividendIncome * taxRate;
    }

    cumulativeTaxLost += dividendTax;

    // Bare Trust: opening balance grows, then add contribution + net dividends
    bareTrustBalance =
      (bareTrustBalance + bareTrustContribution + dividendIncome - dividendTax) *
      (1 + annualGrowthRate / 100);

    yearData.push({
      year,
      jisaBalance: Math.round(jisaBalance * 100) / 100,
      bareTrustBalance: Math.round(bareTrustBalance * 100) / 100,
      jisaContribution: jisaAnnualContribution,
      bareTrustContribution: bareTrustContribution + dividendIncome - dividendTax,
      dividendIncome: Math.round(dividendIncome * 100) / 100,
      dividendTax: Math.round(dividendTax * 100) / 100,
      totalTaxLost: Math.round(cumulativeTaxLost * 100) / 100,
    });
  }

  return {
    finalJisaValue: Math.round(jisaBalance * 100) / 100,
    finalBareTrustValue: Math.round(bareTrustBalance * 100) / 100,
    totalTaxLost: Math.round(cumulativeTaxLost * 100) / 100,
    exceedsJisaLimit,
    yearData,
  };
}
