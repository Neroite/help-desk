"use client"

import { use, useState } from "react"
import { notFound } from "next/navigation"
import { toast } from "sonner"

import { AnexoList } from "@/components/chamado/anexo-list"
import { ApontamentoHoras } from "@/components/chamado/apontamento-horas"
import { ComentarioComposer } from "@/components/chamado/comentario-composer"
import { SlaBadge } from "@/components/chamado/sla-badge"
import { TicketTimeline } from "@/components/chamado/ticket-timeline"
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
import {
  anexos,
  apontamentos,
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

// Sentinela de valor pra representar "sem prioridade" dentro do Select --
// o componente base-ui nao aceita item com value="" nem value=null.
const SEM_PRIORIDADE = "sem_prioridade"

interface ChamadoDetalhePageProps {
  params: Promise<{ numero: string }>
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
      autorId: analista?.id ?? "u-joao",
      corpo,
      interno,
      criadoEm: new Date().toISOString(),
    }
    setComentariosState((atual) => [...atual, novoComentario])
    toast.success(interno ? "Nota interna registrada" : "Resposta enviada ao solicitante")
  }

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

  return (
    <div className="flex flex-col gap-(--space-4)">
      <header className="flex flex-col gap-(--space-2) border-b border-border pb-(--space-4)">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-tabular text-lg font-semibold text-muted-foreground">#{ticket.numero}</span>
          <h1 className="text-xl font-semibold text-foreground">{ticket.titulo}</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          {empresa?.nome ?? "Empresa desconhecida"} - {solicitante?.nome ?? "Solicitante desconhecido"} -{" "}
          {analista ? `${analista.nome} (analista)` : "Sem analista atribuído"}
        </p>

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

      {/* < 768px: abas Timeline / Horas / Detalhes */}
      <div className="md:hidden">
        <Tabs defaultValue="timeline">
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
            <TicketTimeline comentarios={comentariosState} eventos={eventosTicket} />
            <ComentarioComposer onEnviar={handleEnviarComentario} />
          </TabsContent>
          <TabsContent value="horas" className="pt-(--space-3)">
            {horasSection}
          </TabsContent>
          <TabsContent value="detalhes" className="flex flex-col gap-(--space-4) pt-(--space-3)">
            {anexosSection}
            <Separator />
            {categoriasSection}
          </TabsContent>
        </Tabs>
      </div>

      {/* >= 768px: 2 colunas em telas medias (painel desce abaixo da timeline),
          3 regioes lado a lado a partir de 1024px (painel fixo de 320px). */}
      <div className="hidden gap-(--space-4) md:flex md:flex-col lg:flex-row lg:items-start">
        <section className="flex min-w-0 flex-1 flex-col gap-(--space-3)" aria-label="Linha do tempo">
          <TicketTimeline comentarios={comentariosState} eventos={eventosTicket} />
          <ComentarioComposer onEnviar={handleEnviarComentario} />
        </section>

        <Separator className="lg:hidden" />
        <Separator orientation="vertical" className="hidden self-stretch lg:block" />

        <aside className="flex w-full flex-col gap-(--space-4) lg:w-80 lg:shrink-0" aria-label="Detalhes do chamado">
          {horasSection}
          <Separator />
          {anexosSection}
          <Separator />
          {categoriasSection}
        </aside>
      </div>
    </div>
  )
}