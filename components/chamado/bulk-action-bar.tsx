"use client"

import { CheckCircle2, Flag, User, X } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usuarios } from "@/lib/mock/data"
import { PRIORIDADE_META, STATUS_META } from "@/lib/status"
import { PRIORIDADES, STATUS_KEYS, type Prioridade, type StatusKey } from "@/lib/types"
import { cn } from "@/lib/utils"

const analistas = usuarios.filter((u) => u.papel === "analista")

interface BulkActionBarProps {
  count: number
  onClear: () => void
  onAssign: (analistaId: string) => void
  onStatus: (status: StatusKey) => void
  onPrioridade: (prioridade: Prioridade) => void
}

// Barra flutuante de ações em lote — só existe enquanto houver linhas
// selecionadas na fila (ver chamados/page.tsx). Ações são mock (toast, sem
// persistência real), igual ao restante da fase de telas.
export function BulkActionBar({ count, onClear, onAssign, onStatus, onPrioridade }: BulkActionBarProps) {
  if (count === 0) return null

  return (
    <div
      role="toolbar"
      aria-label="Ações em lote"
      className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-wrap items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 shadow-lg"
    >
      <span className="font-tabular px-1.5 text-sm font-medium text-foreground">
        {count} {count === 1 ? "selecionado" : "selecionados"}
      </span>

      <div className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "cursor-pointer")}
        >
          <User data-icon="inline-start" aria-hidden="true" />
          Atribuir
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top">
          {analistas.map((a) => (
            <DropdownMenuItem key={a.id} onClick={() => onAssign(a.id)} className="cursor-pointer">
              {a.nome}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "cursor-pointer")}
        >
          <CheckCircle2 data-icon="inline-start" aria-hidden="true" />
          Status
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top">
          {STATUS_KEYS.map((key) => (
            <DropdownMenuItem key={key} onClick={() => onStatus(key)} className="cursor-pointer">
              {STATUS_META[key].rotuloPadrao}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "cursor-pointer")}
        >
          <Flag data-icon="inline-start" aria-hidden="true" />
          Prioridade
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top">
          {PRIORIDADES.map((p) => (
            <DropdownMenuItem key={p} onClick={() => onPrioridade(p)} className="cursor-pointer">
              {PRIORIDADE_META[p].rotulo}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />

      <button
        type="button"
        onClick={onClear}
        aria-label="Limpar seleção"
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "cursor-pointer")}
      >
        <X aria-hidden="true" />
      </button>
    </div>
  )
}
