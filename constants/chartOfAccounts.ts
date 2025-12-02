export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountSubType = 
  | 'current_asset' 
  | 'fixed_asset'
  | 'current_liability' 
  | 'long_term_liability'
  | 'owner_equity'
  | 'operating_revenue' 
  | 'other_revenue'
  | 'operating_expense' 
  | 'other_expense';

export interface ChartOfAccountsItem {
  code: string;
  name: string;
  type: AccountType;
  subType: AccountSubType;
  description: string;
  isActive: boolean;
}

export const DEFAULT_CHART_OF_ACCOUNTS: ChartOfAccountsItem[] = [
  {
    code: '1000',
    name: 'Cash and Cash Equivalents',
    type: 'asset',
    subType: 'current_asset',
    description: 'Bank accounts and cash on hand',
    isActive: true,
  },
  {
    code: '1100',
    name: 'Accounts Receivable',
    type: 'asset',
    subType: 'current_asset',
    description: 'Outstanding rent and other amounts owed by tenants',
    isActive: true,
  },
  {
    code: '1200',
    name: 'Security Deposits Held',
    type: 'asset',
    subType: 'current_asset',
    description: 'Tenant security deposits held in trust',
    isActive: true,
  },
  {
    code: '1500',
    name: 'Property and Buildings',
    type: 'asset',
    subType: 'fixed_asset',
    description: 'Real estate and property investments',
    isActive: true,
  },
  {
    code: '1600',
    name: 'Equipment and Fixtures',
    type: 'asset',
    subType: 'fixed_asset',
    description: 'Property furniture, appliances, and equipment',
    isActive: true,
  },
  {
    code: '2000',
    name: 'Accounts Payable',
    type: 'liability',
    subType: 'current_liability',
    description: 'Outstanding bills and vendor payments',
    isActive: true,
  },
  {
    code: '2100',
    name: 'Security Deposits Payable',
    type: 'liability',
    subType: 'current_liability',
    description: 'Tenant security deposits obligation',
    isActive: true,
  },
  {
    code: '2200',
    name: 'Prepaid Rent',
    type: 'liability',
    subType: 'current_liability',
    description: 'Rent received in advance',
    isActive: true,
  },
  {
    code: '2500',
    name: 'Mortgage Payable',
    type: 'liability',
    subType: 'long_term_liability',
    description: 'Property mortgage loans',
    isActive: true,
  },
  {
    code: '3000',
    name: 'Owner\'s Equity',
    type: 'equity',
    subType: 'owner_equity',
    description: 'Owner\'s investment in the business',
    isActive: true,
  },
  {
    code: '3100',
    name: 'Retained Earnings',
    type: 'equity',
    subType: 'owner_equity',
    description: 'Accumulated profits',
    isActive: true,
  },
  {
    code: '4000',
    name: 'Rental Income',
    type: 'revenue',
    subType: 'operating_revenue',
    description: 'Monthly rent payments from tenants',
    isActive: true,
  },
  {
    code: '4100',
    name: 'Late Fee Income',
    type: 'revenue',
    subType: 'operating_revenue',
    description: 'Late payment fees',
    isActive: true,
  },
  {
    code: '4200',
    name: 'Parking Income',
    type: 'revenue',
    subType: 'operating_revenue',
    description: 'Parking spot rental fees',
    isActive: true,
  },
  {
    code: '4300',
    name: 'Application Fees',
    type: 'revenue',
    subType: 'operating_revenue',
    description: 'Tenant application processing fees',
    isActive: true,
  },
  {
    code: '4900',
    name: 'Other Income',
    type: 'revenue',
    subType: 'other_revenue',
    description: 'Miscellaneous income',
    isActive: true,
  },
  {
    code: '5000',
    name: 'Maintenance and Repairs',
    type: 'expense',
    subType: 'operating_expense',
    description: 'Property maintenance and repair costs',
    isActive: true,
  },
  {
    code: '5100',
    name: 'Utilities',
    type: 'expense',
    subType: 'operating_expense',
    description: 'Water, electricity, gas, internet',
    isActive: true,
  },
  {
    code: '5200',
    name: 'Property Insurance',
    type: 'expense',
    subType: 'operating_expense',
    description: 'Property and liability insurance',
    isActive: true,
  },
  {
    code: '5300',
    name: 'Property Taxes',
    type: 'expense',
    subType: 'operating_expense',
    description: 'Municipal property taxes',
    isActive: true,
  },
  {
    code: '5400',
    name: 'Property Management Fees',
    type: 'expense',
    subType: 'operating_expense',
    description: 'Property management services',
    isActive: true,
  },
  {
    code: '5500',
    name: 'Cleaning and Janitorial',
    type: 'expense',
    subType: 'operating_expense',
    description: 'Cleaning services and supplies',
    isActive: true,
  },
  {
    code: '5600',
    name: 'Landscaping and Grounds',
    type: 'expense',
    subType: 'operating_expense',
    description: 'Lawn care and landscaping',
    isActive: true,
  },
  {
    code: '5700',
    name: 'Advertising and Marketing',
    type: 'expense',
    subType: 'operating_expense',
    description: 'Property listing and advertising costs',
    isActive: true,
  },
  {
    code: '5800',
    name: 'Legal and Professional Fees',
    type: 'expense',
    subType: 'operating_expense',
    description: 'Attorney and accountant fees',
    isActive: true,
  },
  {
    code: '5900',
    name: 'Office and Administrative',
    type: 'expense',
    subType: 'operating_expense',
    description: 'Office supplies and administrative costs',
    isActive: true,
  },
  {
    code: '6000',
    name: 'Mortgage Interest',
    type: 'expense',
    subType: 'other_expense',
    description: 'Interest paid on property loans',
    isActive: true,
  },
  {
    code: '6100',
    name: 'Depreciation',
    type: 'expense',
    subType: 'other_expense',
    description: 'Asset depreciation expense',
    isActive: true,
  },
  {
    code: '6900',
    name: 'Miscellaneous Expenses',
    type: 'expense',
    subType: 'other_expense',
    description: 'Other expenses',
    isActive: true,
  },
];

export function getAccountByCode(code: string): ChartOfAccountsItem | undefined {
  return DEFAULT_CHART_OF_ACCOUNTS.find(acc => acc.code === code);
}

export function getAccountsByType(type: AccountType): ChartOfAccountsItem[] {
  return DEFAULT_CHART_OF_ACCOUNTS.filter(acc => acc.type === type && acc.isActive);
}

export function getAccountsBySubType(subType: AccountSubType): ChartOfAccountsItem[] {
  return DEFAULT_CHART_OF_ACCOUNTS.filter(acc => acc.subType === subType && acc.isActive);
}

export function mapExpenseCategoryToAccount(category: string): string {
  const mapping: Record<string, string> = {
    'maintenance': '5000',
    'repairs': '5000',
    'utilities': '5100',
    'insurance': '5200',
    'taxes': '5300',
    'cleaning': '5500',
    'supplies': '5900',
    'tenant_reimbursement': '1100',
    'other': '6900',
  };
  return mapping[category] || '6900';
}

export function mapPaymentToAccount(paymentType: string): string {
  const mapping: Record<string, string> = {
    'rent': '4000',
    'late_fee': '4100',
    'parking': '4200',
    'application': '4300',
    'other': '4900',
  };
  return mapping[paymentType] || '4000';
}
