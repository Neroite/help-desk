"use client"

import { useState } from "react"
import { Play, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useReferenceData } from "@/lib/reference-data/provider"
import type { ApontamentoHoras as ApontamentoHorasItem } from "@/lib/types"

interface ApontamentoHorasProps {
  apontamentos: ApontamentoHorasItem[]
}

function formatarMinutos(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`
}

// Timer é local ao componente (não persiste no mock) — o objetivo aqui é
// a UI da fase de telas. Gravação real de apontamento entra na fase 4.
export function ApontamentoHoras({ apontamentos }: ApontamentoHorasProps) {
  const [rodando, setRodando] = useState(false)
  const { usuarioPorId } = useReferenceData()

  const totalMinutos = apontamentos.reduce((soma, a) => soma + a.minutos, 0)
  const faturavelMinutos = apontamentos
    .filter((a) => a.faturavel)
    .reduce((soma, a) => soma + a.minutos, 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-tabular text-sm font-medium text-foreground">
          {formatarMinutos(totalMinutos)}{" "}
          <span className="font-sans text-xs font-normal text-muted-foreground">
            ({formatarMinutos(faturavelMinutos)} faturável)
          </span>
        </span>
        <Button
          type="button"
          size="sm"
          variant={rodando ? "destructive" : "outline"}
          className="h-7 text-xs"
          onClick={() => setRodando((v) => !v)}
        >
          {rodando ? (
            <Square className="size-3.5" data-icon="inline-start" />
          ) : (
            <Play className="size-3.5" data-icon="inline-start" />
          )}
          {rodando ? "Parar timer" : "Iniciar timer"}
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        {apontamentos.map((a) => (
          <li key={a.id} className="flex flex-col gap-0.5 border-t border-border pt-2 text-xs first:border-0 first:pt-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{usuarioPorId(a.analistaId)?.nome}</span>
              <span className="font-tabular text-muted-foreground">{formatarMinutos(a.minutos)}</span>
            </div>
            <p className="text-muted-foreground">{a.descricao}</p>
            {a.faturavel && <span className="w-fit rounded-sm bg-sla-ok/10 px-1.5 py-0.5 text-[10px] font-medium text-sla-ok">Faturável</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
