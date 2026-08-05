"use client"

import { SLA_SEVERIDADE_META } from "@/lib/status"
import { calcularSeveridade, formatarTempoRestante } from "@/lib/sla-display"
import { useSlaClock } from "@/lib/sla-clock"
import type { StatusKey } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SlaBadgeProps {
  rotulo: string
  venceEm: string | null
  statusKey: StatusKey
  className?: string
}

// Consome o SlaClockProvider (tick de 30s) em vez de ter seu próprio
// setInterval — com dezenas de chamados na tela, cada badge com o
// próprio timer de 1s vira jank garantido.
export function SlaBadge({ rotulo, venceEm, statusKey, className }: SlaBadgeProps) {
  const agora = useSlaClock()
  const severidade = calcularSeveridade(venceEm, statusKey, agora)
  const meta = SLA_SEVERIDADE_META[severidade]
  const Icon = meta.icon
  const tempo = formatarTempoRestante(venceEm, agora)
  const estourado = severidade === "estourado"

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium font-tabular",
        estourado ? "text-white" : "border",
        className
      )}
      style={
        estourado
          ? { backgroundColor: `var(--${meta.colorVar})` }
          : {
              color: `var(--${meta.colorVar})`,
              borderColor: `color-mix(in srgb, var(--${meta.colorVar}) 40%, transparent)`,
              backgroundColor: `color-mix(in srgb, var(--${meta.colorVar}) 12%, transparent)`,
            }
      }
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {rotulo} {tempo}
    </span>
  )
}
