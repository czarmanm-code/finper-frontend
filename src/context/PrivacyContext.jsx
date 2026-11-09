import { createContext, useContext, useState, useCallback } from 'react'

const PrivacyContext = createContext(null)

export function PrivacyProvider({ children }) {
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
    return localStorage.getItem('finper_privacy_mode') === 'true'
  })

  const togglePrivacyMode = useCallback(() => {
    setIsPrivacyMode((prev) => {
      const next = !prev
      localStorage.setItem('finper_privacy_mode', String(next))
      return next
    })
  }, [])

  /**
   * Helper to format currency values while respecting privacy mode.
   * If privacy mode is on, masks the amount with "••••••" or "$ ••••••".
   */
  const mask = useCallback(
    (amount, options = {}) => {
      const {
        noPrefix = false,
        sign = '',
      } = options

      if (isPrivacyMode) {
        const maskSymbols = '••••••'
        if (noPrefix) return maskSymbols
        return sign ? `${sign}$ ••••••` : '$ ••••••'
      }

      const maxDigits = options.maximumFractionDigits ?? 2
      const minDigits = Math.min(options.minimumFractionDigits ?? Math.min(2, maxDigits), maxDigits)

      const num = typeof amount === 'number' ? amount : Number(amount) || 0
      const formatted = num.toLocaleString('en-US', {
        minimumFractionDigits: Math.max(0, minDigits),
        maximumFractionDigits: Math.max(0, maxDigits),
      })

      if (noPrefix) return formatted
      return sign ? `${sign}$${formatted}` : `$${formatted}`
    },
    [isPrivacyMode]
  )

  return (
    <PrivacyContext.Provider
      value={{
        isPrivacyMode,
        togglePrivacyMode,
        mask,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  const context = useContext(PrivacyContext)
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider')
  }
  return context
}

