import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface CurrencyContextType {
  currency: string;
  isLoading: boolean;
  formatPrice: (amount: number | string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState('CHF');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organization-settings')
      .then(res => res.ok ? res.json() : null)
      .then(settings => {
        if (settings?.currency) {
          setCurrency(settings.currency);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const formatPrice = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      return `0 ${currency}`;
    }

    return `${numAmount.toLocaleString('hr-HR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    })} ${currency}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, isLoading, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
