"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import type { JSONContent } from "@tiptap/react"
import { GitMerge } from "lucide-react"
import { toast } from "sonner"

import { AnexosDialog } from "@/components/chamado/anexos-dialog"
import { ApontamentoHorasDialog } from "@/components/chamado/apontamento-horas-dialog"
import { ConciliarDialog } from "@/components/chamado/conciliar-dialog"
import { CriarTicketFilhoDialog } from "@/components/chamado/criar-ticket-filho-dialog"
import { ChamadoCabecalho, SEM_PRIORIDADE } from "@/components/chamado/detalhe/cabecalho"
import { FiltroPill } from "@/components/chamado/detalhe/filtro-pill"
import { PainelLateralDetalhe, SEM_ANALISTA, SEM_MESA, SEM_SETOR } from "@/components/chamado/detalhe/painel-lateral"
import { NovoComentarioDialog } from "@/components/chamado/novo-comentario-dialog"
import { PausarDialog } from "@/components/chamado/pausar-dialog"
import { PausarSlaDialog } from "@/components/chamado/pausar-sla-dialog"
import { TicketTimeline } from "@/components/chamado/ticket-timeline"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { construirHtmlComentario } from "@/lib/comentario/render-html"
import { useEstadoSincronizado } from "@/lib/hooks/use-estado-sincronizado"
import { useReferenceData } from "@/lib/reference-data/provider"
import { useRealtimeRefresh } from "@/lib/realtime/use-realtime-refresh"
import {
  adicionarComentario,
  adicionarContato,
  atribuirAnalista,
  definirCategorias,
  definirMesa,
  definirPrioridade,
  definirSetor,
  iniciarAtendimento,
  mudarStatus,
  removerContato,
  retomarChamado,
  retomarSlaManualmente,
} from "@/lib/tickets/actions"
import { PRIORIDADE_META, STATUS_META } from "@/lib/status"
import {
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

const ABAS_MOBILE = ["timeline", "detalhes"] as const
type AbaMobile = (typeof ABAS_MOBILE)[number]

function ehAbaMobile(valor: string | null): valor is AbaMobile {
  return valor !== null && (ABAS_MOBILE as readonly string[]).includes(valor)
}

function formatarHorasMinutos(totalMinutos: number) {
  const horas = Math.floor(totalMinutos / 60)
  const minutos = totalMinutos % 60
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`
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
  const { empresaPorId, usuarioPorId, usuarioAtual } = useReferenceData()

  const empresa = empresaPorId(ticket.empresaId)
  const analista = usuarioPorId(ticket.analistaId)

  const [statusKey, setStatusKey] = useEstadoSincronizado(ticket.statusKey)
  // SlaProgress/SlaBadge precisam do ticket inteiro (pausa, minutos
  // pausados, encerramento) mas o status exibido pode estar à frente do
  // `ticket` original por causa do update otimista acima.
  const ticketParaSla = { ...ticket, statusKey }
  const [prioridade, setPrioridade] = useEstadoSincronizado(ticket.prioridade)
  const [catAtendimentoId, setCatAtendimentoId] = useEstadoSincronizado(ticket.catAtendimentoId ?? "")
  const [catProblemaId, setCatProblemaId] = useEstadoSincronizado(ticket.catProblemaId ?? "")
  const [comentariosState, setComentariosState] = useEstadoSincronizado(comentarios)
  const [pausarAberto, setPausarAberto] = useState(false)
  const [pausarSlaAberto, setPausarSlaAberto] = useState(false)
  const [novoComentarioAberto, setNovoComentarioAberto] = useState(false)
  const [horasDialogAberto, setHorasDialogAberto] = useState(false)
  const [anexosDialogAberto, setAnexosDialogAberto] = useState(false)
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

  function handlePausarSlaSucesso() {
    toast.success("SLA pausado")
    router.refresh()
  }

  function handleRetomarSla() {
    retomarSlaManualmente(ticket.numero)
      .then(() => {
        toast.success("SLA retomado")
        router.refresh()
      })
      .catch((erro) => toast.error(erro instanceof Error ? erro.message : "Não foi possível retomar o SLA."))
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

  // Devolve a Promise da persistência (não fire-and-forget): o modal usa
  // isso pra só registrar o apontamento de horas depois que o comentário
  // de fato gravou (ver comentário em novo-comentario-dialog.tsx). A UI
  // otimista continua — a linha aparece na hora, e some se o insert falhar.
  function handleEnviarComentario(
    corpo: string,
    interno: boolean,
    documentoRico: JSONContent,
    anexoIds: string[]
  ): Promise<void> {
    const novoComentario: Comentario = {
      id: `local-${Date.now()}`,
      ticketId: ticket.numero,
      autorId: usuarioAtual?.id ?? "",
      corpo: construirHtmlComentario(documentoRico),
      formato: "html",
      interno,
      criadoEm: new Date().toISOString(),
    }
    setComentariosState((atual) => [...atual, novoComentario])
    // JSON.parse(JSON.stringify(...)) -- o objeto do Tiptap cruzando a Server
    // Action crashava no servidor com "Cannot access src on the server. You
    // cannot dot into a temporary client reference from a server component."
    // ao ler attrs de um nó de imagem. O round-trip força um clone 100% plano
    // antes de sair do cliente, evitando o que quer que o React esteja
    // tratando como referência temporária no objeto original do editor.
    return adicionarComentario({
      ticketNumero: ticket.numero,
      corpo,
      interno,
      documentoRico: JSON.parse(JSON.stringify(documentoRico)),
      anexoIds,
    })
      .then(() => {
        toast.success(interno ? "Nota interna registrada" : "Resposta enviada ao solicitante")
      })
      .catch((erro) => {
        setComentariosState((atual) => atual.filter((c) => c.id !== novoComentario.id))
        throw erro
      })
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

  function handleAtribuirAnalista(analistaId: string | null) {
    atribuirAnalista(ticket.numero, !analistaId || analistaId === SEM_ANALISTA ? null : analistaId)
      .then(() => router.refresh())
      .catch(() => toast.error("Não foi possível definir o operador."))
  }

  function handleDefinirSetor(setorId: string | null) {
    definirSetor(ticket.numero, !setorId || setorId === SEM_SETOR ? null : setorId)
      .then(() => router.refresh())
      .catch(() => toast.error("Não foi possível definir o setor do solicitante."))
  }

  // Timer em aberto ainda não tem duração fechada — só soma o que encerrou.
  const totalMinutosApontados = apontamentos.reduce((soma, a) => soma + (a.minutos ?? 0), 0)

  const timelineSection = (
    <section className="flex min-w-0 flex-1 flex-col gap-(--space-3)" aria-label="Linha do tempo">
      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Ações da linha do tempo">
        <FiltroPill
          rotulo="Comentários"
          contador={comentariosState.length}
          onClick={() => setNovoComentarioAberto(true)}
        />
        <FiltroPill rotulo="Anexos" contador={anexos.length} onClick={() => setAnexosDialogAberto(true)} />
        <FiltroPill
          rotulo={`Horas ${formatarHorasMinutos(totalMinutosApontados)}`}
          onClick={() => setHorasDialogAberto(true)}
        />
      </div>

      <TicketTimeline comentarios={comentariosState} eventos={eventos} anexos={anexos} />
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
        <ChamadoCabecalho
          ticket={ticket}
          statusKey={statusKey}
          prioridade={prioridade}
          empresa={empresa}
          analista={analista}
          onStatusChange={handleStatusChange}
          onPrioridadeChange={handlePrioridadeChange}
          onPausarAbrir={() => setPausarAberto(true)}
          onRetomar={handleRetomar}
          onIniciarAtendimento={handleIniciarAtendimento}
          onConciliarAbrir={() => setConciliarAberto(true)}
          onCriarFilhoAbrir={() => setNovoFilhoAberto(true)}
        />

        {/* < 768px: abas Timeline / Detalhes, sincronizadas com ?tab= -- Horas
            não é aba própria: o resumo somente-leitura mora dentro de
            "Detalhes" (seção compartilhada com o desktop) e o pill "Horas"
            da timeline abre o mesmo modal. Ver comentário em
            components/chamado/detalhe/resumo-horas.tsx (C7). */}
        <div className="md:hidden">
          <Tabs value={abaAtiva} onValueChange={(value) => handleAbaChange(value as string)}>
            <TabsList className="w-full">
              <TabsTrigger value="timeline" className="flex-1">
                Timeline
              </TabsTrigger>
              <TabsTrigger value="detalhes" className="flex-1">
                Detalhes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="timeline" className="flex flex-col gap-(--space-3) pt-(--space-3)">
              {timelineSection}
            </TabsContent>
            <TabsContent value="detalhes" className="flex flex-col gap-(--space-4) pt-(--space-3)">
              <PainelLateralDetalhe
                ticket={ticket}
                ticketParaSla={ticketParaSla}
                avaliacao={avaliacao}
                contatos={contatos}
                visualizacoes={visualizacoes}
                filhos={filhos}
                anexos={anexos}
                apontamentos={apontamentos}
                catAtendimentoId={catAtendimentoId}
                catProblemaId={catProblemaId}
                onCategoriasChange={handleCategoriasChange}
                onDefinirMesa={handleDefinirMesa}
                onAtribuirAnalista={handleAtribuirAnalista}
                onDefinirSetor={handleDefinirSetor}
                novoContatoId={novoContatoId}
                onNovoContatoIdChange={setNovoContatoId}
                onAdicionarContato={handleAdicionarContato}
                onRemoverContato={handleRemoverContato}
                onCriarFilho={() => setNovoFilhoAberto(true)}
                onAbrirHoras={() => setHorasDialogAberto(true)}
                onPausarSlaAbrir={() => setPausarSlaAberto(true)}
                onRetomarSla={handleRetomarSla}
              />
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
            <PainelLateralDetalhe
              ticket={ticket}
              ticketParaSla={ticketParaSla}
              avaliacao={avaliacao}
              contatos={contatos}
              visualizacoes={visualizacoes}
              filhos={filhos}
              anexos={anexos}
              apontamentos={apontamentos}
              catAtendimentoId={catAtendimentoId}
              catProblemaId={catProblemaId}
              onCategoriasChange={handleCategoriasChange}
              onDefinirMesa={handleDefinirMesa}
              onAtribuirAnalista={handleAtribuirAnalista}
              onDefinirSetor={handleDefinirSetor}
              novoContatoId={novoContatoId}
              onNovoContatoIdChange={setNovoContatoId}
              onAdicionarContato={handleAdicionarContato}
              onRemoverContato={handleRemoverContato}
              onCriarFilho={() => setNovoFilhoAberto(true)}
              onAbrirHoras={() => setHorasDialogAberto(true)}
              onPausarSlaAbrir={() => setPausarSlaAberto(true)}
              onRetomarSla={handleRetomarSla}
            />
          </aside>
        </div>
      </div>

      <PausarDialog
        open={pausarAberto}
        onOpenChange={setPausarAberto}
        ticketNumero={ticket.numero}
        onSucesso={handlePausarSucesso}
      />

      <PausarSlaDialog
        open={pausarSlaAberto}
        onOpenChange={setPausarSlaAberto}
        ticketNumero={ticket.numero}
        onSucesso={handlePausarSlaSucesso}
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

      <AnexosDialog
        open={anexosDialogAberto}
        onOpenChange={setAnexosDialogAberto}
        ticketNumero={ticket.numero}
        anexos={anexos}
      />

      <CriarTicketFilhoDialog open={novoFilhoAberto} onOpenChange={setNovoFilhoAberto} paiNumero={ticket.numero} />

      <ConciliarDialog open={conciliarAberto} onOpenChange={setConciliarAberto} principalNumero={ticket.numero} />
    </TooltipProvider>
  )
}
