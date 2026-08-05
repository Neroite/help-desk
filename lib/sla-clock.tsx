"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// Um único relógio compartilhado: evita 1 setInterval por SlaBadge na tela.
// Tick de 30s é suficiente para prazos medidos em horas — ver design system.
//
// `null` até montar no cliente: SSR e a primeira renderização do cliente
// precisam produzir o mesmo HTML. Calcular `new Date()` durante o SSR e de
// novo na montagem do cliente gera dois instantes diferentes (erro de
// hidratação do React) — o texto "11min" no servidor vira "12min" no
// cliente. Consumidores tratam `null` como "ainda não sei, não calcule".
const SlaClockContext = createContext<Date | null>(null)

export function SlaClockProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return <SlaClockContext.Provider value={now}>{children}</SlaClockContext.Provider>
}

export function useSlaClock(): Date | null {
  return useContext(SlaClockContext)
}
