export interface LisaVsPensionInputs {
  grossContribution: number;  // £100–£4,000, default £1,000
  taxBand: 'basic' | 'higher' | 'additional';
  salarySacrifice: boolean;
  employerMatch: 'none' | '50' | '100';
  horizonYears: number;       // 5–40, default 25
  growthRate: number;         // 1.0–12.0%, default 7.0
  retirementTaxRate: number;  // 0, 0.20, or 0.40
}

export interface LisaVsPensionResults {
  // LISA pathway
  netLisaContribution: number;
  effectiveLisaPrincipal: number;
  lisaEndingBalance: number;
  netTakeHomeLisa: number;

  // Pension pathway
  pensionStartingPrincipal: number;
  pensionEndingBalance: number;
  taxFreeLumpSum: number;
  taxablePortion: number;
  retirementTaxDue: number;
  netTakeHomePensionBeforeNI: number;
  compoundedNiSavings: number;
  netTakeHomePension: number;

  // Comparison
  winner: 'lisa' | 'pension';
  advantageAmount: number;
  pensionMultiplier: number;
  lisaMultiplier: number;

  // Year-by-year data for chart
  yearByYear: Array<{
    year: number;
    lisaBalance: number;
    pensionBalance: number;
  }>;
}

const TAX_RATES: Record<string, { incomeTax: number; ni: number }> = {
  basic: { incomeTax: 0.20, ni: 0.08 },
  higher: { incomeTax: 0.40, ni: 0.02 },
  additional: { incomeTax: 0.45, ni: 0.02 },
};

const EMPLOYER_MATCH_FACTORS: Record<string, number> = {
  none: 1.0,
  '50': 1.5,
  '100': 2.0,
};

export function calculateLisaVsPension(inputs: LisaVsPensionInputs): LisaVsPensionResults {
  const { grossContribution, taxBand, salarySacrifice, employerMatch, horizonYears, growthRate, retirementTaxRate } = inputs;

  const tc = TAX_RATES[taxBand].incomeTax;
  const nic = TAX_RATES[taxBand].ni;
  const matchFactor = EMPLOYER_MATCH_FACTORS[employerMatch];
  const g = growthRate / 100;

  // ──── Path A: LISA ────
  const netLisaContribution = grossContribution * (1 - tc - nic);
  const effectiveLisaPrincipal = netLisaContribution * 1.25;
  const lisaEndingBalance = effectiveLisaPrincipal * Math.pow(1 + g, horizonYears);
  const netTakeHomeLisa = lisaEndingBalance; // tax-free after age 60

  // ──── Path B: Pension ────
  const pensionStartingPrincipal = grossContribution * matchFactor;
  const pensionEndingBalance = pensionStartingPrincipal * Math.pow(1 + g, horizonYears);
  const taxFreeLumpSum = 0.25 * pensionEndingBalance;
  const taxablePortion = 0.75 * pensionEndingBalance;
  const retirementTaxDue = taxablePortion * retirementTaxRate;
  const netTakeHomePensionBeforeNI = taxFreeLumpSum + (taxablePortion - retirementTaxDue);

  // NI savings from salary sacrifice
  let compoundedNiSavings = 0;
  if (salarySacrifice) {
    compoundedNiSavings = (grossContribution * nic) * Math.pow(1 + g, horizonYears);
  }

  const netTakeHomePension = netTakeHomePensionBeforeNI + compoundedNiSavings;

  // ──── Comparison ────
  let winner: 'lisa' | 'pension';
  let advantageAmount: number;

  if (netTakeHomeLisa >= netTakeHomePension) {
    winner = 'lisa';
    advantageAmount = netTakeHomeLisa - netTakeHomePension;
  } else {
    winner = 'pension';
    advantageAmount = netTakeHomePension - netTakeHomeLisa;
  }

  const lisaMultiplier = netTakeHomeLisa / grossContribution;
  const pensionMultiplier = netTakeHomePension / grossContribution;

  // ──── Year-by-year data ────
  const yearByYear: Array<{ year: number; lisaBalance: number; pensionBalance: number }> = [];
  for (let y = 1; y <= horizonYears; y++) {
    yearByYear.push({
      year: y,
      lisaBalance: effectiveLisaPrincipal * Math.pow(1 + g, y),
      pensionBalance: pensionStartingPrincipal * Math.pow(1 + g, y),
    });
  }

  return {
    netLisaContribution: round2(netLisaContribution),
    effectiveLisaPrincipal: round2(effectiveLisaPrincipal),
    lisaEndingBalance: round2(lisaEndingBalance),
    netTakeHomeLisa: round2(netTakeHomeLisa),

    pensionStartingPrincipal: round2(pensionStartingPrincipal),
    pensionEndingBalance: round2(pensionEndingBalance),
    taxFreeLumpSum: round2(taxFreeLumpSum),
    taxablePortion: round2(taxablePortion),
    retirementTaxDue: round2(retirementTaxDue),
    netTakeHomePensionBeforeNI: round2(netTakeHomePensionBeforeNI),
    compoundedNiSavings: round2(compoundedNiSavings),
    netTakeHomePension: round2(netTakeHomePension),

    winner,
    advantageAmount: round2(advantageAmount),
    lisaMultiplier: round2(lisaMultiplier),
    pensionMultiplier: round2(pensionMultiplier),

    yearByYear,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
