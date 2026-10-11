import { useState, useEffect, useRef } from 'react'

/**
 * Mix ATM (Cents-driven shift) + Hero Fintech Typography.
 * - Digits shift right-to-left like an ATM/Cash App (e.g. typing 3 -> $0.03, then 3 -> $0.33, then 0 -> $3.30, etc.)
 * - Hero typography with clear thousands separators and always-visible cents (.00).
 * - Backspace removes the last cent and shifts right.
 * - Supports mobile soft keyboards (via beforeinput / input fallback) and physical keyboards.
 * - Clear button when amount > 0.
 */
export default function CurrencyInput({
  value,
  onChange,
  label,
  helperText,
  size = 'hero',
  autoFocus = false,
  error,
}) {
  const inputRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)

  // Internal state is stored in integer cents (e.g., $330.00 is stored as 33000 cents)
  const [cents, setCents] = useState(() => {
    if (value !== undefined && value !== null && value !== '') {
      const num = Number(value)
      if (!isNaN(num) && num > 0) {
        return Math.round(num * 100)
      }
    }
    return 0
  })

  // Synchronize when value changes externally (e.g., opening edit modal)
  useEffect(() => {
    if (value !== undefined && value !== null) {
      const num = Number(value)
      const targetCents = isNaN(num) || num <= 0 ? 0 : Math.round(num * 100)
      if (!isFocused && targetCents !== cents) {
        setCents(targetCents)
      }
    }
  }, [value, isFocused, cents])

  // Focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Update cents and inform parent
  const updateCents = (newCents) => {
    // Cap at 100 million (100,000,000.00 = 10,000,000,000 cents) to prevent overflow
    if (newCents > 10000000000) return
    setCents(newCents)
    if (onChange) {
      onChange(newCents / 100)
    }
  }

  // Handle keydown for desktop browsers
  const handleKeyDown = (e) => {
    if (
      e.key === 'Tab' ||
      e.key === 'Enter' ||
      e.key === 'Escape' ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey
    ) {
      return
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      updateCents(Math.floor(cents / 10))
      return
    }

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault()
      const digit = parseInt(e.key, 10)
      updateCents(cents * 10 + digit)
    }
  }

  // Handle input event (crucial for mobile virtual keyboards where onKeyDown may send 'Unidentified')
  const handleInput = (e) => {
    const inputType = e.nativeEvent?.inputType
    if (inputType === 'deleteContentBackward' || inputType === 'deleteContentForward') {
      updateCents(Math.floor(cents / 10))
      return
    }

    const data = e.nativeEvent?.data
    if (data && /^[0-9]+$/.test(data)) {
      let current = cents
      for (const char of data) {
        const digit = parseInt(char, 10)
        current = current * 10 + digit
      }
      updateCents(current)
    }
  }

  // Handle paste of standard numeric values (e.g. "33000" or "33000.50")
  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    const cleaned = pasted.replace(/[^0-9.]/g, '')
    const parsed = parseFloat(cleaned)
    if (!isNaN(parsed) && parsed >= 0) {
      updateCents(Math.round(parsed * 100))
    }
  }

  // Format cents into integer and decimal string
  const formatDisplay = () => {
    const totalAmount = cents / 100
    const [intPart, decPart] = totalAmount.toFixed(2).split('.')
    const integerFormatted = Number(intPart).toLocaleString('en-US')
    return {
      integer: integerFormatted,
      decimal: `.${decPart}`,
      hasAmount: cents > 0,
    }
  }

  const { integer, decimal, hasAmount } = formatDisplay()
  const isHero = size === 'hero'

  const handleReset = (e) => {
    e.stopPropagation()
    updateCents(0)
    inputRef.current?.focus()
  }

  return (
    <div className="w-full flex flex-col">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </label>
          {hasAmount && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Hero ATM Display Container */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`relative w-full rounded-2xl border transition-all cursor-text flex items-center justify-center select-none ${
          isHero ? 'py-5 sm:py-6 px-4' : 'py-3.5 px-3'
        } ${
          error
            ? 'border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20'
            : isFocused
            ? 'border-sky-500 dark:border-sky-400 ring-4 ring-sky-500/10 bg-white dark:bg-slate-900 shadow-sm'
            : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        {/* Invisible native input for keyboard/mobile capture */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value=""
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onPaste={handlePaste}
          onChange={() => {}} // Satisfies React controlled input check
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-text pointer-events-auto"
          aria-label={label || 'Currency amount'}
        />

        {/* Hero Visual Display with ATM shifts */}
        <div className="flex items-baseline justify-center pointer-events-none">
          {/* Currency Symbol */}
          <span
            className={`font-bold mr-1.5 transition-colors ${
              isHero ? 'text-2xl sm:text-3xl' : 'text-xl'
            } ${
              hasAmount
                ? 'text-slate-400 dark:text-slate-500'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          >
            $
          </span>

          {/* Integer Portion (Formatted with thousand commas) */}
          <span
            className={`font-black tracking-tight transition-colors ${
              isHero ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
            } ${
              hasAmount
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          >
            {integer}
          </span>

          {/* Cents Portion (Always visible .00) */}
          <span
            className={`font-bold ml-0.5 transition-colors ${
              isHero ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
            } ${
              hasAmount
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {decimal}
          </span>

          {/* Blinking Fintech Caret when focused */}
          {isFocused && (
            <span
              className={`inline-block w-0.5 bg-sky-500 dark:bg-sky-400 ml-1 rounded-full animate-pulse ${
                isHero ? 'h-8 sm:h-10' : 'h-6'
              }`}
            />
          )}
        </div>
      </div>

      {helperText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 text-center">
          {helperText}
        </p>
      )}

      {error && (
        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 font-medium text-center">
          {error}
        </p>
      )}
    </div>
  )
}
