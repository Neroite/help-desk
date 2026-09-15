"use client"

import { ArrowRight, Clock, Pause } from "lucide-react"
import { motion, type Variants } from "motion/react"

import { useReducedMotionSafe } from "@/lib/site/use-reduced-motion-safe"

interface Par {
  antes: string
  depois: string
}

const LISTA_VARIANTES: Variants = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.15, delayChildren: 0.05 } },
}

// O pulso do lado "antes" dispara uma vez só (sem repeat), amarrado à
// própria entrada por scroll — comunica "relógio correndo solto" sem virar
// loop ambiente permanente.
const ANTES_VARIANTES: Variants = {
  oculto: {
    opacity: 0,
    y: 10,
    boxShadow: "0 0 0 0 color-mix(in srgb, var(--sla-atencao) 0%, transparent)",
  },
  visivel: {
    opacity: 1,
    y: 0,
    boxShadow: [
      "0 0 0 0 color-mix(in srgb, var(--sla-atencao) 0%, transparent)",
      "0 0 0 6px color-mix(in srgb, var(--sla-atencao) 35%, transparent)",
      "0 0 0 6px color-mix(in srgb, var(--sla-atencao) 0%, transparent)",
    ],
    transition: { duration: 0.9, ease: "easeOut" },
  },
}

// O lado "depois" entra sem pulso, com um pequeno atraso extra — a calma vem
// da ausência de movimento, mesmo truque do estado pausado do ShieldClock.
const DEPOIS_VARIANTES: Variants = {
  oculto: { opacity: 0, y: 10 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.15 } },
}

export function DorViradaPares({ pares }: { pares: readonly Par[] }) {
  const semAnimacao = useReducedMotionSafe()

  if (semAnimacao) {
    return (
      <ul className="mt-10 divide-y divide-border rounded-xl border border-border bg-surface">
        {pares.map((par) => (
          <li key={par.antes} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <Linha par={par} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <motion.ul
      className="mt-10 divide-y divide-border rounded-xl border border-border bg-surface"
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: true, amount: 0.25 }}
      variants={LISTA_VARIANTES}
    >
      {pares.map((par) => (
        <li key={par.antes} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
          <motion.div
            variants={ANTES_VARIANTES}
            className="flex flex-1 items-start gap-2.5 rounded-md p-1 text-sm text-muted-foreground"
          >
            <Clock className="mt-0.5 size-4 shrink-0" style={{ color: "var(--sla-atencao)" }} aria-hidden="true" />
            <span>
              <span className="sr-only">Antes: </span>
              {par.antes}
            </span>
          </motion.div>
          <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
          <motion.div
            variants={DEPOIS_VARIANTES}
            className="flex flex-1 items-start gap-2.5 text-sm font-medium text-foreground"
          >
            <Pause className="mt-0.5 size-4 shrink-0" style={{ color: "var(--sla-ok)" }} aria-hidden="true" />
            <span>
              <span className="sr-only">Depois: </span>
              {par.depois}
            </span>
          </motion.div>
        </li>
      ))}
    </motion.ul>
  )
}

function Linha({ par }: { par: Par }) {
  return (
    <>
      <div className="flex flex-1 items-start gap-2.5 text-sm text-muted-foreground">
        <Clock className="mt-0.5 size-4 shrink-0" style={{ color: "var(--sla-atencao)" }} aria-hidden="true" />
        <span>
          <span className="sr-only">Antes: </span>
          {par.antes}
        </span>
      </div>
      <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
      <div className="flex flex-1 items-start gap-2.5 text-sm font-medium text-foreground">
        <Pause className="mt-0.5 size-4 shrink-0" style={{ color: "var(--sla-ok)" }} aria-hidden="true" />
        <span>
          <span className="sr-only">Depois: </span>
          {par.depois}
        </span>
      </div>
    </>
  )
}
