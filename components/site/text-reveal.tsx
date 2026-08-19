"use client"

import { motion, type Variants } from "motion/react"

import { useReducedMotionSafe } from "@/lib/site/use-reduced-motion-safe"

export interface TextRevealSegmento {
  texto: string
  className?: string
}

interface TextRevealProps {
  segmentos: TextRevealSegmento[]
  /** Texto completo pro leitor de tela — não derivado dos segmentos, pra
      zero risco de perder um espaço na fronteira entre eles. */
  textoAcessivel: string
  className?: string
}

const DURACAO_LETRA = 0.5
const DELAY_POR_LETRA = 0.02
const EASE = [0.22, 1, 0.36, 1] as const

const VARIANTES_LETRA: Variants = {
  oculto: { opacity: 0, y: 14 },
  visivel: { opacity: 1, y: 0 },
}

interface Palavra {
  texto: string
  className?: string
  /** Índice da primeira letra desta palavra no título inteiro — contínuo
      através dos segmentos, é isso que faz a cascata tratar o título como
      um texto só, mesmo cortado em cores diferentes. */
  indiceLetraInicial: number
  ultimaDoTitulo: boolean
}

function construirPalavras(segmentos: TextRevealSegmento[]): Palavra[] {
  const palavras: Palavra[] = []
  let indiceLetra = 0

  segmentos.forEach((segmento) => {
    segmento.texto.split(" ").forEach((texto) => {
      if (texto === "") return
      palavras.push({ texto, className: segmento.className, indiceLetraInicial: indiceLetra, ultimaDoTitulo: false })
      indiceLetra += texto.length
    })
  })

  if (palavras.length > 0) palavras[palavras.length - 1].ultimaDoTitulo = true
  return palavras
}

// Reveal letra-por-letra pro título do Hero. Segue a mesma estrutura do
// Reveal (components/site/reveal.tsx): useReducedMotionSafe() decide, no
// topo, entre um <h1> de texto real (sem split nenhum) e a versão
// animada — nunca um único JSX com animação condicional por dentro, senão
// reintroduz o bug de hidratação que motivou o hook (ver
// lib/site/use-reduced-motion-safe.ts).
//
// O gatilho é whileInView no <motion.h1> pai — nunca initial/animate de
// montagem. O Hero não é mais a primeira seção da página; se a animação
// disparasse ao montar, já teria terminado muito antes de qualquer
// visitante rolar até lá. Cada letra usa `variants` com os mesmos nomes
// de estado do pai (oculto/visivel) e NENHUM whileInView próprio — o
// Motion propaga o estado do ancestral mais próximo que o declara, então
// uma spring por letra não custa 34 IntersectionObservers, e a cascata
// fica coordenada por um só gatilho.
export function TextReveal({ segmentos, textoAcessivel, className }: TextRevealProps) {
  const semAnimacao = useReducedMotionSafe()

  if (semAnimacao) {
    return (
      <h1 className={className}>
        {segmentos.map((segmento, i) => (
          <span key={i} className={segmento.className}>
            {segmento.texto}
          </span>
        ))}
      </h1>
    )
  }

  const palavras = construirPalavras(segmentos)

  return (
    <motion.h1
      className={className}
      aria-label={textoAcessivel}
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -12% 0px" }}
    >
      <span aria-hidden="true">
        {palavras.map((palavra, i) => (
          <span
            key={i}
            className={`inline-block ${palavra.ultimaDoTitulo ? "" : "mr-[0.25em]"} ${palavra.className ?? ""}`}
          >
            {palavra.texto.split("").map((letra, j) => (
              <motion.span
                key={j}
                variants={VARIANTES_LETRA}
                transition={{
                  duration: DURACAO_LETRA,
                  ease: EASE,
                  delay: (palavra.indiceLetraInicial + j) * DELAY_POR_LETRA,
                }}
                className="inline-block"
              >
                {letra}
              </motion.span>
            ))}
          </span>
        ))}
      </span>
    </motion.h1>
  )
}
