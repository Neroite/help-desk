"use client"

import type { ReactNode } from "react"
import { motion } from "motion/react"

import { useReducedMotionSafe } from "@/lib/site/use-reduced-motion-safe"

const VARIANTES = {
  oculto: { opacity: 0, y: 16 },
  visivel: { opacity: 1, y: 0 },
} as const

// Wrapper genérico de scroll-reveal — o gatilho fica só aqui (whileInView no
// elemento pai), nunca por filho, mesmo idioma de components/site/text-reveal.tsx.
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const semAnimacao = useReducedMotionSafe()

  if (semAnimacao) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: true, amount: 0.2 }}
      variants={VARIANTES}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
