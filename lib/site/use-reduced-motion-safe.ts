"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"

// useReducedMotion() do Motion lê matchMedia já na primeira renderização
// do cliente — não espera um efeito. Isso diverge do `null` que o SSR
// produz (window não existe no servidor) sempre que o visitante tem
// reduced-motion ligado de verdade, e qualquer JSX condicionado direto a
// esse valor (elemento incluído/excluído, atributo, texto, ícone
// trocado…) quebra a hidratação — achado real testando com
// `prefers-reduced-motion: reduce` via CDP, não só em teoria.
//
// Este hook devolve sempre `true` (o lado "sem animação", o mais simples
// de renderizar) no SSR e na primeira passada do cliente — idêntico nos
// dois, então nunca diverge na hidratação — e só depois de montado troca
// pelo valor real, numa atualização normal pós-montagem. Serve, de
// quebra, para nunca deixar um trecho preso em animação/opacity inicial
// se o JS falhar antes do efeito rodar: o estado de partida é sempre o
// mais seguro.
export function useReducedMotionSafe() {
  const semAnimacaoReal = useReducedMotion()
  const [montado, setMontado] = useState(false)

  useEffect(() => setMontado(true), [])

  return montado ? !!semAnimacaoReal : true
}
