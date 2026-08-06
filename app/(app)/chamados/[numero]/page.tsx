"use client"

import { use, useState } from "react"
import { notFound, useRouter, useSearchParams } from "next/navigation"
import {
  Calendar,
  Check,
  Link2,
  Paperclip,
  Play,
  Printer,
  X,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { AnexoList } from "@/components/chamado/anexo-list"
import { ApontamentoHoras } from "@/components/chamado/apontamento-horas"
import { AvaliacaoEstrelas } from "@/components/chamado/avaliacao-estrelas"
import { ComentarioComposer } from "@/components/chamado/comentario-composer"
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
import {
  anexos,
  apontamentos,
  avaliacoes,
  categoriasAtendimento,
  categoriasProblema,
  comentarios,
  empresaPorId,
  ticketEventos,
  ticketPorNumero,
  usuarioPorId,
} from "@/lib/mock/data"
import { PRIORIDADE_META, STATUS_META } from "@/lib/status"
import { PRIORIDADES, STATUS_KEYS, type Comentario, type Prioridade, type StatusKey } from "@/lib/types"
import { cn } from "@/lib/utils"

// Sentinela de valor pra representar "sem prioridade" dentro do Select --
// o componente base-ui nao aceita item com value="" nem value=null.
const SEM_PRIORIDADE = "sem_prioridade"

// "Usuário logado" mock (mesmo padrão do dashboard) -- autor default de
// comentários novos quando o chamado não tem analista atribuído.
const ANALISTA_LOGADO_ID = "u-joao"

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

interface ChamadoDetalhePageProps {
  params: Promise<{ numero: string }>
}

interface AcaoToolbarProps {
  icon: LucideIcon
  rotulo: string
  onClick: () => void
  // Sem tone: outline neutro, só ganha cor no hover (Vincular, Anexar,
  // Imprimir, Agendar). Com tone: preenchido já em repouso — reservado
  // pras 3 ações de maior peso (iniciar timer, finalizar, cancelar), pra
  // não competir visualmente com as neutras.
  tone?: "verde" | "vermelho" | "azul"
}

const TONE_CLASSES: Record<NonNullable<AcaoToolbarProps["tone"]>, string> = {
  azul: "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-700 hover:text-white",
  verde: "border-transparent bg-green-600 text-white hover:border-transparent hover:bg-green-700 hover:text-white",
  vermelho: "border-transparent bg-red-600 text-white hover:border-transparent hover:bg-red-700 hover:text-white",
}

// Botão circular pequeno com tooltip -- usado na toolbar de ações do
// cabeçalho (vincular, anexar, iniciar timer, imprimir, agendar, finalizar,
// cancelar). Ver spec de redesenho baseada na captura do Milvus.
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
  // Renderizado como Badge separado, não embutido no texto do rótulo —
  // fica visualmente escaneável e continua no nome acessível do botão
  // (não leva aria-hidden), então leitor de tela lê "Comentários 2" normal.
  contador?: number
  ativo?: boolean
  interativo?: boolean
  onClick: () => void
}

// Badge contável clicável da faixa acima da timeline. "Comentários" e
// "Anexos" filtram de verdade (aria-pressed reflete o estado); os demais
// são só fidelidade visual da referência (toast "Em breve" ao clicar).
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

