"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { LayoutGrid, List, Plus } from "lucide-react"
import { toast } from "sonner"

import { BulkActionBar } from "@/components/chamado/bulk-action-bar"
import { FiltroBar, FiltroChips } from "@/components/chamado/filtro-bar"
import { KanbanBoard } from "@/components/chamado/kanban-board"
import { useNovoChamado } from "@/components/chamado/novo-chamado-dialog"
import { TicketCard } from "@/components/chamado/ticket-card"
import { TicketPreviewSheet } from "@/components/chamado/ticket-preview-sheet"
import { TicketTable, type TicketSortField } from "@/components/chamado/ticket-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useEstadoSincronizado } from "@/lib/hooks/use-estado-sincronizado"
import { colunasDoKanban } from "@/lib/kanban/colunas"
import { useReferenceData } from "@/lib/reference-data/provider"
import { useRealtimeRefresh } from "@/lib/realtime/use-realtime-refresh"
import { calcularSeveridade } from "@/lib/sla-display"
import { useSlaClock } from "@/lib/sla-clock"
import { atribuirAnalista, definirPrioridade, mudarStatus } from "@/lib/tickets/actions"
import { PRIORIDADE_META, STATUS_META } from "@/lib/status"
import {
  STATUS_FINAIS,
  STATUS_KEYS,
  type CategoriaProblema,
  type Prioridade,
  type StatusKey,
  type Ticket,
  type Usuario,
} from "@/lib/types"

const PAGE_SIZE = 25

interface FiltrosAtivos {
  ticketNumero: string | null
  titulo: string | null
  solicitante: string | null
  empresa: string | null
  categoria: string | null
  analistaEfetivo: string | null
  sla: string | null
  criado: string | null
  status: StatusKey | null
  aberto: boolean
  semCategoria: boolean
  agora: Date | null
}

function ticketPassaFiltros(
  ticket: Ticket,
  f: FiltrosAtivos,
  categoriasProblema: CategoriaProblema[]
): boolean {
  if (f.ticketNumero && !ticket.numero.toString().includes(f.ticketNumero)) return false
  if (f.titulo && !ticket.titulo.toLowerCase().includes(f.titulo.toLowerCase())) return false
  if (f.solicitante && ticket.solicitanteId !== f.solicitante) return false
  if (f.empresa && ticket.empresaId !== f.empresa) return false

  if (f.categoria) {
    const categoria = categoriasProblema.find((c) => c.id === f.categoria)
    if (categoria && categoria.paiId === null) {
      const combina =
        ticket.catProblemaId === categoria.id ||
        categoriasProblema.find((c) => c.id === ticket.catProblemaId)?.paiId === categoria.id
      if (!combina) return false
    } else if (ticket.catProblemaId !== f.categoria) {
      return false
    }
  }

  if (f.analistaEfetivo && ticket.analistaId !== f.analistaEfetivo) return false
  if (f.status && ticket.statusKey !== f.status) return false
  if (f.aberto && STATUS_FINAIS.includes(ticket.statusKey)) return false
  if (f.semCategoria && ticket.catProblemaId !== null) return false

  if (f.sla && f.agora) {
    const severidade = calcularSeveridade(ticket.slaSolucaoVenceEm, ticket.statusKey, f.agora)
    const alvo = f.sla === "prestes" ? "critico" : f.sla
    if (severidade !== alvo) return false
  }

  if (f.criado && f.agora) {
    const diasDesdeCriacao = (f.agora.getTime() - new Date(ticket.criadoEm).getTime()) / 86_400_000
    if (f.criado === "24h" && diasDesdeCriacao > 1) return false
    if (f.criado === "7d" && diasDesdeCriacao > 7) return false
    if (f.criado === "30d" && diasDesdeCriacao > 30) return false
    if (f.criado === "mais30d" && diasDesdeCriacao <= 30) return false
  }

  return true
}

