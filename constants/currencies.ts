export type CurrencyCode = 'SCR' | 'EUR' | 'USD';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag?: string;
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  SCR: {
    code: 'SCR',
    symbol: '₨',
    name: 'Seychelles Rupee',
    flag: '🇸🇨',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
  },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'SCR';

export const getCurrencySymbol = (code: CurrencyCode): string => {
  return CURRENCIES[code]?.symbol || '₨';
};

export const formatCurrency = (amount: number, currencyCode: CurrencyCode): string => {
  const currency = CURRENCIES[currencyCode];
  return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency.code}`;
};
