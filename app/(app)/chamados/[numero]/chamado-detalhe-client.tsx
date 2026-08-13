"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Calendar,
  Check,
  Link2,
  Paperclip,
  Pause,
  Play,
  Printer,
  X,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { AnexoList } from "@/components/chamado/anexo-list"
import { ApontamentoHoras } from "@/components/chamado/apontamento-horas"
import { AvaliacaoEstrelas } from "@/components/chamado/avaliacao-estrelas"
import { CategoriaAtendimentoSelect } from "@/components/chamado/categoria-atendimento-select"
import { CategoriaProblemaSelect } from "@/components/chamado/categoria-problema-select"
import { ComentarioComposer } from "@/components/chamado/comentario-composer"
import { PausarDialog } from "@/components/chamado/pausar-dialog"
import { SlaBadge } from "@/components/chamado/sla-badge"
import { SlaProgress } from "@/components/chamado/sla-progress"
import { TicketTimeline, type FiltroTimeline } from "@/components/chamado/ticket-timeline"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  definirCategorias,
  definirPrioridade,
  iniciarAtendimento,
  mudarStatus,
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
  type TicketEvento,
} from "@/lib/types"
import { cn } from "@/lib/utils"

// Sentinela de valor pra representar "sem prioridade" dentro do Select --
// o componente base-ui nao aceita item com value="" nem value=null.
const SEM_PRIORIDADE = "sem_prioridade"

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
}

export function ChamadoDetalheClient({
  ticket,
  comentarios,
  eventos,
  apontamentos,
  anexos,
  avaliacao,
}: ChamadoDetalheClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { empresaPorId, usuarioPorId, usuarioAtual } = useReferenceData()

  const empresa = empresaPorId(ticket.empresaId)
  const solicitante = usuarioPorId(ticket.solicitanteId)
  const analista = usuarioPorId(ticket.analistaId)

  const [statusKey, setStatusKey] = useEstadoSincronizado(ticket.statusKey)
  const [prioridade, setPrioridade] = useEstadoSincronizado(ticket.prioridade)
  const [catAtendimentoId, setCatAtendimentoId] = useEstadoSincronizado(ticket.catAtendimentoId ?? "")
  const [catProblemaId, setCatProblemaId] = useEstadoSincronizado(ticket.catProblemaId ?? "")
  const [comentariosState, setComentariosState] = useEstadoSincronizado(comentarios)
  const [timelineFiltro, setTimelineFiltro] = useState<FiltroTimeline>("todos")
  const [pausarAberto, setPausarAberto] = useState(false)

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

  const totalMinutosApontados = apontamentos.reduce((soma, a) => soma + a.minutos, 0)

  const horasSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-horas">
      <h2 id="secao-horas" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Horas
      </h2>
      <ApontamentoHoras apontamentos={apontamentos} />
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
      <AnexoList anexos={anexos} />
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

  const solicitanteSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-solicitante">
      <h2 id="secao-solicitante" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Solicitante
      </h2>
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback>{solicitante?.avatarIniciais ?? "?"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{solicitante?.nome ?? "Solicitante desconhecido"}</span>
          <span className="text-xs text-muted-foreground">{empresa?.nome ?? "-"}</span>
        </div>
      </div>
      {avaliacao ? (
        <div className="flex items-center gap-2">
          <AvaliacaoEstrelas valor={avaliacao.estrelas} somenteLeitura />
          <span className="text-xs text-muted-foreground">avaliação do atendimento</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sem avaliação ainda</p>
      )}
    </section>
  )

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
      <SlaProgress
        rotulo="Resposta"
        venceEm={ticket.slaRespostaVenceEm}
        criadoEm={ticket.criadoEm}
        statusKey={statusKey}
        mostrarRotulo
      />
      <SlaProgress
        rotulo="Solução"
        venceEm={ticket.slaSolucaoVenceEm}
        criadoEm={ticket.criadoEm}
        statusKey={statusKey}
        mostrarRotulo
      />
    </section>
  )

  const seguidoresSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-seguidores">
      <h2 id="secao-seguidores" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Seguidores
      </h2>
      {analista ? (
        <AvatarGroup aria-label="Seguidores do chamado">
          <Avatar size="sm">
            <AvatarFallback>{analista.avatarIniciais}</AvatarFallback>
          </Avatar>
        </AvatarGroup>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum seguidor</p>
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
        <FiltroPill
          rotulo="Anexos"
          contador={anexos.length}
          ativo={timelineFiltro === "anexos"}
          interativo
          onClick={() => alternarFiltro("anexos")}
        />
        <FiltroPill rotulo="Base de conhecimento" contador={7} onClick={() => toast("Em breve")} />
        <FiltroPill rotulo="E-mail" onClick={() => toast("Em breve")} />
        <FiltroPill rotulo={`Horas ${formatarHorasMinutos(totalMinutosApontados)}`} onClick={() => toast("Em breve")} />
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
                {empresa?.nome ?? "Empresa desconhecida"} - {solicitante?.nome ?? "Solicitante desconhecido"} -{" "}
                {analista ? `${analista.nome} (analista)` : "Sem analista atribuído"}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <AcaoToolbar icon={Link2} rotulo="Vincular chamado" onClick={() => toast.success("Vínculo registrado (mock)")} />
              <AcaoToolbar icon={Paperclip} rotulo="Anexar arquivo" onClick={() => toast.success("Anexo registrado (mock)")} />
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
              <SlaBadge rotulo="Resposta" venceEm={ticket.slaRespostaVenceEm} statusKey={statusKey} />
              <SlaBadge rotulo="Solução" venceEm={ticket.slaSolucaoVenceEm} statusKey={statusKey} />
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
              {solicitanteSection}
              <Separator />
              {infoSection}
              <Separator />
              {slaSection}
              <Separator />
              {seguidoresSection}
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
            {solicitanteSection}
            <Separator />
            {infoSection}
            <Separator />
            {slaSection}
            <Separator />
            {seguidoresSection}
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
    </TooltipProvider>
  )
}
