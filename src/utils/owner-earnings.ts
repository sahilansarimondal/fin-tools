export type MaintenanceCapExMethod = 'basic' | 'greenwald';

export type GreenwaldInput = {
  // 5 years of data (oldest to newest)
  ppe: number[]; // Property, Plant & Equipment
  revenue: number[]; // Revenue/Sales
  currentYearCapEx: number; // Total CapEx for current year
};

export type OwnerEarningsInput = {
  // Company identification
  ticker: string;
  companyName: string;
  
  // Market data
  currentStockPrice: number;
  sharesOutstanding: number;
  
  // Income statement items
  netIncome: number;
  depreciationAmortization: number;
  nonCashCharges: number;
  
  // Balance sheet / cash flow items
  changeInWorkingCapital: number; // Can be negative
  totalCapEx: number; // Total Capital Expenditures
  
  // Valuation inputs
  cashAndEquivalents: number;
  totalDebt: number;
  discountRate: number; // Percentage, default 10%
  
  // Method selection
  maintenanceCapExMethod: MaintenanceCapExMethod;
  maintenanceCapExDirect?: number; // For basic mode
  greenwaldInput?: GreenwaldInput; // For Greenwald method
};

export type OwnerEarningsResult = {
  // Core owner earnings calculation
  netIncome: number;
  depreciationAmortization: number;
  nonCashCharges: number;
  maintenanceCapEx: number;
  changeInWorkingCapital: number;
  ownerEarnings: number;
  
  // Greenwald method details (if applicable)
  greenwaldDetails?: {
    averagePpeToSalesRatio: number;
    salesGrowth: number;
    growthCapEx: number;
    maintenanceCapEx: number;
    usedTotalCapExAsFallback: boolean;
  };
  
  // Valuation
  intrinsicValue: number; // Owner Earnings / Discount Rate
  intrinsicValuePerShare: number; // (Intrinsic Value + Cash - Debt) / Shares Outstanding
  marginOfSafety: number; // Percentage vs current stock price
  isUndervalued: boolean;
  
  // Comparison
  reportedNetIncome: number;
  ownerEarningsVsNetIncome: number; // Difference
  ownerEarningsVsNetIncomePercent: number; // Percentage difference
};

