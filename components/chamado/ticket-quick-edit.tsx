"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usuarios } from "@/lib/mock/data"
import { PRIORIDADE_META, STATUS_META } from "@/lib/status"
import {
  PRIORIDADES,
  STATUS_KEYS,
  type Prioridade,
  type StatusKey,
  type Ticket,
} from "@/lib/types"
import { cn } from "@/lib/utils"

const SEM_PRIORIDADE = "sem_prioridade"
const SEM_ANALISTA = "sem_analista"

const analistas = usuarios.filter((u) => u.papel === "analista")

interface TicketQuickEditProps {
  ticket: Ticket
  onChange: (
    numero: number,
    patch: Partial<Pick<Ticket, "statusKey" | "prioridade" | "analistaId">>
  ) => void
}

// Edição rápida direto na fila, sem sair da listagem para abrir o chamado
// completo. Três grupos de rádio dentro de um único menu — em vez de 3
// <Select> aninhados dentro do popover, que combina mal com o base-ui
// (Select dentro de Menu aberto disputa foco/portal). O pai (ticket-table
// via chamados/page.tsx) é quem atualiza o estado e dispara o toast, igual
// ao padrão já usado em chamados/[numero]/page.tsx.
export function TicketQuickEdit({ ticket, onChange }: TicketQuickEditProps) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={`Edição rápida do chamado #${ticket.numero}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "cursor-pointer")}
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={ticket.statusKey}
          onValueChange={(value) => onChange(ticket.numero, { statusKey: value as StatusKey })}
        >
          {STATUS_KEYS.map((key) => (
            <DropdownMenuRadioItem key={key} value={key} className="cursor-pointer">
              {STATUS_META[key].rotuloPadrao}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Prioridade</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={ticket.prioridade ?? SEM_PRIORIDADE}
          onValueChange={(value) =>
            onChange(ticket.numero, {
              prioridade: value === SEM_PRIORIDADE ? null : (value as Prioridade),
            })
          }
        >
          <DropdownMenuRadioItem value={SEM_PRIORIDADE} className="cursor-pointer">
            Sem prioridade
          </DropdownMenuRadioItem>
          {PRIORIDADES.map((p) => (
            <DropdownMenuRadioItem key={p} value={p} className="cursor-pointer">
              {PRIORIDADE_META[p].rotulo}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Operador</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={ticket.analistaId ?? SEM_ANALISTA}
          onValueChange={(value) =>
            onChange(ticket.numero, {
              analistaId: value === SEM_ANALISTA ? null : (value as string),
            })
          }
        >
          <DropdownMenuRadioItem value={SEM_ANALISTA} className="cursor-pointer">
            Não atribuído
          </DropdownMenuRadioItem>
          {analistas.map((a) => (
            <DropdownMenuRadioItem key={a.id} value={a.id} className="cursor-pointer">
              {a.nome}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
