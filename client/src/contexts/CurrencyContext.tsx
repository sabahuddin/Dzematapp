import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { OrganizationSettings } from '@shared/schema';

interface CurrencyContextType {
  currency: string;
  isLoading: boolean;
  formatPrice: (amount: number | string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/organization-settings'],
  }) as { data: OrganizationSettings | undefined; isLoading: boolean };

  const currency = settings?.currency || 'CHF';

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
