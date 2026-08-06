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
import { categoriasProblema, empresaPorId, tickets as ticketsMock, usuarioPorId } from "@/lib/mock/data"
import { calcularSeveridade } from "@/lib/sla-display"
import { useSlaClock } from "@/lib/sla-clock"
import { PRIORIDADE_META, STATUS_META } from "@/lib/status"
import {
  STATUS_FINAIS,
  STATUS_KEYS,
  type Prioridade,
  type StatusKey,
  type Ticket,
} from "@/lib/types"

// Analista "logado" (mock, sem auth ainda). /chamados/meus redireciona
// para ?analista=eu e essa página traduz o sentinel para o id real.
const ANALISTA_LOGADO_ID = "u-joao"

const PAGE_SIZE = 25

interface FiltrosAtivos {
  ticketNumero: string | null
  assunto: string | null
  solicitante: string | null
  empresa: string | null
  categoria: string | null
  analistaEfetivo: string | null
  mesa: string | null
  sla: string | null
  criado: string | null
  status: StatusKey | null
  aberto: boolean
  semCategoria: boolean
  agora: Date | null
}

// Filtro central usado pela listagem. Reúne os 8 filtros da FiltroBar com
// os parâmetros só-de-URL que o dashboard usa para linkar aqui (status,
// aberto, semCategoria — ver contrato descrito no CLAUDE.md da tarefa).
// `sla` e `analista=eu` já são compartilhados 1:1 com os links do
// dashboard, sem precisar de tradução.
function ticketPassaFiltros(ticket: Ticket, f: FiltrosAtivos): boolean {
  if (f.ticketNumero && !ticket.numero.toString().includes(f.ticketNumero)) return false
  if (f.assunto && !ticket.assunto.toLowerCase().includes(f.assunto.toLowerCase())) return false
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
  if (f.mesa && ticket.mesa !== f.mesa) return false
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

function compararTickets(a: Ticket, b: Ticket, sort: TicketSortField): number {
  switch (sort) {
    case "numero":
      return a.numero - b.numero
    case "solicitante":
      return (usuarioPorId(a.solicitanteId)?.nome ?? "").localeCompare(usuarioPorId(b.solicitanteId)?.nome ?? "")
    case "assunto":
      return a.assunto.localeCompare(b.assunto)
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

function ChamadosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agora = useSlaClock()
  const { abrir: abrirNovoChamado } = useNovoChamado()

  const [localTickets, setLocalTickets] = useState<Ticket[]>(ticketsMock)
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [timersAtivos, setTimersAtivos] = useState<Set<number>>(new Set())
  const [previewTicket, setPreviewTicket] = useState<Ticket | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const view = searchParams.get("view") === "kanban" ? "kanban" : "lista"
  const empresaFiltro = searchParams.get("empresa")
  const analistaFiltro = searchParams.get("analista")
  const statusFiltro = searchParams.get("status") as StatusKey | null
  const ticketFiltro = searchParams.get("ticket")
  const assuntoFiltro = searchParams.get("assunto")
  const solicitanteFiltro = searchParams.get("solicitante")
  const categoriaFiltro = searchParams.get("categoria")
  const mesaFiltro = searchParams.get("mesa")
  const slaFiltro = searchParams.get("sla")
  const criadoFiltro = searchParams.get("criado")
  const abertoFiltro = searchParams.get("aberto") === "1"
  const semCategoriaFiltro = searchParams.get("semCategoria") === "1"
  const sort = (searchParams.get("sort") as TicketSortField | null) ?? "numero"
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc"
  const paginaSolicitada = Math.max(1, Number(searchParams.get("page") ?? "1") || 1)

  const analistaIdEfetivo = analistaFiltro === "eu" ? ANALISTA_LOGADO_ID : analistaFiltro

  // `sla` e `criado` dependem de "agora" -- e "agora" só existe depois de
  // montar no cliente (useSlaClock, ver lib/sla-clock.tsx). Enquanto isso,
  // mostramos o esqueleto de carregamento em vez de filtrar com um relógio
  // ainda não disponível, evitando mismatch de hidratação.
  const precisaDoRelogio = Boolean(slaFiltro || criadoFiltro)
  const relogioPronto = !precisaDoRelogio || agora !== null

  const filtrados = relogioPronto
    ? localTickets.filter((ticket) =>
        ticketPassaFiltros(ticket, {
          ticketNumero: ticketFiltro,
          assunto: assuntoFiltro,
          solicitante: solicitanteFiltro,
          empresa: empresaFiltro,
          categoria: categoriaFiltro,
          analistaEfetivo: analistaIdEfetivo,
          mesa: mesaFiltro,
          sla: slaFiltro,
          criado: criadoFiltro,
          status: statusFiltro,
          aberto: abertoFiltro,
          semCategoria: semCategoriaFiltro,
          agora,
        })
      )
    : []

  const ordenados = [...filtrados].sort((a, b) => {
    const resultado = compararTickets(a, b, sort)
    return dir === "asc" ? resultado : -resultado
  })

  const totalItens = ordenados.length
  const totalPaginas = Math.max(1, Math.ceil(totalItens / PAGE_SIZE))
  const paginaAtual = Math.min(paginaSolicitada, totalPaginas)
  const inicioIndice = (paginaAtual - 1) * PAGE_SIZE
  const paginaTickets = ordenados.slice(inicioIndice, inicioIndice + PAGE_SIZE)

  const empresaSelecionada = empresaFiltro ? empresaPorId(empresaFiltro) : undefined
  const statusVisiveis = empresaSelecionada ? empresaSelecionada.statusAtivos : STATUS_KEYS
  const statusRotulos = empresaSelecionada ? empresaSelecionada.statusRotulos : undefined

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

  function handleStatusChange(numero: number, novoStatus: StatusKey) {
    setLocalTickets((prev) => prev.map((t) => (t.numero === numero ? { ...t, statusKey: novoStatus } : t)))
    const rotulo = statusRotulos?.[novoStatus] ?? STATUS_META[novoStatus].rotuloPadrao
    toast.success(`Chamado #${numero} movido para "${rotulo}".`)
  }

  function handleQuickEditChange(
    numero: number,
    patch: Partial<Pick<Ticket, "statusKey" | "prioridade" | "analistaId">>
  ) {
    setLocalTickets((prev) => prev.map((t) => (t.numero === numero ? { ...t, ...patch } : t)))
    if (patch.statusKey) {
      toast.success(`Chamado #${numero}: status alterado para "${STATUS_META[patch.statusKey].rotuloPadrao}".`)
    }
    if ("prioridade" in patch) {
      toast.success(
        patch.prioridade
          ? `Chamado #${numero}: prioridade definida como "${PRIORIDADE_META[patch.prioridade].rotulo}".`
          : `Chamado #${numero}: prioridade removida.`
      )
    }
    if ("analistaId" in patch) {
      const nome = usuarioPorId(patch.analistaId ?? null)?.nome
      toast.success(nome ? `Chamado #${numero} atribuído a ${nome}.` : `Chamado #${numero}: atribuição removida.`)
    }
  }

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
    const quantidade = selecionados.size
    setLocalTickets((prev) => prev.map((t) => (selecionados.has(t.numero) ? { ...t, analistaId } : t)))
    toast.success(`${quantidade} chamado(s) atribuído(s) a ${nome}.`)
    setSelecionados(new Set())
  }

  function handleBulkStatus(status: StatusKey) {
    const quantidade = selecionados.size
    setLocalTickets((prev) => prev.map((t) => (selecionados.has(t.numero) ? { ...t, statusKey: status } : t)))
    toast.success(`${quantidade} chamado(s) movido(s) para "${STATUS_META[status].rotuloPadrao}".`)
    setSelecionados(new Set())
  }

  function handleBulkPrioridade(prioridade: Prioridade) {
    const quantidade = selecionados.size
    setLocalTickets((prev) => prev.map((t) => (selecionados.has(t.numero) ? { ...t, prioridade } : t)))
    toast.success(`${quantidade} chamado(s) com prioridade "${PRIORIDADE_META[prioridade].rotulo}".`)
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
          statusVisiveis={statusVisiveis}
          statusRotulos={statusRotulos}
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

export default function ChamadosPage() {
  return (
    <Suspense fallback={<ChamadosPageSkeleton />}>
      <ChamadosContent />
    </Suspense>
  )
}
