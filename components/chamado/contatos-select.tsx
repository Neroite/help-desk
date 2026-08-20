"use client"

import { ChevronDown, X } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useReferenceData } from "@/lib/reference-data/provider"
import type { Usuario } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ContatosSelectProps {
  id?: string
  empresaId: string
  contatoIds: string[]
  onContatoIdsChange: (ids: string[]) => void
}

// Multi-seleção de contatos na abertura do chamado (F10, referência Milvus)
// -- substitui o antigo Select de Solicitante único. O primeiro id da lista
// vira solicitante_id (dono do chamado); os demais viram ticket_contato
// (ver lib/tickets/actions.ts). DropdownMenu com checkbox, não <Select>
// nativo (não suporta multi) -- mesmo padrão de categoria-problema-select.tsx.
export function ContatosSelect({ id, empresaId, contatoIds, onContatoIdsChange }: ContatosSelectProps) {
  const { usuarios } = useReferenceData()

  const solicitantes = usuarios.filter((u) => u.papel === "solicitante" && u.empresaId === empresaId)
  const selecionados = contatoIds
    .map((cid) => solicitantes.find((u) => u.id === cid))
    .filter((u): u is Usuario => u !== undefined)

  function alternar(usuarioId: string, marcado: boolean) {
    if (marcado) {
      if (!contatoIds.includes(usuarioId)) onContatoIdsChange([...contatoIds, usuarioId])
    } else {
      onContatoIdsChange(contatoIds.filter((cid) => cid !== usuarioId))
    }
  }

  function remover(usuarioId: string) {
    onContatoIdsChange(contatoIds.filter((cid) => cid !== usuarioId))
  }

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          id={id}
          disabled={!empresaId}
          className={cn(
            "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap outline-none select-none",
            "cursor-pointer transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-60",
            selecionados.length === 0 && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {!empresaId
              ? "Escolha a empresa primeiro"
              : selecionados.length === 0
                ? "Selecione os contatos"
                : `${selecionados.length} contato${selecionados.length > 1 ? "s" : ""} selecionado${selecionados.length > 1 ? "s" : ""}`}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-(--anchor-width)">
          {solicitantes.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Essa empresa não tem solicitantes cadastrados.
            </div>
          ) : (
            solicitantes.map((usuario) => (
              <DropdownMenuCheckboxItem
                key={usuario.id}
                checked={contatoIds.includes(usuario.id)}
                onCheckedChange={(marcado) => alternar(usuario.id, marcado === true)}
              >
                <span className="flex flex-col">
                  <span>{usuario.nome}</span>
                  <span className="text-xs text-muted-foreground">{usuario.email}</span>
                </span>
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selecionados.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selecionados.map((usuario) => (
            <li
              key={usuario.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1 pr-1 pl-2.5 text-xs"
            >
              <span className="text-foreground">{usuario.nome}</span>
              <span className="text-muted-foreground">{usuario.email}</span>
              <button
                type="button"
                aria-label={`Remover ${usuario.nome}`}
                className="flex size-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => remover(usuario.id)}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
