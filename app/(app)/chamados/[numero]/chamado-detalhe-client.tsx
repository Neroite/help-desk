"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Calendar,
  Check,
  GitMerge,
  Link2,
  MessageSquarePlus,
  Network,
  Paperclip,
  Pause,
  Play,
  Plus,
  Printer,
  X,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { AnexoList } from "@/components/chamado/anexo-list"
import { ApontamentoHoras } from "@/components/chamado/apontamento-horas"
import { ApontamentoHorasDialog } from "@/components/chamado/apontamento-horas-dialog"
import { AvaliacaoEstrelas } from "@/components/chamado/avaliacao-estrelas"
import { CategoriaAtendimentoSelect } from "@/components/chamado/categoria-atendimento-select"
import { CategoriaProblemaSelect } from "@/components/chamado/categoria-problema-select"
import { ComentarioComposer } from "@/components/chamado/comentario-composer"
import { ConciliarDialog } from "@/components/chamado/conciliar-dialog"
import { CriarTicketFilhoDialog } from "@/components/chamado/criar-ticket-filho-dialog"
import { NovoComentarioDialog } from "@/components/chamado/novo-comentario-dialog"
import { StatusBadge } from "@/components/chamado/status-badge"
import { PausarDialog } from "@/components/chamado/pausar-dialog"
import { SlaBadge } from "@/components/chamado/sla-badge"
import { SlaProgress } from "@/components/chamado/sla-progress"
import { TicketTimeline, type FiltroTimeline } from "@/components/chamado/ticket-timeline"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEstadoSincronizado } from "@/lib/hooks/use-estado-sincronizado"
import { useReferenceData } from "@/lib/reference-data/provider"
import { useRealtimeRefresh } from "@/lib/realtime/use-realtime-refresh"
import {
  adicionarComentario,
  adicionarContato,
  definirCategorias,
  definirMesa,
  definirPrioridade,
  iniciarAtendimento,
  mudarStatus,
  removerContato,
  retomarChamado,
} from "@/lib/tickets/actions"
import { PRIORIDADE_META, STATUS_META } from "@/lib/status"
import {
  PRIORIDADES,
  STATUS_FINAIS,
  STATUS_KEYS,
  type Anexo,
  type ApontamentoHoras as ApontamentoHorasItem,
  type Avaliacao,
  type Comentario,
  type Prioridade,
  type StatusKey,
  type Ticket,
  type TicketContato,
  type TicketEvento,
  type TicketFilho,
  type TicketVisualizacao,
} from "@/lib/types"
import { cn } from "@/lib/utils"

// Sentinela de valor pra representar "sem prioridade" dentro do Select --
// o componente base-ui nao aceita item com value="" nem value=null.
const SEM_PRIORIDADE = "sem_prioridade"
const SEM_MESA = "sem_mesa"

const ABAS_MOBILE = ["timeline", "horas", "detalhes"] as const
type AbaMobile = (typeof ABAS_MOBILE)[number]

function ehAbaMobile(valor: string | null): valor is AbaMobile {
  return valor !== null && (ABAS_MOBILE as readonly string[]).includes(valor)
}