export function calculateOwnerEarnings(input: OwnerEarningsInput): OwnerEarningsResult {
  const {
    netIncome,
    depreciationAmortization,
    nonCashCharges,
    changeInWorkingCapital,
    totalCapEx,
    cashAndEquivalents,
    totalDebt,
    discountRate,
    sharesOutstanding,
    currentStockPrice,
    maintenanceCapExMethod,
    maintenanceCapExDirect,
    greenwaldInput,
  } = input;

  // Calculate Maintenance CapEx based on selected method
  let maintenanceCapEx: number;
  let greenwaldDetails: OwnerEarningsResult['greenwaldDetails'] | undefined;

  if (maintenanceCapExMethod === 'greenwald' && greenwaldInput) {
    const { ppe, revenue, currentYearCapEx } = greenwaldInput;
    
    // Validate we have 5 years of data
    if (ppe.length === 5 && revenue.length === 5) {
      // Calculate Average PP&E-to-Sales Ratio
      const sumPpe = ppe.reduce((sum, val) => sum + val, 0);
      const sumRevenue = revenue.reduce((sum, val) => sum + val, 0);
      const averagePpeToSalesRatio = sumRevenue > 0 ? sumPpe / sumRevenue : 0;
      
      // Calculate Current Year Sales Growth
      // Current year = index 4 (newest), Prior year = index 3
      const currentYearRevenue = revenue[4];
      const priorYearRevenue = revenue[3];
      const salesGrowth = currentYearRevenue - priorYearRevenue;
      
      // Calculate Growth CapEx
      // If sales growth is negative, cap Growth CapEx at 0 (don't subtract negative growth capex)
      const growthCapEx = salesGrowth > 0 ? averagePpeToSalesRatio * salesGrowth : 0;
      
      // Maintenance CapEx = Total CapEx - Growth CapEx
      let calculatedMaintenanceCapEx = currentYearCapEx - growthCapEx;
      
      // Edge case handling: if Growth CapEx > Total CapEx or negative maintenance capex,
      // default to Total CapEx (conservative) or Depreciation (if available)
      let usedTotalCapExAsFallback = false;
      if (calculatedMaintenanceCapEx <= 0 || growthCapEx > currentYearCapEx) {
        calculatedMaintenanceCapEx = currentYearCapEx; // Conservative fallback
        usedTotalCapExAsFallback = true;
      }
      
      maintenanceCapEx = calculatedMaintenanceCapEx;
      
      greenwaldDetails = {
        averagePpeToSalesRatio,
        salesGrowth,
        growthCapEx,
        maintenanceCapEx: calculatedMaintenanceCapEx,
        usedTotalCapExAsFallback,
      };
    } else {
      // Fallback to total CapEx if data incomplete
      maintenanceCapEx = totalCapEx;
      greenwaldDetails = {
        averagePpeToSalesRatio: 0,
        salesGrowth: 0,
        growthCapEx: 0,
        maintenanceCapEx: totalCapEx,
        usedTotalCapExAsFallback: true,
      };
    }
  } else {
    // Basic mode: use direct input or default to total CapEx
    maintenanceCapEx = maintenanceCapExDirect ?? totalCapEx;
  }

  // Core Owner Earnings Formula:
  // Owner Earnings = Net Income + D&A + Non-Cash Charges - Maintenance CapEx +/- Change in Working Capital
  const ownerEarnings = 
    netIncome + 
    depreciationAmortization + 
    nonCashCharges - 
    maintenanceCapEx + 
    changeInWorkingCapital; // Note: changeInWorkingCapital can be negative

  // Valuation: Ten-Cap Pricing (Buffett's rule of thumb: 10% discount rate)
  const discountRateDecimal = discountRate / 100;
  const intrinsicValue = discountRateDecimal > 0 ? ownerEarnings / discountRateDecimal : 0;
  
  // Per Share Value = (Intrinsic Value + Cash & Equivalents - Total Debt) / Shares Outstanding
  const intrinsicValuePerShare = sharesOutstanding > 0 
    ? (intrinsicValue + cashAndEquivalents - totalDebt) / sharesOutstanding 
    : 0;

  // Margin of Safety = (Intrinsic Value Per Share - Current Price) / Current Price * 100
  const marginOfSafety = currentStockPrice > 0
    ? ((intrinsicValuePerShare - currentStockPrice) / currentStockPrice) * 100
    : 0;

  const isUndervalued = marginOfSafety > 0;

  // Comparison with reported GAAP Net Income
  const ownerEarningsVsNetIncome = ownerEarnings - netIncome;
  const ownerEarningsVsNetIncomePercent = netIncome !== 0 
    ? (ownerEarningsVsNetIncome / Math.abs(netIncome)) * 100 
    : 0;

  return {
    netIncome,
    depreciationAmortization,
    nonCashCharges,
    maintenanceCapEx,
    changeInWorkingCapital,
    ownerEarnings,
    greenwaldDetails,
    intrinsicValue,
    intrinsicValuePerShare,
    marginOfSafety,
    isUndervalued,
    reportedNetIncome: netIncome,
    ownerEarningsVsNetIncome,
    ownerEarningsVsNetIncomePercent,
  };
}

// Helper to validate Greenwald inputs
export function validateGreenwaldInput(input: GreenwaldInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (input.ppe.length !== 5) {
    errors.push('PP&E requires exactly 5 years of data');
  }
  if (input.revenue.length !== 5) {
    errors.push('Revenue requires exactly 5 years of data');
  }
  if (input.ppe.some(v => v < 0)) {
    errors.push('PP&E values cannot be negative');
  }
  if (input.revenue.some(v => v < 0)) {
    errors.push('Revenue values cannot be negative');
  }
  if (input.currentYearCapEx < 0) {
    errors.push('Current year CapEx cannot be negative');
  }
  // Check for zero revenue which would cause division by zero
  if (input.revenue.some(v => v === 0)) {
    errors.push('Revenue values cannot be zero (would cause division by zero)');
  }
  
  return { valid: errors.length === 0, errors };
}

// Helper to format year labels for the Greenwald table
export function getYearLabels(currentYear: number = new Date().getFullYear()): string[] {
  return Array.from({ length: 5 }, (_, i) => String(currentYear - 4 + i));
}