"use client"

import { Badge } from "@/components/ui/badge"

interface FiltroPillProps {
  rotulo: string
  contador?: number
  onClick: () => void
}

// Apesar do nome (herdado da barra de filtros original), hoje é só um
// botão de ação com contador -- abre um modal, não filtra mais nada. Ver
// chamado-conversa-rica: a pill "Comentários" passou a abrir o modal em
// vez de alternar a timeline.
export function FiltroPill({ rotulo, contador, onClick }: FiltroPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      {rotulo}
      {contador !== undefined && (
        <Badge variant="secondary" className="h-4 px-1.5 font-tabular text-[10px]">
          {contador}
        </Badge>
      )}
    </button>
  )
}
