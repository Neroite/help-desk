import { STATUS_META } from "@/lib/status"
import type { StatusKey } from "@/lib/types"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  statusKey: StatusKey
  rotulo?: string
  className?: string
}

// Rótulo vem da empresa (empresa_status.rotulo) quando definido — cai no
// rótulo padrão do catálogo caso contrário. A semântica (cor, ícone) é
// sempre a do catálogo global, nunca configurável por empresa.
export function StatusBadge({ statusKey, rotulo, className }: StatusBadgeProps) {
  const meta = STATUS_META[statusKey]
  const Icon = meta.icon

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-white",
        className
      )}
      // Com a linha/card sem tingimento (ver ticket-row/ticket-card), o
      // badge é a única fonte de cor de status — precisa carregar sozinho.
      style={{ backgroundColor: `var(--${meta.colorVarSolid})` }}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {rotulo ?? meta.rotuloPadrao}
    </span>
  )
}
