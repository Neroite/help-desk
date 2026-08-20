"use client"

import Link from "next/link"
import { Plus, X } from "lucide-react"

import { AnexoList } from "@/components/chamado/anexo-list"
import { AvaliacaoEstrelas } from "@/components/chamado/avaliacao-estrelas"
import { CategoriaAtendimentoSelect } from "@/components/chamado/categoria-atendimento-select"
import { CategoriaProblemaSelect } from "@/components/chamado/categoria-problema-select"
import { SlaLinhaDetalhada } from "@/components/chamado/sla-linha-detalhada"
import { StatusBadge } from "@/components/chamado/status-badge"
import { ResumoHoras } from "@/components/chamado/detalhe/resumo-horas"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useReferenceData } from "@/lib/reference-data/provider"
import type {
  Anexo,
  ApontamentoHoras as ApontamentoHorasItem,
  Avaliacao,
  Ticket,
  TicketContato,
  TicketFilho,
  TicketVisualizacao,
} from "@/lib/types"
import { STATUS_FINAIS, STATUS_PAUSA_SLA } from "@/lib/types"

// Sentinelas pra representar "vazio" dentro de Select -- o componente
// base-ui não aceita item com value="" nem value=null. Exportados porque
// os chamadores (handlers em chamado-detalhe-client.tsx) precisam
// reconhecer o mesmo valor pra interpretar como null.
export const SEM_MESA = "sem_mesa"
export const SEM_ANALISTA = "sem_analista"
export const SEM_SETOR = "sem_setor"

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

interface PainelLateralDetalheProps {
  ticket: Ticket
  // SlaProgress precisa do ticket com o status otimista (pode estar à
  // frente do `ticket` original enquanto a Server Action de mudança de
  // status ainda não voltou) -- por isso separado de `ticket`.
  ticketParaSla: Ticket
  avaliacao: Avaliacao | null
  contatos: TicketContato[]
  visualizacoes: TicketVisualizacao[]
  filhos: TicketFilho[]
  anexos: Anexo[]
  apontamentos: ApontamentoHorasItem[]
  catAtendimentoId: string
  catProblemaId: string
  onCategoriasChange: (atendimento: string, problema: string) => void
  onDefinirMesa: (mesaId: string | null) => void
  onAtribuirAnalista: (analistaId: string | null) => void
  onDefinirSetor: (setorId: string | null) => void
  novoContatoId: string
  onNovoContatoIdChange: (id: string) => void
  onAdicionarContato: () => void
  onRemoverContato: (usuarioId: string) => void
  onCriarFilho: () => void
  // Abre o modal de horas (ApontamentoHorasDialog, onde <ApontamentoHoras>
  // de fato monta) -- ver comentário em resumo-horas.tsx (C7).
  onAbrirHoras: () => void
  // Pausa/retomada de SLA independente do status geral do chamado -- ver
  // lib/tickets/actions.ts#pausarSlaManualmente. onPausarSlaAbrir abre um
  // dialog (motivo obrigatório); onRetomarSla é clique direto, sem dialog,
  // mesmo padrão de onRetomar no cabeçalho.
  onPausarSlaAbrir: () => void
  onRetomarSla: () => void
}

