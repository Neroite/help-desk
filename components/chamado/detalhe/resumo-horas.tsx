"use client"

import { Button } from "@/components/ui/button"
import type { ApontamentoHoras as ApontamentoHorasItem } from "@/lib/types"

interface ResumoHorasProps {
  apontamentos: ApontamentoHorasItem[]
  onAbrir: () => void
}

function formatarMinutos(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`
}

// Resumo somente-leitura do painel lateral (aside desktop e aba mobile
// "Detalhes") -- o componente cheio (<ApontamentoHoras>, totalizador +
// tabela + lançar) monta só dentro do ApontamentoHorasDialog. Antes deste
// resumo, <ApontamentoHoras> montava aqui TAMBÉM, e um clique na pill
// "Horas" abria o dialog com uma segunda instância ao lado -- dois
// `processando` independentes, dois botões "Iniciar timer" pra um índice
// único de timer aberto por analista (correção C7 do plano de rebrand).
export function ResumoHoras({ apontamentos, onAbrir }: ResumoHorasProps) {
  const totalMinutos = apontamentos
    .filter((a) => a.fim !== null)
    .reduce((soma, a) => soma + (a.minutos ?? 0), 0)

  return (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-horas">
      <h2 id="secao-horas" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Horas
      </h2>
      <div className="flex items-center justify-between gap-2">
        <span className="font-tabular text-sm font-medium text-foreground">{formatarMinutos(totalMinutos)}</span>
        <Button type="button" size="sm" variant="ghost" className="h-7 cursor-pointer text-xs" onClick={onAbrir}>
          Ver apontamentos
        </Button>
      </div>
    </section>
  )
}