// Page precisa ser Client Component: os Selects de status/prioridade no
// cabecalho exigem estado local + onValueChange (toast), e um Server
// Component nao pode passar event handlers pra um Client Component filho.
// params ainda e a Promise do Next 15 -- so que desembrulhada com use()
// em vez de await, que e o equivalente client-side. Ver docs Next.js
// ("Read params in Client Components using React use").
export default function ChamadoDetalhePage({ params }: ChamadoDetalhePageProps) {
  const { numero } = use(params)
  const ticket = ticketPorNumero(Number(numero))

  if (!ticket) {
    notFound()
  }

  const router = useRouter()
  const searchParams = useSearchParams()

  const empresa = empresaPorId(ticket.empresaId)
  const solicitante = usuarioPorId(ticket.solicitanteId)
  const analista = usuarioPorId(ticket.analistaId)

  // Extraido em variavel propria (em vez de repetir `ticket.numero` dentro
  // de closures abaixo) porque o TypeScript nao preserva a narrowing de
  // `ticket` (pos notFound()) dentro de function declarations aninhadas.
  const ticketIdStr = String(ticket.numero)

  const eventosTicket = ticketEventos.filter((e) => e.ticketId === ticketIdStr)
  const apontamentosTicket = apontamentos.filter((a) => a.ticketId === ticketIdStr)
  const anexosTicket = anexos.filter((a) => a.ticketId === ticketIdStr)
  const avaliacaoTicket = avaliacoes.find((a) => a.ticketId === ticketIdStr)

  const catAtendimento = categoriasAtendimento.find((c) => c.id === ticket.catAtendimentoId)
  const catProblema = categoriasProblema.find((c) => c.id === ticket.catProblemaId)
  const catProblemaPai = catProblema?.paiId
    ? categoriasProblema.find((c) => c.id === catProblema.paiId)
    : null
  const problemaRotulo = catProblema
    ? catProblemaPai
      ? `${catProblemaPai.nome} > ${catProblema.nome}`
      : catProblema.nome
    : "-"

  // Sem persistencia real (fase de telas) -- troca de status/prioridade e
  // novo comentario so vivem no estado local desta pagina, com toast de
  // confirmacao. Ver CLAUDE.md do escopo desta tela.
  const [statusKey, setStatusKey] = useState<StatusKey>(ticket.statusKey)
  const [prioridade, setPrioridade] = useState<Prioridade | null>(ticket.prioridade)
  const [comentariosState, setComentariosState] = useState<Comentario[]>(() =>
    comentarios.filter((c) => c.ticketId === ticketIdStr)
  )
  const [timelineFiltro, setTimelineFiltro] = useState<FiltroTimeline>("todos")

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

  function handleStatusChange(value: StatusKey | null) {
    if (!value) return
    setStatusKey(value)
    toast.success(`Status alterado para "${STATUS_META[value].rotuloPadrao}"`)
  }

  function handlePrioridadeChange(value: string | null) {
    const novaPrioridade = !value || value === SEM_PRIORIDADE ? null : (value as Prioridade)
    setPrioridade(novaPrioridade)
    toast.success(
      novaPrioridade
        ? `Prioridade definida como "${PRIORIDADE_META[novaPrioridade].rotulo}"`
        : "Prioridade removida"
    )
  }

  function handleEnviarComentario(corpo: string, interno: boolean) {
    const novoComentario: Comentario = {
      id: `local-${Date.now()}`,
      ticketId: ticketIdStr,
      autorId: analista?.id ?? ANALISTA_LOGADO_ID,
      corpo,
      interno,
      criadoEm: new Date().toISOString(),
    }
    setComentariosState((atual) => [...atual, novoComentario])
    toast.success(interno ? "Nota interna registrada" : "Resposta enviada ao solicitante")
  }

  function alternarFiltro(valor: FiltroTimeline) {
    setTimelineFiltro((atual) => (atual === valor ? "todos" : valor))
  }

  const totalMinutosApontados = apontamentosTicket.reduce((soma, a) => soma + a.minutos, 0)
  const totalTarefas = ticket.tarefasAbertas + ticket.tarefasConcluidas
  const progressoPercentual = totalTarefas > 0 ? Math.round((ticket.tarefasConcluidas / totalTarefas) * 100) : 0

  const horasSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-horas">
      <h2 id="secao-horas" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Horas
      </h2>
      <ApontamentoHoras apontamentos={apontamentosTicket} />
    </section>
  )

  const anexosSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-anexos">
      <div className="flex items-center justify-between">
        <h2 id="secao-anexos" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Anexos
        </h2>
        <span className="font-tabular text-xs text-muted-foreground">{anexosTicket.length}</span>
      </div>
      <AnexoList anexos={anexosTicket} />
    </section>
  )

  const categoriasSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-categorias">
      <h2 id="secao-categorias" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Categorias
      </h2>
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Atendimento</dt>
          <dd className="font-medium text-foreground">{catAtendimento?.nome ?? "-"}</dd>
        </div>
        <div className="flex items-start justify-between gap-2">
          <dt className="shrink-0 text-muted-foreground">Problema</dt>
          <dd className="text-right font-medium text-foreground">{problemaRotulo}</dd>
        </div>
      </dl>
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
      {avaliacaoTicket ? (
        <div className="flex items-center gap-2">
          <AvaliacaoEstrelas valor={avaliacaoTicket.estrelas} somenteLeitura />
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
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Mesa</dt>
          <dd className="font-medium text-foreground">{ticket.mesa}</dd>
        </div>
      </dl>
    </section>
  )

  const slaSection = (
    <section className="flex flex-col gap-(--space-3)" aria-labelledby="secao-sla">
      <h2 id="secao-sla" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        SLA
      </h2>
      <SlaProgress rotulo="Resposta" venceEm={ticket.slaRespostaVenceEm} criadoEm={ticket.criadoEm} statusKey={statusKey} />
      <SlaProgress rotulo="Solução" venceEm={ticket.slaSolucaoVenceEm} criadoEm={ticket.criadoEm} statusKey={statusKey} />
    </section>
  )

  const progressoSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-progresso">
      <div className="flex items-center justify-between">
        <h2 id="secao-progresso" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Progresso
        </h2>
        <span className="font-tabular text-xs text-muted-foreground">{progressoPercentual}%</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Progresso das tarefas do chamado"
        aria-valuenow={progressoPercentual}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progressoPercentual}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {totalTarefas > 0
          ? `${ticket.tarefasConcluidas} de ${totalTarefas} tarefa${totalTarefas === 1 ? "" : "s"} concluída${totalTarefas === 1 ? "" : "s"}`
          : "Sem tarefas cadastradas"}
      </p>
    </section>
  )

  const seguidoresMock = [analista, usuarioPorId("u-admin")].filter(
    (u, i, arr): u is NonNullable<typeof u> => Boolean(u) && arr.findIndex((x) => x?.id === u?.id) === i
  )

  const seguidoresSection = (
    <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-seguidores">
      <h2 id="secao-seguidores" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Seguidores
      </h2>
      {seguidoresMock.length > 0 ? (
        <AvatarGroup aria-label="Seguidores do chamado">
          {seguidoresMock.map((u) => (
            <Avatar key={u.id} size="sm">
              <AvatarFallback>{u.avatarIniciais}</AvatarFallback>
            </Avatar>
          ))}
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
          contador={anexosTicket.length}
          ativo={timelineFiltro === "anexos"}
          interativo
          onClick={() => alternarFiltro("anexos")}
        />
        <FiltroPill rotulo="Base de conhecimento" contador={7} onClick={() => toast("Em breve")} />
        <FiltroPill rotulo="E-mail" onClick={() => toast("Em breve")} />
        <FiltroPill rotulo={`Horas ${formatarHorasMinutos(totalMinutosApontados)}`} onClick={() => toast("Em breve")} />
        <FiltroPill rotulo="Checklist" contador={totalTarefas} onClick={() => toast("Em breve")} />
        <FiltroPill rotulo="Peças" contador={0} onClick={() => toast("Em breve")} />
      </div>

      <TicketTimeline
        comentarios={comentariosState}
        eventos={eventosTicket}
        anexos={anexosTicket}
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
                {analista ? `${analista.nome} (analista)` : "Sem analista atribuído"} - {ticket.mesa}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <AcaoToolbar icon={Link2} rotulo="Vincular chamado" onClick={() => toast.success("Vínculo registrado (mock)")} />
              <AcaoToolbar icon={Paperclip} rotulo="Anexar arquivo" onClick={() => toast.success("Anexo registrado (mock)")} />
              <AcaoToolbar icon={Play} rotulo="Iniciar timer" tone="azul" onClick={() => toast.success("Cronômetro iniciado (mock)")} />
              <AcaoToolbar icon={Printer} rotulo="Imprimir" onClick={() => window.print()} />
              <AcaoToolbar icon={Calendar} rotulo="Agendar" onClick={() => toast.success("Agendamento registrado (mock)")} />
              <AcaoToolbar icon={Check} rotulo="Finalizar chamado" tone="verde" onClick={() => handleStatusChange("finalizado")} />
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
              {progressoSection}
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
            3 regioes lado a lado a partir de 1024px (painel fixo de 320px). */}
        <div className="hidden gap-(--space-4) md:flex md:flex-col lg:flex-row lg:items-start">
          {timelineSection}

          <Separator className="lg:hidden" />
          <Separator orientation="vertical" className="hidden self-stretch lg:block" />

          <aside className="flex w-full flex-col gap-(--space-4) lg:w-80 lg:shrink-0" aria-label="Detalhes do chamado">
            {solicitanteSection}
            <Separator />
            {infoSection}
            <Separator />
            {slaSection}
            <Separator />
            {progressoSection}
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
    </TooltipProvider>
  )
}