function formatarData(iso: string) {
  // timeZone fixo (não o do runtime) — sem isso, servidor e cliente podem
  // rodar em fusos diferentes e gerar textos diferentes, quebrando a
  // hidratação (já aconteceu neste componente, ver globals.css/sla-clock.tsx
  // pro mesmo cuidado com "agora").
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

function formatarHorasMinutos(totalMinutos: number) {
  const horas = Math.floor(totalMinutos / 60)
  const minutos = totalMinutos % 60
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`
}

interface AcaoToolbarProps {
  icon: LucideIcon
  rotulo: string
  onClick: () => void
  tone?: "verde" | "vermelho" | "azul" | "preto"
}

const TONE_CLASSES: Record<NonNullable<AcaoToolbarProps["tone"]>, string> = {
  azul: "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-700 hover:text-white",
  verde: "border-transparent bg-green-600 text-white hover:border-transparent hover:bg-green-700 hover:text-white",
  vermelho: "border-transparent bg-red-600 text-white hover:border-transparent hover:bg-red-700 hover:text-white",
  preto: "border-transparent bg-neutral-900 text-white hover:border-transparent hover:bg-neutral-800 hover:text-white",
}

function AcaoToolbar({ icon: Icon, rotulo, onClick, tone }: AcaoToolbarProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={rotulo}
        onClick={onClick}
        className={cn(
          "flex size-8 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring",
          tone ? TONE_CLASSES[tone] : "hover:border-primary/40 hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{rotulo}</TooltipContent>
    </Tooltip>
  )
}

interface FiltroPillProps {
  rotulo: string
  contador?: number
  ativo?: boolean
  interativo?: boolean
  onClick: () => void
}

function FiltroPill({ rotulo, contador, ativo = false, interativo = false, onClick }: FiltroPillProps) {
  return (
    <button
      type="button"
      aria-pressed={interativo ? ativo : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-ring",
        ativo
          ? "border-primary bg-primary/10 font-semibold text-primary"
          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
      )}
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

interface ChamadoDetalheClientProps {
  ticket: Ticket
  comentarios: Comentario[]
  eventos: TicketEvento[]
  apontamentos: ApontamentoHorasItem[]
  anexos: Anexo[]
  avaliacao: Avaliacao | null
  timerAberto: ApontamentoHorasItem | null
  filhos: TicketFilho[]
  contatos: TicketContato[]
  visualizacoes: TicketVisualizacao[]
}

export function ChamadoDetalheClient({
  ticket,
  comentarios,
  eventos,
  apontamentos,
  anexos,
  avaliacao,
  timerAberto,
  filhos,
  contatos,
  visualizacoes,
}: ChamadoDetalheClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { empresaPorId, usuarioPorId, usuarioAtual, mesaPorId, usuarios, mesasTrabalho } = useReferenceData()

  const empresa = empresaPorId(ticket.empresaId)
  const analista = usuarioPorId(ticket.analistaId)
  const solicitante = usuarioPorId(ticket.solicitanteId)
  const mesa = mesaPorId(ticket.mesaId)

  const [statusKey, setStatusKey] = useEstadoSincronizado(ticket.statusKey)
  // SlaProgress/SlaBadge precisam do ticket inteiro (pausa, minutos
  // pausados, encerramento) mas o status exibido pode estar à frente do
  // `ticket` original por causa do update otimista acima.
  const ticketParaSla = { ...ticket, statusKey }
  const [prioridade, setPrioridade] = useEstadoSincronizado(ticket.prioridade)
  const [catAtendimentoId, setCatAtendimentoId] = useEstadoSincronizado(ticket.catAtendimentoId ?? "")
  const [catProblemaId, setCatProblemaId] = useEstadoSincronizado(ticket.catProblemaId ?? "")
  const [comentariosState, setComentariosState] = useEstadoSincronizado(comentarios)
  const [timelineFiltro, setTimelineFiltro] = useState<FiltroTimeline>("todos")
  const [pausarAberto, setPausarAberto] = useState(false)
  const [novoComentarioAberto, setNovoComentarioAberto] = useState(false)
  const [horasDialogAberto, setHorasDialogAberto] = useState(false)
  const [novoFilhoAberto, setNovoFilhoAberto] = useState(false)
  const [conciliarAberto, setConciliarAberto] = useState(false)
  const [novoContatoId, setNovoContatoId] = useState("")

  // Sem filtro por linha (ver comentário em use-realtime-refresh.ts): avisa
  // em qualquer mudança de ticket/comentário/evento, não só a deste
  // chamado. A RLS de `comentario_select` já barra nota interna pra quem
  // não é staff antes do refresh buscar dado novo.
  useRealtimeRefresh([{ tabela: "ticket" }, { tabela: "comentario" }, { tabela: "ticket_evento" }])

  // Aba mobile (< 768px) sincronizada via ?tab= -- volta pra "timeline" se
  // o param não existir ou for inválido. Mesmo padrão de URL-como-estado
  // usado em FiltroBar (useSearchParams + router.push relativo).
  const tabParam = searchParams.get("tab")
  const abaAtiva: AbaMobile = ehAbaMobile(tabParam) ? tabParam : "timeline"

  function handleAbaChange(value: string) {
    if (!ehAbaMobile(value)) return
    const params = new URLSearchParams(searchParams.toString())
    if (value === "timeline") {
      params.delete("tab")
    } else {
      params.set("tab", value)
    }
    const query = params.toString()
    router.push(query ? `?${query}` : "?", { scroll: false })
  }

  // "Em andamento" tem dois caminhos conforme o status atual: retomar (vindo
  // de pausado, destrava o SLA) ou iniciar (primeira vez, ou vindo de
  // aguardando aprovação). "Pausado" nunca muda status direto -- sempre
  // abre o diálogo de motivo. Os demais status continuam no mudarStatus
  // genérico de sempre.
  function handleStatusChange(value: StatusKey | null) {
    if (!value) return

    if (value === "pausado") {
      setPausarAberto(true)
      return
    }
    if (value === "em_andamento") {
      if (statusKey === "pausado") handleRetomar()
      else handleIniciarAtendimento()
      return
    }

    const anterior = statusKey
    setStatusKey(value)
    mudarStatus(ticket.numero, value)
      .then(() => {
        toast.success(`Status alterado para "${STATUS_META[value].rotuloPadrao}"`)
        router.refresh()
      })
      .catch(() => {
        setStatusKey(anterior)
        toast.error("Não foi possível mudar o status.")
      })
  }

  function handleIniciarAtendimento() {
    iniciarAtendimento(ticket.numero, usuarioAtual?.id ?? null)
      .then(() => {
        toast.success("Atendimento iniciado")
        router.refresh()
      })
      .catch(() => toast.error("Não foi possível iniciar o atendimento."))
  }

  function handleRetomar() {
    retomarChamado(ticket.numero)
      .then(() => {
        toast.success("Atendimento retomado")
        router.refresh()
      })
      .catch(() => toast.error("Não foi possível retomar o atendimento."))
  }

  function handlePausarSucesso() {
    toast.success("Chamado pausado")
    router.refresh()
  }

  function handleCategoriasChange(novoAtendimento: string, novoProblema: string) {
    const atendimentoAnterior = catAtendimentoId
    const problemaAnterior = catProblemaId
    setCatAtendimentoId(novoAtendimento)
    setCatProblemaId(novoProblema)
    definirCategorias(ticket.numero, novoAtendimento || null, novoProblema || null)
      .then(() => {
        toast.success("Categorias atualizadas")
        router.refresh()
      })
      .catch(() => {
        setCatAtendimentoId(atendimentoAnterior)
        setCatProblemaId(problemaAnterior)
        toast.error("Não foi possível atualizar as categorias.")
      })
  }

  function handlePrioridadeChange(value: string | null) {
    const novaPrioridade = !value || value === SEM_PRIORIDADE ? null : (value as Prioridade)
    const anterior = prioridade
    setPrioridade(novaPrioridade)
    if (!novaPrioridade) return // remover prioridade não tem regra de SLA definida na spec — só local
    definirPrioridade(ticket.numero, novaPrioridade)
      .then(() => {
        toast.success(`Prioridade definida como "${PRIORIDADE_META[novaPrioridade].rotulo}"`)
        router.refresh()
      })
      .catch(() => {
        setPrioridade(anterior)
        toast.error("Não foi possível mudar a prioridade.")
      })
  }

  function handleEnviarComentario(corpo: string, interno: boolean) {
    const novoComentario: Comentario = {
      id: `local-${Date.now()}`,
      ticketId: ticket.numero,
      autorId: usuarioAtual?.id ?? "",
      corpo,
      interno,
      criadoEm: new Date().toISOString(),
    }
    setComentariosState((atual) => [...atual, novoComentario])
    adicionarComentario({ ticketNumero: ticket.numero, corpo, interno })
      .then(() => toast.success(interno ? "Nota interna registrada" : "Resposta enviada ao solicitante"))
      .catch(() => {
        setComentariosState((atual) => atual.filter((c) => c.id !== novoComentario.id))
        toast.error("Não foi possível enviar o comentário.")
      })
  }

  function alternarFiltro(valor: FiltroTimeline) {
    setTimelineFiltro((atual) => (atual === valor ? "todos" : valor))
  }

  function handleAdicionarContato() {
    if (!novoContatoId) return
    adicionarContato(ticket.numero, novoContatoId)
      .then(() => {
        toast.success("Contato adicionado")
        setNovoContatoId("")
        router.refresh()
      })
      .catch(() => toast.error("Não foi possível adicionar o contato."))
  }

  function handleRemoverContato(usuarioId: string) {
    removerContato(ticket.numero, usuarioId)
      .then(() => {
        toast.success("Contato removido")
        router.refresh()
      })
      .catch(() => toast.error("Não foi possível remover o contato."))
  }

  function handleDefinirMesa(mesaId: string | null) {
    definirMesa(ticket.numero, !mesaId || mesaId === SEM_MESA ? null : mesaId)
      .then(() => router.refresh())
      .catch(() => toast.error("Não foi possível definir a mesa de trabalho."))
  }

  // Timer em aberto ainda não tem duração fechada — só soma o que encerrou.
  const totalMinutosApontados = apontamentos.reduce((soma, a) => soma + (a.minutos ?? 0), 0)

  const horasSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-horas">
      <h2 id="secao-horas" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Horas
      </h2>
      <ApontamentoHoras
        ticketNumero={ticket.numero}
        apontamentos={apontamentos}
        timerAberto={timerAberto}
      />
    </section>
  )

  const anexosSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-anexos">
      <div className="flex items-center justify-between">
        <h2 id="secao-anexos" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Anexos
        </h2>
        <span className="font-tabular text-xs text-muted-foreground">{anexos.length}</span>
      </div>
      <AnexoList anexos={anexos} ticketNumero={ticket.numero} />
    </section>
  )

  const categoriasSection = (
    <section className="flex flex-col gap-(--space-3)" aria-labelledby="secao-categorias">
      <h2 id="secao-categorias" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Categorias
      </h2>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="detalhe-cat-atendimento" className="text-xs text-muted-foreground">
          Atendimento
        </label>
        <CategoriaAtendimentoSelect
          id="detalhe-cat-atendimento"
          value={catAtendimentoId}
          onValueChange={(value) => handleCategoriasChange(value, catProblemaId)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="detalhe-cat-problema" className="text-xs text-muted-foreground">
          Problema
        </label>
        <CategoriaProblemaSelect
          id="detalhe-cat-problema"
          value={catProblemaId}
          onValueChange={(value) => handleCategoriasChange(catAtendimentoId, value)}
        />
      </div>
    </section>
  )

  // Avaliação do atendimento morava dentro do bloco "Solicitante" (removido
  // — ver openspec/specs/chamado-interacao); vira uma seção própria, sem a
  // identidade do solicitante junto, e só aparece quando existe avaliação.
  const avaliacaoSection = avaliacao ? (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-avaliacao">
      <h2 id="secao-avaliacao" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Avaliação
      </h2>
      <div className="flex items-center gap-2">
        <AvaliacaoEstrelas valor={avaliacao.estrelas} somenteLeitura />
        <span className="text-xs text-muted-foreground">avaliação do atendimento</span>
      </div>
    </section>
  ) : null

  const infoSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-info">
      <h2 id="secao-info" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Informações
      </h2>
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Contrato</dt>
          <dd>
            <Badge variant="outline">Sem contrato ativo</Badge>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Criado em</dt>
          <dd className="font-tabular font-medium text-foreground">{formatarData(ticket.criadoEm)}</dd>
        </div>
      </dl>
    </section>
  )

  const slaSection = (
    <section className="flex flex-col gap-(--space-3)" aria-labelledby="secao-sla">
      <h2 id="secao-sla" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        SLA
      </h2>
      <SlaProgress rotulo="Resposta" ticket={ticketParaSla} tipo="resposta" mostrarRotulo />
      <SlaProgress rotulo="Solução" ticket={ticketParaSla} tipo="solucao" mostrarRotulo />
    </section>
  )

  // Candidatos a contato adicional: solicitantes da mesma empresa, exceto
  // quem já abriu o chamado (esse já aparece por solicitanteId, não
  // precisa duplicar em ticket_contato) e quem já foi adicionado.
  const idsContatos = new Set(contatos.map((c) => c.usuarioId))
  const candidatosContato = usuarios.filter(
    (u) => u.papel === "solicitante" && u.empresaId === ticket.empresaId && u.id !== ticket.solicitanteId && !idsContatos.has(u.id)
  )

  const contatosSection = (
    <section className="flex flex-col gap-(--space-3)" aria-labelledby="secao-contatos">
      <h2 id="secao-contatos" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Contatos
      </h2>
      {solicitante && (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{solicitante.avatarIniciais}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{solicitante.nome}</span>
            <span className="truncate text-xs text-muted-foreground">{solicitante.email}</span>
          </div>
        </div>
      )}
      {contatos.map((contato) => {
        const usuario = usuarioPorId(contato.usuarioId)
        if (!usuario) return null
        return (
          <div key={contato.usuarioId} className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{usuario.avatarIniciais}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">{usuario.nome}</span>
              <span className="truncate text-xs text-muted-foreground">{usuario.email}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Remover ${usuario.nome} dos contatos`}
              className="cursor-pointer shrink-0"
              onClick={() => handleRemoverContato(contato.usuarioId)}
            >
              <X className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        )
      })}
      {candidatosContato.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Select value={novoContatoId} onValueChange={(value) => setNovoContatoId(value ?? "")}>
            <SelectTrigger className="h-8 flex-1 text-xs" aria-label="Adicionar contato">
              <SelectValue placeholder="Adicionar contato..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {candidatosContato.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="icon-xs"
            variant="outline"
            aria-label="Adicionar contato"
            className="cursor-pointer shrink-0"
            disabled={!novoContatoId}
            onClick={handleAdicionarContato}
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}
    </section>
  )

  const quemViuSection = visualizacoes.length > 0 && (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-quem-viu">
      <h2 id="secao-quem-viu" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Quem viu
      </h2>
      <AvatarGroup aria-label="Quem visualizou o chamado">
        {visualizacoes.map((v) => {
          const usuario = usuarioPorId(v.usuarioId)
          return (
            <Tooltip key={v.usuarioId}>
              <TooltipTrigger>
                <Avatar size="sm">
                  <AvatarFallback>{usuario?.avatarIniciais ?? "?"}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{usuario?.nome ?? "Alguém"}</TooltipContent>
            </Tooltip>
          )
        })}
      </AvatarGroup>
    </section>
  )

  const mesaSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-mesa">
      <h2 id="secao-mesa" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Mesa de trabalho
      </h2>
      <Select value={ticket.mesaId ?? SEM_MESA} onValueChange={handleDefinirMesa}>
        <SelectTrigger className="h-8 w-full text-xs" aria-label="Mesa de trabalho">
          <SelectValue>{mesa?.nome ?? "Sem mesa"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={SEM_MESA}>Sem mesa</SelectItem>
            {mesasTrabalho.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nome}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </section>
  )

  const filhosSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-filhos">
      <div className="flex items-center justify-between gap-2">
        <h2 id="secao-filhos" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Chamados filho
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Criar chamado filho"
          className="cursor-pointer"
          onClick={() => setNovoFilhoAberto(true)}
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
      {filhos.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum chamado filho</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {filhos.map((filho) => (
            <li key={filho.numero}>
              <Link
                href={`/chamados/${filho.numero}`}
                className="flex items-center gap-2 text-xs hover:underline"
              >
                <span className="font-tabular text-muted-foreground">#{filho.numero}</span>
                <span className="min-w-0 flex-1 truncate text-foreground">{filho.titulo}</span>
                <StatusBadge statusKey={filho.statusKey} className="h-5 shrink-0 px-1.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )

  const timelineSection = (
    <section className="flex min-w-0 flex-1 flex-col gap-(--space-3)" aria-label="Linha do tempo">
      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtros da linha do tempo">
        <FiltroPill
          rotulo="Comentários"
          contador={comentariosState.length}
          ativo={timelineFiltro === "comentarios"}
          interativo
          onClick={() => alternarFiltro("comentarios")}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Novo comentário"
          className="cursor-pointer rounded-full"
          onClick={() => setNovoComentarioAberto(true)}
        >
          <MessageSquarePlus className="size-3.5" aria-hidden="true" />
        </Button>
        <FiltroPill
          rotulo="Anexos"
          contador={anexos.length}
          ativo={timelineFiltro === "anexos"}
          interativo
          onClick={() => alternarFiltro("anexos")}
        />
        <FiltroPill rotulo="Base de conhecimento" contador={7} onClick={() => toast("Em breve")} />
        <FiltroPill rotulo="E-mail" onClick={() => toast("Em breve")} />
        <FiltroPill
          rotulo={`Horas ${formatarHorasMinutos(totalMinutosApontados)}`}
          onClick={() => setHorasDialogAberto(true)}
        />
      </div>

      <TicketTimeline
        comentarios={comentariosState}
        eventos={eventos}
        anexos={anexos}
        filtro={timelineFiltro}
      />
      <ComentarioComposer onEnviar={handleEnviarComentario} />
    </section>
  )

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-(--space-4)">
        {ticket.conciliadoNoId && (
          <div
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--status-cancelado)", color: "var(--status-cancelado-fg)" }}
          >
            <GitMerge className="size-4 shrink-0" aria-hidden="true" />
            Este chamado foi conciliado como duplicado de{" "}
            <Link href={`/chamados/${ticket.conciliadoNoId}`} className="font-medium underline">
              #{ticket.conciliadoNoId}
            </Link>
            . O histórico continua acessível abaixo.
          </div>
        )}
        <header className="flex flex-col gap-(--space-2) border-b border-border pb-(--space-4)">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-(--space-2)">
              <div className="flex flex-wrap items-baseline gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--${STATUS_META[statusKey].colorVar})` }}
                  aria-hidden="true"
                />
                <span className="font-tabular text-lg font-semibold text-muted-foreground">#{ticket.numero}</span>
                <h1 className="text-xl font-semibold text-foreground">{ticket.titulo}</h1>
              </div>

              <p className="text-sm text-muted-foreground">
                {empresa?.nome ?? "Empresa desconhecida"} -{" "}
                {analista ? `${analista.nome} (analista)` : "Sem analista atribuído"}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <AcaoToolbar icon={Link2} rotulo="Vincular chamado" onClick={() => toast.success("Vínculo registrado (mock)")} />
              <AcaoToolbar icon={Paperclip} rotulo="Anexar arquivo" onClick={() => toast.success("Anexo registrado (mock)")} />
              <AcaoToolbar icon={GitMerge} rotulo="Conciliar" onClick={() => setConciliarAberto(true)} />
              <AcaoToolbar icon={Network} rotulo="Criar chamado filho" onClick={() => setNovoFilhoAberto(true)} />
              {statusKey === "em_andamento" ? (
                <AcaoToolbar icon={Pause} rotulo="Pausar chamado" onClick={() => setPausarAberto(true)} />
              ) : !STATUS_FINAIS.includes(statusKey) ? (
                <AcaoToolbar
                  icon={Play}
                  rotulo={statusKey === "pausado" ? "Retomar atendimento" : "Iniciar atendimento"}
                  tone="verde"
                  onClick={statusKey === "pausado" ? handleRetomar : handleIniciarAtendimento}
                />
              ) : null}
              <AcaoToolbar icon={Printer} rotulo="Imprimir" onClick={() => window.print()} />
              <AcaoToolbar icon={Calendar} rotulo="Agendar" onClick={() => toast.success("Agendamento registrado (mock)")} />
              <AcaoToolbar icon={Check} rotulo="Finalizar chamado" tone="preto" onClick={() => handleStatusChange("finalizado")} />
              <AcaoToolbar icon={X} rotulo="Cancelar chamado" tone="vermelho" onClick={() => handleStatusChange("cancelado")} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusKey} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48" aria-label="Status do chamado">
                <SelectValue>{(value: string) => STATUS_META[value as keyof typeof STATUS_META]?.rotuloPadrao ?? value}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {STATUS_META[key].rotuloPadrao}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={prioridade ?? SEM_PRIORIDADE} onValueChange={handlePrioridadeChange}>
              <SelectTrigger className="w-44" aria-label="Prioridade do chamado">
                <SelectValue>
                  {(value: string) =>
                    value === SEM_PRIORIDADE
                      ? "Sem prioridade"
                      : (PRIORIDADE_META[value as keyof typeof PRIORIDADE_META]?.rotulo ?? value)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={SEM_PRIORIDADE}>Sem prioridade</SelectItem>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORIDADE_META[p].rotulo}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 sm:ml-auto">
              <SlaBadge rotulo="Resposta" ticket={ticketParaSla} tipo="resposta" />
              <SlaBadge rotulo="Solução" ticket={ticketParaSla} tipo="solucao" />
            </div>
          </div>
        </header>

        {/* < 768px: abas Timeline / Horas / Detalhes, sincronizadas com ?tab= */}
        <div className="md:hidden">
          <Tabs value={abaAtiva} onValueChange={(value) => handleAbaChange(value as string)}>
            <TabsList className="w-full">
              <TabsTrigger value="timeline" className="flex-1">
                Timeline
              </TabsTrigger>
              <TabsTrigger value="horas" className="flex-1">
                Horas
              </TabsTrigger>
              <TabsTrigger value="detalhes" className="flex-1">
                Detalhes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="timeline" className="flex flex-col gap-(--space-3) pt-(--space-3)">
              {timelineSection}
            </TabsContent>
            <TabsContent value="horas" className="pt-(--space-3)">
              {horasSection}
            </TabsContent>
            <TabsContent value="detalhes" className="flex flex-col gap-(--space-4) pt-(--space-3)">
              {avaliacaoSection}
              {avaliacaoSection && <Separator />}
              {infoSection}
              <Separator />
              {slaSection}
              <Separator />
              {contatosSection}
              {quemViuSection && <Separator />}
              {quemViuSection}
              <Separator />
              {mesaSection}
              <Separator />
              {filhosSection}
              <Separator />
              {anexosSection}
              <Separator />
              {categoriasSection}
            </TabsContent>
          </Tabs>
        </div>

        {/* >= 768px: 2 colunas em telas medias (painel desce abaixo da timeline),
            3 regioes lado a lado a partir de 1024px -- painel em proporção
            (~1/3 da largura útil, referência Milvus), não mais fixo em 320px. */}
        <div className="hidden gap-(--space-4) md:flex md:flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,32%)] lg:items-start">
          {timelineSection}

          <Separator className="lg:hidden" />

          <aside
            className="flex w-full flex-col gap-(--space-4) lg:border-l lg:border-border lg:pl-(--space-4)"
            aria-label="Detalhes do chamado"
          >
            {avaliacaoSection}
            {avaliacaoSection && <Separator />}
            {infoSection}
            <Separator />
            {slaSection}
            <Separator />
            {contatosSection}
            {quemViuSection && <Separator />}
            {quemViuSection}
            <Separator />
            {mesaSection}
            <Separator />
            {filhosSection}
            <Separator />
            {horasSection}
            <Separator />
            {anexosSection}
            <Separator />
            {categoriasSection}
          </aside>
        </div>
      </div>

      <PausarDialog
        open={pausarAberto}
        onOpenChange={setPausarAberto}
        ticketNumero={ticket.numero}
        onSucesso={handlePausarSucesso}
      />

      <NovoComentarioDialog
        open={novoComentarioAberto}
        onOpenChange={setNovoComentarioAberto}
        ticketNumero={ticket.numero}
        onEnviar={handleEnviarComentario}
      />

      <ApontamentoHorasDialog
        open={horasDialogAberto}
        onOpenChange={setHorasDialogAberto}
        ticketNumero={ticket.numero}
        apontamentos={apontamentos}
        timerAberto={timerAberto}
      />

      <CriarTicketFilhoDialog open={novoFilhoAberto} onOpenChange={setNovoFilhoAberto} paiNumero={ticket.numero} />

      <ConciliarDialog open={conciliarAberto} onOpenChange={setConciliarAberto} principalNumero={ticket.numero} />
    </TooltipProvider>
  )
}
