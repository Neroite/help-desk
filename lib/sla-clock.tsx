"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// Um único relógio compartilhado: evita 1 setInterval por SlaBadge na tela.
// Tick de 30s é suficiente para prazos medidos em horas — ver design system.
const SlaClockContext = createContext<Date>(new Date())

export function SlaClockProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return <SlaClockContext.Provider value={now}>{children}</SlaClockContext.Provider>
}

export function useSlaClock(): Date {
  return useContext(SlaClockContext)
}