function compararTickets(
  a: Ticket,
  b: Ticket,
  sort: TicketSortField,
  categoriasProblema: CategoriaProblema[],
  usuarioPorId: (id: string | null | undefined) => Usuario | undefined,
  empresaPorId: (id: string | null | undefined) => { nome: string } | undefined
): number {
  switch (sort) {
    case "numero":
      return a.numero - b.numero
    case "solicitante":
      return (usuarioPorId(a.solicitanteId)?.nome ?? "").localeCompare(usuarioPorId(b.solicitanteId)?.nome ?? "")
    case "assunto":
      return a.titulo.localeCompare(b.titulo)
    case "cliente":
      return (empresaPorId(a.empresaId)?.nome ?? "").localeCompare(empresaPorId(b.empresaId)?.nome ?? "")
    case "categoria": {
      const rotulo = (t: Ticket) => categoriasProblema.find((c) => c.id === t.catProblemaId)?.nome ?? ""
      return rotulo(a).localeCompare(rotulo(b))
    }
    case "prioridade":
      return (
        (a.prioridade ? PRIORIDADE_META[a.prioridade].peso : 0) -
        (b.prioridade ? PRIORIDADE_META[b.prioridade].peso : 0)
      )
    case "status":
      return STATUS_KEYS.indexOf(a.statusKey) - STATUS_KEYS.indexOf(b.statusKey)
    case "operador":
      return (usuarioPorId(a.analistaId)?.nome ?? "").localeCompare(usuarioPorId(b.analistaId)?.nome ?? "")
    case "sla": {
      const valor = (t: Ticket) =>
        t.slaSolucaoVenceEm ? new Date(t.slaSolucaoVenceEm).getTime() : Number.POSITIVE_INFINITY
      return valor(a) - valor(b)
    }
    case "criado":
      return new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()
    default:
      return a.numero - b.numero
  }
}

