/**
 * Core-Satellite Portfolio Rebalancer — Calculation Engine
 *
 * Computes optimal buy/sell orders with cash-first tax-aware optimization.
 */

export interface Holding {
  ticker: string;
  classification: 'core' | 'satellite';
  quantity: number;
  costBasis: number;
  currentPrice: number;
  targetWeight: number;
}

export interface RebalancingInput {
  holdings: Holding[];
  cashInflow: number;
  taxRate: number;
  transactionFee: number;
  thresholdBand: number;
}

export interface HoldingResult {
  ticker: string;
  classification: 'core' | 'satellite';
  currentWeight: number;
  targetWeight: number;
  deviation: number;
  deviationPercent: number;
  recommendedAction: 'buy' | 'sell' | 'hold';
  recommendedAmount: number;
  recommendedShares: number;
  estimatedTax: number;
  isEconomicallyViable: boolean;
}

export interface RebalancingResult {
  holdings: HoldingResult[];
  postCashPortfolioValue: number;
  netBuyOrders: number;
  netSellOrders: number;
  totalEstimatedTax: number;
  weightsNormalized: boolean;
  totalWeightError: number;
}

/**
 * Format a number as USD currency with commas and 2 decimal places.
 */
export function formatCurrency(amount: number): string {
  try {
    // Handle very large or small numbers gracefully
    if (!isFinite(amount) || isNaN(amount)) return '$0.00';
    return (
      '$' +
      Math.abs(amount)
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    );
  } catch {
    return '$0.00';
  }
}

/**
 * Calculate the rebalancing plan for a Core-Satellite portfolio.
 *
 * Strategy:
 * 1. Compute each holding's current market value and portfolio weight.
 * 2. Normalize target weights so they sum to 100%.
 * 3. Determine deviation from target for each holding.
 * 4. Apply cash-first optimization — use available cash to buy underweight positions.
 * 5. For remaining deviations beyond the threshold band, recommend sells for overweight
 *    positions and buys for underweight positions (funded by those sells).
 * 6. Estimate capital gains tax for each sell trade.
 * 7. Flag trades that are not economically viable (cost > benefit).
 */
