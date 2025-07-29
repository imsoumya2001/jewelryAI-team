// Currency conversion utilities
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial', flag: '🇴🇲' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal', flag: '🇶🇦' },
];

// Static exchange rates to USD (in a real app, you'd fetch these from an API)
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  AED: 3.67,
  INR: 83.25,
  PKR: 278.50,
  AUD: 1.52,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  OMR: 0.38,
  QAR: 3.64,
};

export const convertToUSD = (amount: number, fromCurrency: string): number => {
  const rate = EXCHANGE_RATES[fromCurrency] || 1;
  return amount / rate;
};

export const convertFromUSD = (amount: number, toCurrency: string): number => {
  const rate = EXCHANGE_RATES[toCurrency] || 1;
  return amount * rate;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  const symbol = currencyInfo?.symbol || '$';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === 'OMR' ? 3 : 2,
  }).format(amount) + ' ' + symbol;
};

export const getCurrencySymbol = (currency: string): string => {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  return currencyInfo?.symbol || '$';
};