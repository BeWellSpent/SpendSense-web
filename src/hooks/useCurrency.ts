'use client'

import { useEffect, useState } from 'react'

const LOCALE_KEY = 'wellspent_locale'
const CURRENCY_KEY = 'wellspent_currency'

export interface UserCurrency {
  currency: string
  locale: string
}

const DEFAULT_CURRENCY: UserCurrency = { currency: 'USD', locale: 'en' }

// Mirrors the login/register/profile flows, which persist the user's saved
// language + currency to localStorage under these same keys.
export function useCurrency(): UserCurrency {
  const [value, setValue] = useState<UserCurrency>(DEFAULT_CURRENCY)

  useEffect(() => {
    const currency = localStorage.getItem(CURRENCY_KEY)
    const locale = localStorage.getItem(LOCALE_KEY)
    if (currency || locale) {
      setValue({ currency: currency || DEFAULT_CURRENCY.currency, locale: locale || DEFAULT_CURRENCY.locale })
    }
  }, [])

  return value
}
