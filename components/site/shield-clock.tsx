"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { Pause, Play } from "lucide-react"

import { useReducedMotionSafe } from "@/lib/site/use-reduced-motion-safe"

// Caminho do escudo: mesmo path de components/site/aegis-logo.tsx (AegisMark),
// pra que a assinatura da landing e a marca sejam literalmente a mesma forma.
const CAMINHO_ESCUDO = "M16 2 27 6.5v8.2c0 8.1-4.7 13.6-11 15.3-6.3-1.7-11-7.2-11-15.3V6.5L16 2Z"

type Fase = "rodando" | "pausado"

const SEGUNDOS_INICIAIS = 2 * 3600 + 14 * 60 // 02:14:00, mesmo tempo do MockKanban
const DECREMENTO_POR_TICK = 11
const INTERVALO_TICK_MS = 120
const DURACAO_RODANDO_MS = 4200
const DURACAO_PAUSADO_MS = 2600

function formatarTempo(segundosTotais: number) {
  const s = Math.max(segundosTotais, 0)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":")
}

// Elemento-assinatura da landing: o mesmo escudo da marca, com o relógio de
// SLA de verdade dentro — contando, pausando (congela, muda de cor) e
// retomando. Dramatiza o diferencial real do produto em vez de decoração.
export function ShieldClock() {
  const semAnimacao = useReducedMotionSafe()
  const [fase, setFase] = useState<Fase>("rodando")
  const [segundos, setSegundos] = useState(SEGUNDOS_INICIAIS)

  useEffect(() => {
    // Com prefers-reduced-motion, nada de ciclo automático: a peça fica
    // estática, já congelada — o próprio estado "pausado" é o que
    // representa a ideia sem depender de movimento.
    if (semAnimacao) return

    let tickId: ReturnType<typeof setInterval> | undefined
    let timeoutId: ReturnType<typeof setTimeout>
    let cancelado = false

    function ciclo(proximaFase: Fase) {
      if (cancelado) return
      setFase(proximaFase)
      if (proximaFase === "rodando") {
        tickId = setInterval(() => {
          setSegundos((s) => (s > DECREMENTO_POR_TICK ? s - DECREMENTO_POR_TICK : SEGUNDOS_INICIAIS))
        }, INTERVALO_TICK_MS)
        timeoutId = setTimeout(() => {
          if (tickId) clearInterval(tickId)
          ciclo("pausado")
        }, DURACAO_RODANDO_MS)
      } else {
        timeoutId = setTimeout(() => ciclo("rodando"), DURACAO_PAUSADO_MS)
      }
    }

    ciclo("rodando")

    return () => {
      cancelado = true
      if (tickId) clearInterval(tickId)
      clearTimeout(timeoutId)
    }
  }, [semAnimacao])

  const pausado = semAnimacao || fase === "pausado"
  const rotulo = pausado ? "SLA pausado" : "SLA em andamento"
  // --status-pausado-solid é fixo entre os temas e pensado pra fundo cheio
  // com texto branco (ver app/globals.css) — o mesmo token do badge
  // "Pausado" no Kanban real, não uma cor nova.
  const corEscudo = pausado ? "var(--status-pausado-solid)" : "var(--site-navy)"

  // O anel do pulso é sempre montado — só o prop `animate` alterna entre um
  // objeto e `undefined`, no molde de app/login/login-icon-cluster.tsx.
  // Montar/desmontar o elemento em si (em vez de só o `animate`) desloca a
  // posição do `<svg>` seguinte na árvore e quebra a hidratação — ver
  // lib/site/use-reduced-motion-safe.ts.
  const animarPulso = !semAnimacao && !pausado

  return (
    <div data-shield-clock className="relative mx-auto aspect-square w-full max-w-[300px] select-none sm:max-w-[360px] lg:max-w-[420px]">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        animate={
          animarPulso
            ? {
                boxShadow: [
                  "0 0 0 0 color-mix(in srgb, var(--site-navy) 35%, transparent)",
                  "0 0 0 20px color-mix(in srgb, var(--site-navy) 0%, transparent)",
                ],
              }
            : undefined
        }
        transition={animarPulso ? { duration: 1.6, repeat: Infinity, ease: "easeOut" } : undefined}
      />

      <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full drop-shadow-xl" aria-hidden="true">
        <path d={CAMINHO_ESCUDO} fill={corEscudo} className="transition-[fill] duration-700" />
      </svg>

      <div
        role="img"
        aria-label={`Ilustração: relógio de SLA dentro do escudo Aegis, ${
          pausado ? "pausado — o prazo congelado" : "contando — o prazo correndo dentro do expediente"
        }`}
        className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pt-1"
      >
        {pausado ? (
          <Pause className="size-5 text-white/90" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Play className="size-5 text-white/90" strokeWidth={2.5} aria-hidden="true" />
        )}
        <span className="font-tabular text-2xl font-bold text-white sm:text-3xl">
          {formatarTempo(semAnimacao ? SEGUNDOS_INICIAIS : segundos)}
        </span>
        <span className="text-xs font-semibold tracking-wider text-white/85 uppercase">{rotulo}</span>
      </div>
    </div>
  )
}
