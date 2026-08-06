"use client"

import { SLA_SEVERIDADE_META } from "@/lib/status"
import { calcularSeveridade, formatarTempoRestante } from "@/lib/sla-display"
import { useSlaClock } from "@/lib/sla-clock"
import type { StatusKey } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SlaProgressProps {
  rotulo: string
  venceEm: string | null
  criadoEm: string
  statusKey: StatusKey
  className?: string
}

// Barra fina de progresso de SLA — usada na listagem (coluna Resposta/Solução)
// e no detalhe do chamado (painel lateral). Mesmo guard de hidratação do
// SlaBadge: `agora` só existe depois de montar no cliente.
export function SlaProgress({ rotulo, venceEm, criadoEm, statusKey, className }: SlaProgressProps) {
  const agora = useSlaClock()

  if (!agora) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{rotulo}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted" />
      </div>
    )
  }

  const severidade = calcularSeveridade(venceEm, statusKey, agora)
  const meta = SLA_SEVERIDADE_META[severidade]
  const tempo = formatarTempoRestante(venceEm, agora)

  let percentual = 0
  if (venceEm) {
    const inicio = new Date(criadoEm).getTime()
    const fim = new Date(venceEm).getTime()
    const total = fim - inicio
    const decorrido = agora.getTime() - inicio
    percentual = total > 0 ? Math.min(100, Math.max(0, (decorrido / total) * 100)) : 100
  }

  const rotuloAcessivel = `SLA ${rotulo}: ${meta.rotulo}, ${tempo}`

  return (
    <div className={cn("flex flex-col gap-1", className)} title={rotuloAcessivel}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{rotulo}</span>
        <span className="font-tabular" style={{ color: `var(--${meta.colorVar})` }}>
          {tempo}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={rotuloAcessivel}
        aria-valuenow={Math.round(percentual)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${percentual}%`,
            backgroundColor: `var(--${meta.colorVar})`,
          }}
        />
      </div>
    </div>
  )
}