function ChamadosContent({ tickets: ticketsIniciais }: { tickets: Ticket[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agora = useSlaClock()
  const { abrir: abrirNovoChamado } = useNovoChamado()
  const { usuarioAtual, usuarioPorId, empresaPorId, categoriasProblema } = useReferenceData()

  const [localTickets, setLocalTickets] = useEstadoSincronizado(ticketsIniciais)
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [timersAtivos, setTimersAtivos] = useState<Set<number>>(new Set())
  const [previewTicket, setPreviewTicket] = useState<Ticket | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Fila inteira já é escopada por RLS (analista vê tudo, solicitante só a
  // própria empresa) — sem filtro, então cobre qualquer mudança de status
  // feita por outra sessão (outro analista, ou o próprio solicitante).
  useRealtimeRefresh([{ tabela: "ticket" }])

  const view = searchParams.get("view") === "kanban" ? "kanban" : "lista"
  const empresaFiltro = searchParams.get("empresa")
  const analistaFiltro = searchParams.get("analista")
  const statusFiltro = searchParams.get("status") as StatusKey | null
  const ticketFiltro = searchParams.get("ticket")
  const assuntoFiltro = searchParams.get("assunto")
  const solicitanteFiltro = searchParams.get("solicitante")
  const categoriaFiltro = searchParams.get("categoria")
  const slaFiltro = searchParams.get("sla")
  const criadoFiltro = searchParams.get("criado")
  const abertoFiltro = searchParams.get("aberto") === "1"
  const semCategoriaFiltro = searchParams.get("semCategoria") === "1"
  const sort = (searchParams.get("sort") as TicketSortField | null) ?? "numero"
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc"
  const paginaSolicitada = Math.max(1, Number(searchParams.get("page") ?? "1") || 1)

  const analistaIdEfetivo = analistaFiltro === "eu" ? (usuarioAtual?.id ?? null) : analistaFiltro

  // `sla` e `criado` dependem de "agora" -- e "agora" só existe depois de
  // montar no cliente (useSlaClock, ver lib/sla-clock.tsx). Enquanto isso,
  // mostramos o esqueleto de carregamento em vez de filtrar com um relógio
  // ainda não disponível, evitando mismatch de hidratação.
  const precisaDoRelogio = Boolean(slaFiltro || criadoFiltro)
  const relogioPronto = !precisaDoRelogio || agora !== null

  const filtrados = relogioPronto
    ? localTickets.filter((ticket) =>
        ticketPassaFiltros(
          ticket,
          {
            ticketNumero: ticketFiltro,
            titulo: assuntoFiltro,
            solicitante: solicitanteFiltro,
            empresa: empresaFiltro,
            categoria: categoriaFiltro,
            analistaEfetivo: analistaIdEfetivo,
            sla: slaFiltro,
            criado: criadoFiltro,
            status: statusFiltro,
            aberto: abertoFiltro,
            semCategoria: semCategoriaFiltro,
            agora,
          },
          categoriasProblema
        )
      )
    : []

  const ordenados = [...filtrados].sort((a, b) => {
    const resultado = compararTickets(a, b, sort, categoriasProblema, usuarioPorId, empresaPorId)
    return dir === "asc" ? resultado : -resultado
  })

  const totalItens = ordenados.length
  const totalPaginas = Math.max(1, Math.ceil(totalItens / PAGE_SIZE))
  const paginaAtual = Math.min(paginaSolicitada, totalPaginas)
  const inicioIndice = (paginaAtual - 1) * PAGE_SIZE
  const paginaTickets = ordenados.slice(inicioIndice, inicioIndice + PAGE_SIZE)

  const empresaSelecionada = empresaFiltro ? empresaPorId(empresaFiltro) : undefined
  const statusRotulos = empresaSelecionada ? empresaSelecionada.statusRotulos : undefined
  const colunasKanban = colunasDoKanban(empresaSelecionada)

  function updateParam(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [chave, valor] of Object.entries(patch)) {
      if (valor === null) params.delete(chave)
      else params.set(chave, valor)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function buildHref(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [chave, valor] of Object.entries(patch)) {
      params.set(chave, valor)
    }
    return `?${params.toString()}`
  }

  function handleSort(field: TicketSortField) {
    if (sort === field) {
      updateParam({ dir: dir === "asc" ? "desc" : "asc" })
    } else {
      updateParam({ sort: field, dir: "asc" })
    }
  }

  function aplicarLocal(numero: number, patch: Partial<Ticket>) {
    setLocalTickets((prev) => prev.map((t) => (t.numero === numero ? { ...t, ...patch } : t)))
  }

  function handleStatusChange(numero: number, novoStatus: StatusKey) {
    const statusAnterior = localTickets.find((t) => t.numero === numero)?.statusKey
    aplicarLocal(numero, { statusKey: novoStatus })
    const rotulo = statusRotulos?.[novoStatus] ?? STATUS_META[novoStatus].rotuloPadrao
    mudarStatus(numero, novoStatus)
      .then(() => toast.success(`Chamado #${numero} movido para "${rotulo}".`))
      .catch(() => {
        // Reverte o card pra coluna original — sem isso, uma gravação que
        // falha deixa o kanban mentindo sobre o status até o próximo refresh.
        if (statusAnterior) aplicarLocal(numero, { statusKey: statusAnterior })
        toast.error(`Não foi possível mover o chamado #${numero}.`)
      })
  }

  function handleQuickEditChange(
    numero: number,
    patch: Partial<Pick<Ticket, "statusKey" | "prioridade" | "analistaId">>
  ) {
    aplicarLocal(numero, patch)

    if (patch.statusKey) {
      mudarStatus(numero, patch.statusKey)
        .then(() =>
          toast.success(`Chamado #${numero}: status alterado para "${STATUS_META[patch.statusKey!].rotuloPadrao}".`)
        )
        .catch(() => toast.error(`Não foi possível mudar o status do chamado #${numero}.`))
    }
    if ("prioridade" in patch && patch.prioridade) {
      definirPrioridade(numero, patch.prioridade)
        .then(() =>
          toast.success(`Chamado #${numero}: prioridade definida como "${PRIORIDADE_META[patch.prioridade!].rotulo}".`)
        )
        .catch(() => toast.error(`Não foi possível mudar a prioridade do chamado #${numero}.`))
    }
    if ("analistaId" in patch) {
      const nome = usuarioPorId(patch.analistaId ?? null)?.nome
      atribuirAnalista(numero, patch.analistaId ?? null)
        .then(() =>
          toast.success(nome ? `Chamado #${numero} atribuído a ${nome}.` : `Chamado #${numero}: atribuição removida.`)
        )
        .catch(() => toast.error(`Não foi possível reatribuir o chamado #${numero}.`))
    }
  }

  // Apontamento de horas (timer) é Fase 4 na spec — ainda sem persistência,
  // fica só de estado local por enquanto.
  function handleToggleTimer(ticket: Ticket) {
    setTimersAtivos((prev) => {
      const proximo = new Set(prev)
      if (proximo.has(ticket.numero)) {
        proximo.delete(ticket.numero)
        toast.info(`Apontamento pausado no chamado #${ticket.numero}.`)
      } else {
        proximo.add(ticket.numero)
        toast.success(`Apontamento iniciado no chamado #${ticket.numero}.`)
      }
      return proximo
    })
  }

  function handlePreview(ticket: Ticket) {
    setPreviewTicket(ticket)
    setPreviewOpen(true)
  }

  function handleToggleSelect(numero: number) {
    setSelecionados((prev) => {
      const proximo = new Set(prev)
      if (proximo.has(numero)) proximo.delete(numero)
      else proximo.add(numero)
      return proximo
    })
  }

  function handleToggleSelectAll() {
    setSelecionados((prev) => {
      const todasSelecionadas = paginaTickets.length > 0 && paginaTickets.every((t) => prev.has(t.numero))
      const proximo = new Set(prev)
      for (const t of paginaTickets) {
        if (todasSelecionadas) proximo.delete(t.numero)
        else proximo.add(t.numero)
      }
      return proximo
    })
  }

  function handleBulkAssign(analistaId: string) {
    const nome = usuarioPorId(analistaId)?.nome ?? analistaId
    const numeros = [...selecionados]
    setLocalTickets((prev) => prev.map((t) => (selecionados.has(t.numero) ? { ...t, analistaId } : t)))
    Promise.all(numeros.map((n) => atribuirAnalista(n, analistaId)))
      .then(() => toast.success(`${numeros.length} chamado(s) atribuído(s) a ${nome}.`))
      .catch(() => toast.error("Não foi possível atribuir todos os chamados selecionados."))
    setSelecionados(new Set())
  }

  function handleBulkStatus(status: StatusKey) {
    const numeros = [...selecionados]
    setLocalTickets((prev) => prev.map((t) => (selecionados.has(t.numero) ? { ...t, statusKey: status } : t)))
    Promise.all(numeros.map((n) => mudarStatus(n, status)))
      .then(() => toast.success(`${numeros.length} chamado(s) movido(s) para "${STATUS_META[status].rotuloPadrao}".`))
      .catch(() => toast.error("Não foi possível mudar o status de todos os chamados selecionados."))
    setSelecionados(new Set())
  }

  function handleBulkPrioridade(prioridade: Prioridade) {
    const numeros = [...selecionados]
    setLocalTickets((prev) => prev.map((t) => (selecionados.has(t.numero) ? { ...t, prioridade } : t)))
    Promise.all(numeros.map((n) => definirPrioridade(n, prioridade)))
      .then(() =>
        toast.success(`${numeros.length} chamado(s) com prioridade "${PRIORIDADE_META[prioridade].rotulo}".`)
      )
      .catch(() => toast.error("Não foi possível mudar a prioridade de todos os chamados selecionados."))
    setSelecionados(new Set())
  }

  return (
    <div className="flex flex-col gap-(--space-4) pb-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Chamados</h1>
        <Button type="button" className="cursor-pointer" onClick={abrirNovoChamado}>
          <Plus data-icon="inline-start" />
          Novo chamado
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <FiltroBar />
          <FiltroChips />
        </div>

        <div className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-muted p-[3px]">
          <Button
            size="sm"
            variant={view === "lista" ? "default" : "ghost"}
            render={<Link href={buildHref({ view: "lista" })} scroll={false} />}
            nativeButton={false}
            className="cursor-pointer"
          >
            <List data-icon="inline-start" />
            Lista
          </Button>
          <Button
            size="sm"
            variant={view === "kanban" ? "default" : "ghost"}
            render={<Link href={buildHref({ view: "kanban" })} scroll={false} />}
            nativeButton={false}
            className="cursor-pointer"
          >
            <LayoutGrid data-icon="inline-start" />
            Kanban
          </Button>
        </div>
      </div>

      {!relogioPronto ? (
        <ChamadosSkeleton />
      ) : totalItens === 0 ? (
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
          colunas={colunasKanban}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <TicketTable
              tickets={paginaTickets}
              sort={sort}
              dir={dir}
              onSort={handleSort}
              statusRotulos={statusRotulos}
              selected={selecionados}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onPreview={handlePreview}
              onQuickEditChange={handleQuickEditChange}
              runningTimers={timersAtivos}
              onToggleTimer={handleToggleTimer}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                Mostrando {totalItens === 0 ? 0 : inicioIndice + 1} a{" "}
                {Math.min(inicioIndice + PAGE_SIZE, totalItens)} de {totalItens} itens
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={paginaAtual <= 1}
                  onClick={() => updateParam({ page: String(paginaAtual - 1) })}
                >
                  Anterior
                </Button>
                <span className="font-tabular px-1">
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={paginaAtual >= totalPaginas}
                  onClick={() => updateParam({ page: String(paginaAtual + 1) })}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:hidden">
            {paginaTickets.map((ticket) => (
              <TicketCard key={ticket.numero} ticket={ticket} />
            ))}
          </div>
        </>
      )}

      <BulkActionBar
        count={selecionados.size}
        onClear={() => setSelecionados(new Set())}
        onAssign={handleBulkAssign}
        onStatus={handleBulkStatus}
        onPrioridade={handleBulkPrioridade}
      />

      <TicketPreviewSheet ticket={previewTicket} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  )
}

function ChamadosSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-(--row-h) w-full" />
      ))}
    </div>
  )
}

function ChamadosPageSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-4)">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-36" />
      </div>
      <Skeleton className="h-8 w-full max-w-2xl" />
      <ChamadosSkeleton />
    </div>
  )
}

export function ChamadosClient({ tickets }: { tickets: Ticket[] }) {
  return (
    <Suspense fallback={<ChamadosPageSkeleton />}>
      <ChamadosContent tickets={tickets} />
    </Suspense>
  )
}