export function calculateRebalancing(input: RebalancingInput): RebalancingResult {
  const { holdings, cashInflow, taxRate, transactionFee, thresholdBand } = input;

  // ── Step 1: Compute market values and total portfolio value ────────────────
  const holdingValues = holdings.map((h) => ({
    ...h,
    marketValue: h.quantity * h.currentPrice,
  }));

  const totalMarketValue = holdingValues.reduce((sum, h) => sum + h.marketValue, 0);
  const postCashPortfolioValue = totalMarketValue + cashInflow;

  // ── Step 2: Normalize target weights ───────────────────────────────────────
  const rawTargetSum = holdingValues.reduce((sum, h) => sum + h.targetWeight, 0);
  const weightsNormalized = Math.abs(rawTargetSum - 100) > 0.01;
  const totalWeightError = weightsNormalized ? 100 - rawTargetSum : 0;

  const normalizedTargets = holdingValues.map((h) => ({
    ...h,
    normalizedTarget: weightsNormalized ? (h.targetWeight / rawTargetSum) * 100 : h.targetWeight,
  }));

  // ── Step 3: Compute current weights and deviations ─────────────────────────
  const withDeviations = normalizedTargets.map((h) => {
    const currentWeight = totalMarketValue > 0 ? (h.marketValue / totalMarketValue) * 100 : 0;
    const deviation = currentWeight - h.normalizedTarget;
    // deviationPercent = deviation relative to target (as percentage of target)
    const deviationPercent = h.normalizedTarget > 0 ? (deviation / h.normalizedTarget) * 100 : deviation * 100;
    return { ...h, currentWeight, deviation, deviationPercent };
  });

  // ── Step 4: Cash-first optimization ────────────────────────────────────────
  // Identify underweight positions (deviation < 0) beyond the threshold
  const cashFirstCandidates = withDeviations
    .filter((h) => h.deviation < -thresholdBand)
    .sort((a, b) => a.deviation - b.deviation); // most underweight first

  let remainingCash = cashInflow;
  const cashApplied = new Map<string, number>(); // ticker -> cash applied

  for (const h of cashFirstCandidates) {
    if (remainingCash <= 0) break;
    // Dollar amount needed to bring this position to target
    const deficitAmount = ((h.normalizedTarget - h.currentWeight) / 100) * postCashPortfolioValue;
    const cashToApply = Math.min(deficitAmount, remainingCash);
    if (cashToApply > 0) {
      cashApplied.set(h.ticker, cashToApply);
      remainingCash -= cashToApply;
    }
  }

  // ── Step 5: Determine actions for each holding ─────────────────────────────
  const holdingsResult: HoldingResult[] = withDeviations.map((h) => {
    const cashForThis = cashApplied.get(h.ticker) || 0;

    // If cash was applied, we recompute the effective deviation after cash
    const effectiveDeviation =
      cashForThis > 0
        ? ((h.marketValue + cashForThis - (h.normalizedTarget / 100) * postCashPortfolioValue) /
            ((h.normalizedTarget / 100) * postCashPortfolioValue)) *
          100
        : h.deviationPercent;

    const isOver = h.deviation > thresholdBand;
    const isUnder = h.deviation < -thresholdBand;
    // After cash-first, check if still outside band
    const stillOver = isOver;
    const stillUnder = isUnder && cashForThis <= 0;

    let recommendedAction: 'buy' | 'sell' | 'hold' = 'hold';
    let recommendedAmount = 0;
    let recommendedShares = 0;
    let estimatedTax = 0;
    let isEconomicallyViable = true;

    if (stillOver) {
      // Sell: bring down to target
      recommendedAction = 'sell';
      const targetValue = (h.normalizedTarget / 100) * postCashPortfolioValue;
      const currentValueAfterCash = h.marketValue;
      recommendedAmount = Math.max(0, currentValueAfterCash - targetValue);
      recommendedShares = h.currentPrice > 0 ? recommendedAmount / h.currentPrice : 0;

      // Cap shares to quantity owned
      recommendedShares = Math.min(recommendedShares, h.quantity);
      recommendedAmount = recommendedShares * h.currentPrice;

      // Estimate capital gains tax
      const gainPerShare = h.currentPrice - h.costBasis;
      if (gainPerShare > 0) {
        estimatedTax = gainPerShare * recommendedShares * (taxRate / 100);
      }

      // Check economic viability: tax + fees should not exceed the benefit
      const totalCost = estimatedTax + transactionFee;
      isEconomicallyViable = totalCost < recommendedAmount * 0.1; // cost < 10% of trade
    } else if (stillUnder) {
      // Buy: bring up to target (only if no cash-first addressed this)
      recommendedAction = 'buy';
      const targetValue = (h.normalizedTarget / 100) * postCashPortfolioValue;
      const currentValueAfterCash = h.marketValue;
      recommendedAmount = Math.max(0, targetValue - currentValueAfterCash);
      recommendedShares = h.currentPrice > 0 ? recommendedAmount / h.currentPrice : 0;
      estimatedTax = 0; // buying has no capital gains tax
      isEconomicallyViable = transactionFee < recommendedAmount * 0.05; // fee < 5% of trade
    }

    // Use deviationPercent for display (the original deviation, before cash)
    return {
      ticker: h.ticker,
      classification: h.classification,
      currentWeight: h.currentWeight / 100,
      targetWeight: h.normalizedTarget / 100,
      deviation: h.deviation,
      deviationPercent: h.deviationPercent,
      recommendedAction,
      recommendedAmount,
      recommendedShares,
      estimatedTax,
      isEconomicallyViable,
    };
  });

  // ── Aggregate totals ────────────────────────────────────────────────────────
  let netBuyOrders = 0;
  let netSellOrders = 0;
  let totalEstimatedTax = 0;

  for (const r of holdingsResult) {
    if (r.recommendedAction === 'buy') netBuyOrders++;
    if (r.recommendedAction === 'sell') netSellOrders++;
    totalEstimatedTax += r.estimatedTax;
  }

  return {
    holdings: holdingsResult,
    postCashPortfolioValue,
    netBuyOrders,
    netSellOrders,
    totalEstimatedTax,
    weightsNormalized,
    totalWeightError,
  };
}
