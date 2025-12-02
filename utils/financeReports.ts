import { Payment, Expense } from '@/types';
import { 
  DEFAULT_CHART_OF_ACCOUNTS, 
  mapExpenseCategoryToAccount
} from '@/constants/chartOfAccounts';

export interface TransactionSummary {
  accountCode: string;
  accountName: string;
  amount: number;
  count: number;
}

export interface IncomeStatement {
  period: { start: string; end: string };
  revenue: {
    rentalIncome: number;
    lateFees: number;
    otherIncome: number;
    totalRevenue: number;
  };
  expenses: {
    maintenance: number;
    utilities: number;
    insurance: number;
    taxes: number;
    management: number;
    other: number;
    totalExpenses: number;
  };
  netIncome: number;
  profitMargin: number;
}

export interface BalanceSheet {
  asOfDate: string;
  assets: {
    currentAssets: {
      cash: number;
      accountsReceivable: number;
      securityDeposits: number;
      total: number;
    };
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: {
      accountsPayable: number;
      securityDepositsPayable: number;
      prepaidRent: number;
      total: number;
    };
    totalLiabilities: number;
  };
  equity: {
    ownersEquity: number;
    retainedEarnings: number;
    totalEquity: number;
  };
}

export interface CashFlowStatement {
  period: { start: string; end: string };
  operatingActivities: {
    netIncome: number;
    adjustments: {
      accountsReceivable: number;
      accountsPayable: number;
    };
    netCashFromOperations: number;
  };
  investingActivities: {
    propertyPurchases: number;
    equipmentPurchases: number;
    netCashFromInvesting: number;
  };
  financingActivities: {
    loanProceeds: number;
    loanRepayments: number;
    netCashFromFinancing: number;
  };
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

export interface PropertyPerformance {
  propertyId: string;
  propertyName: string;
  totalRevenue: number;
  totalExpenses: number;
  netOperatingIncome: number;
  occupancyRate: number;
  averageRentPerUnit: number;
}

export function generateIncomeStatement(
  payments: Payment[],
  expenses: Expense[],
  startDate: string,
  endDate: string
): IncomeStatement {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const periodPayments = payments.filter(p => {
    const date = new Date(p.payment_date);
    return p.status === 'paid' && date >= start && date <= end;
  });

  const periodExpenses = expenses.filter(e => {
    const date = new Date(e.expense_date);
    return date >= start && date <= end;
  });

  const rentalIncome = periodPayments.reduce((sum, p) => sum + p.amount, 0);
  const lateFees = periodPayments.reduce((sum, p) => sum + (p.late_fee || 0), 0);
  const otherIncome = 0;
  const totalRevenue = rentalIncome + lateFees + otherIncome;

  const expensesByCategory = periodExpenses.reduce((acc, e) => {
    const category = e.category;
    acc[category] = (acc[category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const maintenance = (expensesByCategory['maintenance'] || 0) + (expensesByCategory['repairs'] || 0);
  const utilities = expensesByCategory['utilities'] || 0;
  const insurance = expensesByCategory['insurance'] || 0;
  const taxes = expensesByCategory['taxes'] || 0;
  const management = 0;
  const other = Object.entries(expensesByCategory)
    .filter(([key]) => !['maintenance', 'repairs', 'utilities', 'insurance', 'taxes'].includes(key))
    .reduce((sum, [, val]) => sum + val, 0);

  const totalExpenses = maintenance + utilities + insurance + taxes + management + other;
  const netIncome = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  return {
    period: { start: startDate, end: endDate },
    revenue: {
      rentalIncome,
      lateFees,
      otherIncome,
      totalRevenue,
    },
    expenses: {
      maintenance,
      utilities,
      insurance,
      taxes,
      management,
      other,
      totalExpenses,
    },
    netIncome,
    profitMargin,
  };
}

export function generateBalanceSheet(
  payments: Payment[],
  expenses: Expense[],
  leases: any[],
  asOfDate: string
): BalanceSheet {
  const cutoffDate = new Date(asOfDate);

  const overduePayments = payments.filter(p => {
    const dueDate = new Date(p.due_date);
    return p.status === 'overdue' && dueDate <= cutoffDate;
  });

  const accountsReceivable = overduePayments.reduce((sum, p) => sum + p.amount + (p.late_fee || 0), 0);

  const activeLeases = leases.filter(l => {
    const leaseStart = new Date(l.start_date);
    return l.status === 'active' && leaseStart <= cutoffDate;
  });

  const securityDeposits = activeLeases.reduce((sum, l) => sum + (l.deposit_amount || 0), 0);

  const unpaidExpenses = expenses.filter(e => {
    const date = new Date(e.expense_date);
    return e.status === 'pending' && date <= cutoffDate;
  });

  const accountsPayable = unpaidExpenses.reduce((sum, e) => sum + e.amount, 0);

  const prepaidPayments = payments.filter(p => {
    const paymentDate = new Date(p.payment_date);
    const dueDate = new Date(p.due_date);
    return p.status === 'paid' && paymentDate < dueDate && dueDate > cutoffDate;
  });

  const prepaidRent = prepaidPayments.reduce((sum, p) => sum + p.amount, 0);

  const currentAssets = {
    cash: 0,
    accountsReceivable,
    securityDeposits,
    total: 0 + accountsReceivable + securityDeposits,
  };

  const currentLiabilities = {
    accountsPayable,
    securityDepositsPayable: securityDeposits,
    prepaidRent,
    total: accountsPayable + securityDeposits + prepaidRent,
  };

  const totalAssets = currentAssets.total;
  const totalLiabilities = currentLiabilities.total;

  const allPayments = payments.filter(p => {
    const date = new Date(p.payment_date);
    return p.status === 'paid' && date <= cutoffDate;
  });
  const allExpenses = expenses.filter(e => {
    const date = new Date(e.expense_date);
    return date <= cutoffDate;
  });

  const totalIncome = allPayments.reduce((sum, p) => sum + p.amount + (p.late_fee || 0), 0);
  const totalCosts = allExpenses.reduce((sum, e) => sum + e.amount, 0);
  const retainedEarnings = totalIncome - totalCosts;

  const ownersEquity = 0;
  const totalEquity = ownersEquity + retainedEarnings;

  return {
    asOfDate,
    assets: {
      currentAssets,
      totalAssets,
    },
    liabilities: {
      currentLiabilities,
      totalLiabilities,
    },
    equity: {
      ownersEquity,
      retainedEarnings,
      totalEquity,
    },
  };
}

export function generateCashFlowStatement(
  payments: Payment[],
  expenses: Expense[],
  startDate: string,
  endDate: string
): CashFlowStatement {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const incomeStatement = generateIncomeStatement(payments, expenses, startDate, endDate);

  const operatingCashIn = payments
    .filter(p => {
      const date = new Date(p.payment_date);
      return p.status === 'paid' && date >= start && date <= end;
    })
    .reduce((sum, p) => sum + p.amount + (p.late_fee || 0), 0);

  const operatingCashOut = expenses
    .filter(e => {
      const date = new Date(e.expense_date);
      return e.status === 'paid' && date >= start && date <= end;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const netCashFromOperations = operatingCashIn - operatingCashOut;

  return {
    period: { start: startDate, end: endDate },
    operatingActivities: {
      netIncome: incomeStatement.netIncome,
      adjustments: {
        accountsReceivable: 0,
        accountsPayable: 0,
      },
      netCashFromOperations,
    },
    investingActivities: {
      propertyPurchases: 0,
      equipmentPurchases: 0,
      netCashFromInvesting: 0,
    },
    financingActivities: {
      loanProceeds: 0,
      loanRepayments: 0,
      netCashFromFinancing: 0,
    },
    netCashFlow: netCashFromOperations,
    beginningCash: 0,
    endingCash: netCashFromOperations,
  };
}

export function generatePropertyPerformance(
  propertyId: string,
  propertyName: string,
  payments: Payment[],
  expenses: Expense[],
  units: any[],
  leases: any[],
  startDate: string,
  endDate: string
): PropertyPerformance {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const propertyUnits = units.filter(u => u.property_id === propertyId);
  const propertyLeases = leases.filter(l => {
    const unit = propertyUnits.find(u => u.id === l.unit_id);
    return unit && l.status === 'active';
  });

  const propertyPayments = payments.filter(p => {
    const date = new Date(p.payment_date);
    const lease = propertyLeases.find(l => l.id === p.lease_id);
    return lease && p.status === 'paid' && date >= start && date <= end;
  });

  const propertyExpenses = expenses.filter(e => {
    const date = new Date(e.expense_date);
    return e.property_id === propertyId && date >= start && date <= end;
  });

  const totalRevenue = propertyPayments.reduce((sum, p) => sum + p.amount + (p.late_fee || 0), 0);
  const totalExpenses = propertyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netOperatingIncome = totalRevenue - totalExpenses;

  const occupiedUnits = propertyUnits.filter(u => u.status === 'occupied').length;
  const totalUnits = propertyUnits.length;
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  const averageRentPerUnit = propertyLeases.length > 0
    ? propertyLeases.reduce((sum, l) => sum + l.rent_amount, 0) / propertyLeases.length
    : 0;

  return {
    propertyId,
    propertyName,
    totalRevenue,
    totalExpenses,
    netOperatingIncome,
    occupancyRate,
    averageRentPerUnit,
  };
}

export function generateTransactionSummary(
  payments: Payment[],
  expenses: Expense[],
  startDate: string,
  endDate: string
): { revenue: TransactionSummary[]; expenses: TransactionSummary[] } {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const periodPayments = payments.filter(p => {
    const date = new Date(p.payment_date);
    return p.status === 'paid' && date >= start && date <= end;
  });

  const periodExpenses = expenses.filter(e => {
    const date = new Date(e.expense_date);
    return date >= start && date <= end;
  });

  const revenueSummary: TransactionSummary[] = [
    {
      accountCode: '4000',
      accountName: 'Rental Income',
      amount: periodPayments.reduce((sum, p) => sum + p.amount, 0),
      count: periodPayments.length,
    },
    {
      accountCode: '4100',
      accountName: 'Late Fee Income',
      amount: periodPayments.reduce((sum, p) => sum + (p.late_fee || 0), 0),
      count: periodPayments.filter(p => p.late_fee && p.late_fee > 0).length,
    },
  ].filter(item => item.amount > 0);

  const expensesByAccount = periodExpenses.reduce((acc, e) => {
    const accountCode = mapExpenseCategoryToAccount(e.category);
    const account = DEFAULT_CHART_OF_ACCOUNTS.find(a => a.code === accountCode);
    const accountName = account?.name || 'Other Expenses';

    if (!acc[accountCode]) {
      acc[accountCode] = { accountCode, accountName, amount: 0, count: 0 };
    }
    acc[accountCode].amount += e.amount;
    acc[accountCode].count += 1;
    return acc;
  }, {} as Record<string, TransactionSummary>);

  const expenseSummary = Object.values(expensesByAccount).sort((a, b) => b.amount - a.amount);

  return {
    revenue: revenueSummary,
    expenses: expenseSummary,
  };
}

export function formatCurrency(amount: number, currency: string = 'SCR'): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const currencySymbols: Record<string, string> = {
    'SCR': '₨',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${formatted}`;
}

export function generateMonthRanges(startMonth: string, months: number): { start: string; end: string; label: string }[] {
  const ranges = [];
  const baseDate = new Date(startMonth + '-01');

  for (let i = 0; i < months; i++) {
    const monthStart = new Date(baseDate);
    monthStart.setMonth(baseDate.getMonth() - i);
    monthStart.setDate(1);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    ranges.push({
      start: monthStart.toISOString().split('T')[0],
      end: monthEnd.toISOString().split('T')[0],
      label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    });
  }

  return ranges.reverse();
}
