import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { getStoredAsOfDate, getTodayIsoDate, normalizeAsOfDate, setStoredAsOfDate } from 'src/utils/asOfDate'

type AsOfDateContextValue = {
  asOfDate: string
  setAsOfDate: (value: string) => void
  resetAsOfDate: () => void
}

const AsOfDateContext = createContext<AsOfDateContextValue>({
  asOfDate: '',
  setAsOfDate: () => undefined,
  resetAsOfDate: () => undefined
})

export const AsOfDateProvider = ({ children }: { children: ReactNode }) => {
  const [asOfDate, setAsOfDateState] = useState('')

  useEffect(() => {
    const nextValue = getStoredAsOfDate()
    setAsOfDateState(nextValue)

    const onStorage = (event: StorageEvent) => {
      if (event.key) {
        const next = getStoredAsOfDate()
        setAsOfDateState(next)
      }
    }

    window.addEventListener('storage', onStorage)
    
return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setAsOfDate = (value: string) => {
    const normalized = normalizeAsOfDate(value) || getStoredAsOfDate()
    setStoredAsOfDate(normalized)
    setAsOfDateState(normalized)
    window.dispatchEvent(new Event('as-of-date-changed'))
  }

  const resetAsOfDate = () => {
    const next = getTodayIsoDate()
    setStoredAsOfDate(next)
    setAsOfDateState(next)
    window.dispatchEvent(new Event('as-of-date-changed'))
  }

  const value = useMemo(
    () => ({
      asOfDate,
      setAsOfDate,
      resetAsOfDate
    }),
    [asOfDate]
  )

  return <AsOfDateContext.Provider value={value}>{children}</AsOfDateContext.Provider>
}

export const useAsOfDate = () => useContext(AsOfDateContext)
