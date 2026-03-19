'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { formatCurrency as _formatCurrency } from '@/lib/utils/currency'

interface CurrencyContextValue {
  currencyCode: string
  locale: string
  formatCurrency: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currencyCode: 'USD',
  locale: 'en-US',
  formatCurrency: (amount) => _formatCurrency(amount),
})

interface CurrencyProviderProps {
  currencyCode: string
  locale: string
  children: ReactNode
}

export function CurrencyProvider({ currencyCode, locale, children }: CurrencyProviderProps) {
  const formatCurrency = (amount: number) =>
    _formatCurrency(amount, currencyCode, locale)

  return (
    <CurrencyContext.Provider value={{ currencyCode, locale, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
