"use client"

import Link from "next/link"

import { SlaProgress } from "@/components/chamado/sla-progress"
import { StatusBadge } from "@/components/chamado/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useReferenceData } from "@/lib/reference-data/provider"
import { STATUS_META } from "@/lib/status"
import type { Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TicketCardProps {
  ticket: Ticket
  href?: string
  className?: string
  // Selo do status real — só faz sentido quando o card é renderizado fora
  // da coluna do próprio status (hoje: coluna derivada "Última interação
  // do cliente" do Kanban), onde o status não é óbvio pelo contexto.
  mostrarSeloStatus?: boolean
}

// Serve duas telas: coluna do kanban e lista em mobile (a tabela vira
// cards abaixo de 768px — ver seção de responsividade do design).
// `href` tem default para a rota do analista; o portal do cliente passa
// `/portal/chamados/{numero}` para não vazar o solicitante para a tela interna.
// Campos de referência (Milvus): #numero – cliente, avatar do operador,
// título em uma linha, duas mini-barras de SLA, data de criação. Sem
// prioridade, sem nome por extenso do analista/solicitante — ver
// openspec/specs/kanban-atendimento (Requirement: Card do Kanban exibe
// apenas os campos de referência).
export function TicketCard({ ticket, href, className, mostrarSeloStatus }: TicketCardProps) {
  const { empresaPorId, usuarioPorId } = useReferenceData()
  const empresa = empresaPorId(ticket.empresaId)
  const analista = usuarioPorId(ticket.analistaId)
  const corStatus = `var(--${STATUS_META[ticket.statusKey].colorVarFg})`
  const dataCriacao = new Date(ticket.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })

  return (
    <Link
      href={href ?? `/chamados/${ticket.numero}`}
      // Kanban é só visualização — sem arrastar. Âncora HTML é arrastável
      // por padrão; desligar evita o "fantasma" de arrasto nativo do link.
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      className={cn(
        "flex flex-col gap-2 rounded-md border border-border p-(--card-pad) text-sm shadow-sm transition-colors hover:border-primary/40",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-tabular text-xs font-semibold" style={{ color: corStatus }}>
          #{ticket.numero} – {empresa?.nome}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {mostrarSeloStatus && <StatusBadge statusKey={ticket.statusKey} className="h-5 px-1.5" />}
          <Avatar size="sm" title={analista?.nome ?? "Não atribuído"}>
            <AvatarFallback>{analista?.avatarIniciais ?? "?"}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <p className="line-clamp-1 font-medium text-foreground">{ticket.titulo}</p>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <SlaProgress rotulo="Resposta" ticket={ticket} tipo="resposta" />
        <SlaProgress rotulo="Solução" ticket={ticket} tipo="solucao" />
      </div>
      <span className="self-end font-tabular text-xs text-muted-foreground">{dataCriacao}</span>
    </Link>
  )
}
