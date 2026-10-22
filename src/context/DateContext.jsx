import { createContext, useContext, useState, useMemo } from 'react'

const DateContext = createContext(null)

export function DateProvider({ children }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth() // 0-indexed: 0 = Jan, 9 = Oct, 10 = Nov

  const isCurrentMonth = useMemo(() => {
    const now = new Date()
    return now.getFullYear() === year && now.getMonth() === month
  }, [year, month])

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDate)
  }, [selectedDate])

  const shortMonthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(selectedDate)
  }, [selectedDate])

  const goToPreviousMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToCurrentMonth = () => {
    const now = new Date()
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  const isTransactionInSelectedMonth = (txDate) => {
    if (!txDate) return false
    try {
      const d = new Date(txDate)
      if (isNaN(d.getTime())) return false
      return d.getFullYear() === year && d.getMonth() === month
    } catch {
      return false
    }
  }

  return (
    <DateContext.Provider
      value={{
        selectedDate,
        year,
        month,
        monthLabel,
        shortMonthLabel,
        isCurrentMonth,
        goToPreviousMonth,
        goToNextMonth,
        goToCurrentMonth,
        isTransactionInSelectedMonth,
      }}
    >
      {children}
    </DateContext.Provider>
  )
}

export function useDateFilter() {
  const context = useContext(DateContext)
  if (!context) {
    throw new Error('useDateFilter must be used within a DateProvider')
  }
  return context
}

