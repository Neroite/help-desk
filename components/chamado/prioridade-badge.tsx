import { AlertTriangle } from "lucide-react"

import { PRIORIDADE_META } from "@/lib/status"
import type { Prioridade } from "@/lib/types"
import { cn } from "@/lib/utils"

interface PrioridadeBadgeProps {
  prioridade: Prioridade | null
  className?: string
}

// Estado "sem prioridade" é o gatilho visual de triage — o analista
// precisa notar isso de longe na lista, por isso o estilo é mais chamativo
// que um badge neutro comum.
export function PrioridadeBadge({ prioridade, className }: PrioridadeBadgeProps) {
  if (!prioridade) {
    return (
      <span
        className={cn(
          "inline-flex h-6 items-center gap-1.5 rounded-md border border-dashed border-accent/60 px-2 text-xs font-medium text-accent",
          className
        )}
      >
        <AlertTriangle className="size-3.5" aria-hidden="true" />
        Sem prioridade
      </span>
    )
  }

  const meta = PRIORIDADE_META[prioridade]
  const Icon = meta.icon

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-white",
        className
      )}
      style={{ backgroundColor: `var(--${meta.colorVarSolid})` }}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {meta.rotulo}
    </span>
  )
}
