"use client"

import { ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useReferenceData } from "@/lib/reference-data/provider"
import { cn } from "@/lib/utils"

interface CategoriaProblemaSelectProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
}

// Drill-down: só as categorias raiz aparecem na lista principal; uma raiz
// com subcategorias abre um submenu ao ser apontada/clicada (mesmo padrão
// de "Mover para" do Kanban), em vez de despejar categoria e subcategoria
// juntas numa lista só — ver openspec/specs/chamado-categorizacao
// (Requirement: Seleção de categoria de problema no chamado usa drill-down).
export function CategoriaProblemaSelect({ id, value, onValueChange }: CategoriaProblemaSelectProps) {
  const { categoriasProblema } = useReferenceData()

  const raizes = categoriasProblema.filter((c) => c.paiId === null)
  const filhosDe = (paiId: string) => categoriasProblema.filter((c) => c.paiId === paiId)
  const selecionada = categoriasProblema.find((c) => c.id === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={id}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap outline-none select-none",
          "cursor-pointer transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          !selecionada && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selecionada?.nome ?? "Selecione uma categoria"}</span>
        <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-(--anchor-width)">
        {raizes.map((raiz) => {
          const filhos = filhosDe(raiz.id)
          if (filhos.length === 0) {
            return (
              <DropdownMenuItem key={raiz.id} onClick={() => onValueChange(raiz.id)}>
                {raiz.nome}
              </DropdownMenuItem>
            )
          }
          return (
            <DropdownMenuSub key={raiz.id}>
              <DropdownMenuSubTrigger>{raiz.nome}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {filhos.map((filho) => (
                  <DropdownMenuItem key={filho.id} onClick={() => onValueChange(filho.id)}>
                    {filho.nome}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
