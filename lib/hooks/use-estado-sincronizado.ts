"use client"

import { useRef, useState, type Dispatch, type SetStateAction } from "react"

// Estado local que parte de uma prop e aceita edições otimistas (patch
// imediato antes da Server Action confirmar), mas se resincroniza sempre
// que a prop chega com uma referência nova — é o que acontece depois de um
// `router.refresh()` (disparado pelo nosso hook de Realtime, ou pelo
// próprio Next depois de uma Server Action). Sem isso, o patch otimista
// nunca seria substituído pelo dado real vindo do servidor: um comentário
// com `id: local-...` continuaria na tela pra sempre em vez de virar o
// registro com o id do banco.
//
// Ajuste de estado durante a própria renderização (não em useEffect) é o
// padrão documentado pelo React para "resetar estado quando uma prop muda"
// — evita o repaint extra de um efeito rodando depois do commit.
export function useEstadoSincronizado<T>(valorAtual: T): [T, Dispatch<SetStateAction<T>>] {
  const [estado, setEstado] = useState(valorAtual)
  const anteriorRef = useRef(valorAtual)

  if (anteriorRef.current !== valorAtual) {
    anteriorRef.current = valorAtual
    setEstado(valorAtual)
  }

  return [estado, setEstado]
}
