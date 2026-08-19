"use client"

import { useState } from "react"

import { CoverflowCarousel, type CoverflowSlide } from "@/components/site/coverflow-carousel"
import { MockAvaliacao } from "@/components/site/mockups/mock-avaliacao"
import { MockChamado } from "@/components/site/mockups/mock-chamado"
import { MockPortal } from "@/components/site/mockups/mock-portal"
import { MockSlaPausa } from "@/components/site/mockups/mock-sla-pausa"
import { COMO_FUNCIONA } from "@/lib/site/conteudo"

const MOCKUPS: Record<string, React.ComponentType> = {
  portal: MockPortal,
  chamado: MockChamado,
  "sla-pausa": MockSlaPausa,
  avaliacao: MockAvaliacao,
}

const SLIDES: CoverflowSlide[] = COMO_FUNCIONA.map((bloco, i) => {
  const Mockup = MOCKUPS[bloco.mockup]
  return {
    key: bloco.mockup,
    label: `Passo ${i + 1}: ${bloco.titulo}`,
    content: <Mockup />,
  }
})

export function ComoFunciona() {
  // Índice cru, sem limite — o CoverflowCarousel controla o avanço/loop; a
  // seção só precisa do resto da divisão pra saber qual dos 4 passos reais
  // mostrar na legenda.
  const [ativo, setAtivo] = useState(0)
  const indiceReal = ((ativo % COMO_FUNCIONA.length) + COMO_FUNCIONA.length) % COMO_FUNCIONA.length
  const bloco = COMO_FUNCIONA[indiceReal]

  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 pt-12 pb-16 lg:pt-16">
      <h2 className="text-d2 text-center text-foreground">Como funciona</h2>

      <div className="mt-12">
        <CoverflowCarousel
          slides={SLIDES}
          activeIndex={ativo}
          onActiveIndexChange={setAtivo}
          ariaLabel="Passos de como o Aegis funciona"
        />

        <div
          aria-live="polite"
          aria-atomic="true"
          className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 text-center"
        >
          <span className="font-tabular inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-eyebrow font-semibold text-primary">
            <span aria-hidden="true">{"//"}</span>
            {String(indiceReal + 1).padStart(2, "0")}
          </span>
          <h3 className="text-d3 text-foreground">{bloco.titulo}</h3>
          <p className="text-lead text-muted-foreground">{bloco.descricao}</p>
        </div>
      </div>
    </section>
  )
}
