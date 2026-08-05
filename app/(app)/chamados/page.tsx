"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { LayoutGrid, List, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FiltroBar } from "@/components/chamado/filtro-bar"
import { KanbanBoard } from "@/components/chamado/kanban-board"
import { TicketCard } from "@/components/chamado/ticket-card"
import { TicketRow } from "@/components/chamado/ticket-row"
import { empresaPorId, tickets as ticketsMock } from "@/lib/mock/data"
import { STATUS_META } from "@/lib/status"
import { STATUS_KEYS, type StatusKey, type Ticket } from "@/lib/types"

// Analista "logado" (mock, sem auth ainda). /chamados/meus redireciona
// para ?analista=eu e essa página traduz o sentinel para o id real.
const ANALISTA_LOGADO_ID = "u-joao"

function buildHref(searchParams: URLSearchParams, patch: Record<string, string>) {
  const params = new URLSearchParams(searchParams.toString())
  for (const [chave, valor] of Object.entries(patch)) {
    params.set(chave, valor)
  }
  return `?${params.toString()}`
}

function ChamadosContent() {
  const searchParams = useSearchParams()
  const [localTickets, setLocalTickets] = useState<Ticket[]>(ticketsMock)

  const view = searchParams.get("view") === "kanban" ? "kanban" : "lista"
  const empresaFiltro = searchParams.get("empresa")
  const analistaFiltro = searchParams.get("analista")
  const statusFiltro = searchParams.get("status") as StatusKey | null
  const prioridadeFiltro = searchParams.get("prioridade")

  const analistaIdEfetivo = analistaFiltro === "eu" ? ANALISTA_LOGADO_ID : analistaFiltro

  const filtrados = localTickets.filter((ticket) => {
    if (empresaFiltro && ticket.empresaId !== empresaFiltro) return false
    if (analistaIdEfetivo && ticket.analistaId !== analistaIdEfetivo) return false
    if (statusFiltro && ticket.statusKey !== statusFiltro) return false
    if (prioridadeFiltro && ticket.prioridade !== prioridadeFiltro) return false
    return true
  })

  const empresaSelecionada = empresaFiltro ? empresaPorId(empresaFiltro) : undefined
  const statusVisiveis = empresaSelecionada ? empresaSelecionada.statusAtivos : STATUS_KEYS
  const statusRotulos = empresaSelecionada ? empresaSelecionada.statusRotulos : undefined

  function handleStatusChange(numero: number, novoStatus: StatusKey) {
    setLocalTickets((prev) =>
      prev.map((ticket) => (ticket.numero === numero ? { ...ticket, statusKey: novoStatus } : ticket))
    )
    const rotulo = statusRotulos?.[novoStatus] ?? STATUS_META[novoStatus].rotuloPadrao
    toast.success(`Chamado #${numero} movido para "${rotulo}".`)
  }

  return (
    <div className="flex flex-col gap-(--space-4)">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Chamados</h1>
        <Button render={<Link href="/chamados/novo" />} nativeButton={false} className="cursor-pointer">
          <Plus data-icon="inline-start" />
          Novo chamado
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <FiltroBar />

        <div className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-muted p-[3px]">
          <Button
            size="sm"
            variant={view === "lista" ? "default" : "ghost"}
            render={<Link href={buildHref(searchParams, { view: "lista" })} scroll={false} />}
            nativeButton={false}
            className="cursor-pointer"
          >
            <List data-icon="inline-start" />
            Lista
          </Button>
          <Button
            size="sm"
            variant={view === "kanban" ? "default" : "ghost"}
            render={<Link href={buildHref(searchParams, { view: "kanban" })} scroll={false} />}
            nativeButton={false}
            className="cursor-pointer"
          >
            <LayoutGrid data-icon="inline-start" />
            Kanban
          </Button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhum chamado com esses filtros.</p>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/chamados" />}
            nativeButton={false}
            className="cursor-pointer"
          >
            Limpar filtros
          </Button>
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard
          tickets={filtrados}
          statusVisiveis={statusVisiveis}
          statusRotulos={statusRotulos}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-surface">
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Analista</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>SLA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((ticket) => (
                  <TicketRow key={ticket.numero} ticket={ticket} />
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-2 md:hidden">
            {filtrados.map((ticket) => (
              <TicketCard key={ticket.numero} ticket={ticket} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ChamadosSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-4)">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-36" />
      </div>
      <Skeleton className="h-8 w-full max-w-2xl" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    </div>
  )
}

export default function ChamadosPage() {
  return (
    <Suspense fallback={<ChamadosSkeleton />}>
      <ChamadosContent />
    </Suspense>
  )
}