// Unifica a ordem de seções do painel lateral, hoje duplicada entre o
// <aside> desktop e a aba mobile "Detalhes" -- as duas leituras já
// divergiam (só o aside tinha horas), fonte única evita que divirjam mais.
// Ordem segue a referência Milvus: Contatos · Tipo de Ticket · Categorias ·
// Mesa de trabalho · Operador · Setor do Solicitante, depois Informações ·
// SLA · Horas · Anexos · Quem viu · Chamados filho · Avaliação.
export function PainelLateralDetalhe({
  ticket,
  ticketParaSla,
  avaliacao,
  contatos,
  visualizacoes,
  filhos,
  anexos,
  apontamentos,
  catAtendimentoId,
  catProblemaId,
  onCategoriasChange,
  onDefinirMesa,
  onAtribuirAnalista,
  onDefinirSetor,
  novoContatoId,
  onNovoContatoIdChange,
  onAdicionarContato,
  onRemoverContato,
  onCriarFilho,
  onAbrirHoras,
  onPausarSlaAbrir,
  onRetomarSla,
}: PainelLateralDetalheProps) {
  const { usuarioPorId, usuarios, mesaPorId, mesasTrabalho, setorPorId, setores } = useReferenceData()
  const solicitante = usuarioPorId(ticket.solicitanteId)
  const analista = usuarioPorId(ticket.analistaId)
  const mesa = mesaPorId(ticket.mesaId)
  const setor = setorPorId(ticket.setorId)

  // Candidatos a contato adicional: solicitantes da mesma empresa, exceto
  // quem já abriu o chamado (esse já aparece por solicitanteId, não
  // precisa duplicar em ticket_contato) e quem já foi adicionado.
  const idsContatos = new Set(contatos.map((c) => c.usuarioId))
  const candidatosContato = usuarios.filter(
    (u) =>
      u.papel === "solicitante" &&
      u.empresaId === ticket.empresaId &&
      u.id !== ticket.solicitanteId &&
      !idsContatos.has(u.id)
  )

  const analistas = usuarios.filter((u) => u.papel === "analista" || u.papel === "admin")

  // Setor é catálogo por empresa (empresaId) ou interno/compartilhado
  // (empresaId null) -- ver comentário da tabela `helpdesk.setor`.
  const setoresDisponiveis = setores.filter((s) => s.empresaId === null || s.empresaId === ticket.empresaId)

  return (
    <>
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
                onClick={() => onRemoverContato(contato.usuarioId)}
              >
                <X className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          )
        })}
        {candidatosContato.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Select value={novoContatoId} onValueChange={(value) => onNovoContatoIdChange(value ?? "")}>
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
              onClick={onAdicionarContato}
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </section>
      <Separator />

      <section className="flex flex-col gap-1.5" aria-labelledby="secao-tipo-ticket">
        <h2 id="secao-tipo-ticket" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Tipo de Ticket
        </h2>
        <CategoriaAtendimentoSelect
          id="detalhe-cat-atendimento"
          value={catAtendimentoId}
          onValueChange={(value) => onCategoriasChange(value, catProblemaId)}
        />
      </section>
      <Separator />

      <section className="flex flex-col gap-1.5" aria-labelledby="secao-categorias">
        <h2 id="secao-categorias" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Categorias
        </h2>
        <CategoriaProblemaSelect
          id="detalhe-cat-problema"
          value={catProblemaId}
          onValueChange={(value) => onCategoriasChange(catAtendimentoId, value)}
        />
      </section>
      <Separator />

      <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-mesa">
        <h2 id="secao-mesa" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Mesa de trabalho
        </h2>
        <Select value={ticket.mesaId ?? SEM_MESA} onValueChange={onDefinirMesa}>
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
      <Separator />

      <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-operador">
        <h2 id="secao-operador" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Operador
        </h2>
        <Select value={ticket.analistaId ?? SEM_ANALISTA} onValueChange={onAtribuirAnalista}>
          <SelectTrigger className="h-8 w-full text-xs" aria-label="Operador responsável">
            <SelectValue>{analista?.nome ?? "Não atribuído"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={SEM_ANALISTA}>Não atribuído</SelectItem>
              {analistas.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nome}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </section>
      <Separator />

      <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-setor">
        <h2 id="secao-setor" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Setor do Solicitante
        </h2>
        <Select value={ticket.setorId ?? SEM_SETOR} onValueChange={onDefinirSetor}>
          <SelectTrigger className="h-8 w-full text-xs" aria-label="Setor do solicitante">
            <SelectValue>{setor?.nome ?? "Sem setor"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={SEM_SETOR}>Sem setor</SelectItem>
              {setoresDisponiveis.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nome}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </section>
      <Separator />

      <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-info">
        <h2 id="secao-info" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Informações
        </h2>
        <dl className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Criado em</dt>
            <dd className="font-tabular font-medium text-foreground">{formatarData(ticket.criadoEm)}</dd>
          </div>
        </dl>
      </section>
      <Separator />

      <section className="flex flex-col gap-(--space-3)" aria-labelledby="secao-sla">
        <div className="flex items-center justify-between gap-2">
          <h2 id="secao-sla" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            SLA
          </h2>
          {/* Escondido quando o status já congela o SLA por conta própria
              (pausado/aguardando aprovação) ou o chamado já encerrou -- nesses
              casos o controle certo é "Retomar atendimento" no cabeçalho, não
              este, senão os dois tipos de pausa poderiam coexistir. */}
          {!STATUS_PAUSA_SLA.includes(ticketParaSla.statusKey) && !STATUS_FINAIS.includes(ticketParaSla.statusKey) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 cursor-pointer px-2 text-xs"
              onClick={ticketParaSla.slaPausadoEm ? onRetomarSla : onPausarSlaAbrir}
            >
              {ticketParaSla.slaPausadoEm ? "Retomar SLA" : "Pausar SLA"}
            </Button>
          )}
        </div>
        <SlaLinhaDetalhada rotulo="Resposta" ticket={ticketParaSla} tipo="resposta" />
        <SlaLinhaDetalhada rotulo="Solução" ticket={ticketParaSla} tipo="solucao" />
      </section>

      <Separator />
      <ResumoHoras apontamentos={apontamentos} onAbrir={onAbrirHoras} />
      <Separator />

      <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-anexos">
        <div className="flex items-center justify-between">
          <h2 id="secao-anexos" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Anexos
          </h2>
          <span className="font-tabular text-xs text-muted-foreground">{anexos.length}</span>
        </div>
        <AnexoList anexos={anexos} ticketNumero={ticket.numero} />
      </section>

      {visualizacoes.length > 0 && (
        <>
          <Separator />
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
        </>
      )}
      <Separator />

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
            onClick={onCriarFilho}
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

      {avaliacao && (
        <>
          <Separator />
          <section className="flex flex-col gap-(--space-2)" aria-labelledby="secao-avaliacao">
            <h2 id="secao-avaliacao" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Avaliação
            </h2>
            <div className="flex items-center gap-2">
              <AvaliacaoEstrelas valor={avaliacao.estrelas} somenteLeitura />
              <span className="text-xs text-muted-foreground">avaliação do atendimento</span>
            </div>
          </section>
        </>
      )}
    </>
  )
}
