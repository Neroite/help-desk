"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView, type Variants } from "motion/react"

import { useReducedMotionSafe } from "@/lib/site/use-reduced-motion-safe"
import { FATOS } from "@/lib/site/prova-social"

const LISTA_VARIANTES: Variants = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}

const ITEM_VARIANTES: Variants = {
  oculto: { opacity: 0, y: 12 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

const DURACAO_CONTAGEM_MS = 1500

// Só os fatos que são número puro contam pra cima ao entrar na tela — "6"
// (índice 1) e "3" (índice 2). "09:00–18:00" e "RLS" não são quantidade,
// contá-los não faria sentido.
const INDICES_CONTAVEIS = [1, 2] as const

function useContagem(alvo: number, ativo: boolean) {
  const [valor, setValor] = useState(0)

  useEffect(() => {
    if (!ativo) return
    let frameId: number
    const inicio = performance.now()
    function tick(agora: number) {
      // Linear, de propósito: com alvo tão baixo (3 ou 6), um ease-out
      // "come" quase todos os incrementos nos primeiros ~300ms e passa o
      // resto do tempo parado no valor final — dá a impressão de ter
      // pulado direto pro número, sem dar tempo de ler a contagem.
      const t = Math.min((agora - inicio) / DURACAO_CONTAGEM_MS, 1)
      setValor(Math.round(alvo * t))
      if (t < 1) frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [ativo, alvo])

  return valor
}

export function ProvaDeEscalaFatos() {
  const semAnimacao = useReducedMotionSafe()
  const containerRef = useRef<HTMLDivElement>(null)
  const emVista = useInView(containerRef, { once: true, amount: 0.4 })
  const contando = emVista && !semAnimacao

  const contagem1 = useContagem(Number(FATOS[INDICES_CONTAVEIS[0]].valor), contando)
  const contagem2 = useContagem(Number(FATOS[INDICES_CONTAVEIS[1]].valor), contando)

  // O wrapper com o ref precisa ser o MESMO elemento nas duas árvores — se
  // ele só existisse no branch animado, useInView nunca teria nada pra
  // observar na primeira renderização (sempre "sem animação", ver
  // use-reduced-motion-safe.ts) e não se reconecta depois que o ref muda de
  // null pra um nó real. Mesmo formato de components/site/mockups/mock-kanban.tsx.
  return (
    <div ref={containerRef}>
      {semAnimacao ? (
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FATOS.map((fato) => (
            <div key={fato.rotulo}>
              <p className="font-tabular text-d2 font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {fato.valor}
              </p>
              <p className="text-lead" style={{ color: "var(--site-navy-fg)" }}>
                {fato.rotulo}
              </p>
              <p className="text-sm text-white/60">{fato.detalhe}</p>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 gap-8 sm:grid-cols-4"
          initial="oculto"
          whileInView="visivel"
          viewport={{ once: true, amount: 0.4 }}
          variants={LISTA_VARIANTES}
        >
          {FATOS.map((fato, i) => {
            const valorExibido =
              i === INDICES_CONTAVEIS[0] ? contagem1 : i === INDICES_CONTAVEIS[1] ? contagem2 : fato.valor
            return (
              <motion.div key={fato.rotulo} variants={ITEM_VARIANTES}>
                <p className="font-tabular text-d2 font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  {valorExibido}
                </p>
                <p className="text-lead" style={{ color: "var(--site-navy-fg)" }}>
                  {fato.rotulo}
                </p>
                <p className="text-sm text-white/60">{fato.detalhe}</p>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
