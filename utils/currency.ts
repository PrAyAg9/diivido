import AsyncStorage from '@react-native-async-storage/async-storage';

export type Currency = 'INR' | 'USD' | 'EUR';

// Currency symbols
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
};

// Exchange rates (base: INR)
// These should ideally come from an API in a real app
export const EXCHANGE_RATES: Record<Currency, number> = {
  INR: 1,      // Base currency
  USD: 0.012,  // 1 INR = 0.012 USD (approximate)
  EUR: 0.011,  // 1 INR = 0.011 EUR (approximate)
};

// Get user's selected currency from storage
export const getUserCurrency = async (): Promise<Currency> => {
  try {
    const currency = await AsyncStorage.getItem('userCurrency');
    return (currency as Currency) || 'INR';
  } catch (error) {
    console.error('Error getting user currency:', error);
    return 'INR';
  }
};

// Set user's selected currency in storage
export const setUserCurrency = async (currency: Currency): Promise<void> => {
  try {
    await AsyncStorage.setItem('userCurrency', currency);
  } catch (error) {
    console.error('Error setting user currency:', error);
  }
};

// Convert amount from one currency to another
export const convertCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to INR first (base currency)
  const amountInINR = amount / EXCHANGE_RATES[fromCurrency];
  
  // Convert from INR to target currency
  const convertedAmount = amountInINR * EXCHANGE_RATES[toCurrency];
  
  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
};

// Format amount with currency symbol
export const formatCurrency = (
  amount: number,
  currency: Currency,
  showSymbol: boolean = true
): string => {
  const formattedAmount = amount.toFixed(2);
  
  if (!showSymbol) {
    return formattedAmount;
  }

  const symbol = CURRENCY_SYMBOLS[currency];
  
  // For INR, show symbol after amount, for USD/EUR show before
  if (currency === 'INR') {
    return `${formattedAmount} ${symbol}`;
  } else {
    return `${symbol}${formattedAmount}`;
  }
};

// Convert and format amount from stored currency to user's preferred currency
export const convertAndFormatAmount = async (
  amount: number,
  storedCurrency: Currency = 'INR'
): Promise<string> => {
  const userCurrency = await getUserCurrency();
  const convertedAmount = convertCurrency(amount, storedCurrency, userCurrency);
  return formatCurrency(convertedAmount, userCurrency);
};

// Get all available currencies
export const getAvailableCurrencies = (): Currency[] => {
  return Object.keys(CURRENCY_SYMBOLS) as Currency[];
};

// Get currency name
export const getCurrencyName = (currency: Currency): string => {
  const names: Record<Currency, string> = {
    INR: 'Indian Rupee',
    USD: 'US Dollar', 
    EUR: 'Euro',
  };
  return names[currency];
};
