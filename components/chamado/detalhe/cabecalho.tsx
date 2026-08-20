"use client"

import { Check, GitMerge, MoreHorizontal, Network, Pause, Play, Printer, X } from "lucide-react"

import { AcaoToolbar } from "@/components/chamado/detalhe/acoes-toolbar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PRIORIDADE_META, STATUS_META } from "@/lib/status"
import { PRIORIDADES, STATUS_FINAIS, STATUS_KEYS, type Empresa, type Prioridade, type StatusKey, type Ticket, type Usuario } from "@/lib/types"

// Sentinela de valor pra representar "sem prioridade" dentro do Select --
// o componente base-ui não aceita item com value="" nem value=null. Exportado
// porque o chamador (handlePrioridadeChange) precisa reconhecer o mesmo
// valor pra interpretar "sem prioridade" como null.
export const SEM_PRIORIDADE = "sem_prioridade"

interface ChamadoCabecalhoProps {
  ticket: Ticket
  statusKey: StatusKey
  prioridade: Prioridade | null
  empresa: Empresa | undefined
  analista: Usuario | undefined
  onStatusChange: (value: StatusKey | null) => void
  onPrioridadeChange: (value: string | null) => void
  onPausarAbrir: () => void
  onRetomar: () => void
  onIniciarAtendimento: () => void
  onConciliarAbrir: () => void
  onCriarFilhoAbrir: () => void
}

export function ChamadoCabecalho({
  ticket,
  statusKey,
  prioridade,
  empresa,
  analista,
  onStatusChange,
  onPrioridadeChange,
  onPausarAbrir,
  onRetomar,
  onIniciarAtendimento,
  onConciliarAbrir,
  onCriarFilhoAbrir,
}: ChamadoCabecalhoProps) {
  return (
    <header className="flex flex-col gap-(--space-2) border-b border-border pb-(--space-4)">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Conciliar/Criar filho/Imprimir são secundárias: escondidas abaixo
              de sm (375px com o resto do cabeçalho não cabe 6 botões de 40px
              lado a lado) e agrupadas num menu "⋯" só nessa faixa. */}
          <div className="hidden items-center gap-1.5 sm:flex">
            <AcaoToolbar icon={GitMerge} rotulo="Conciliar" tone="azul" onClick={onConciliarAbrir} />
            <AcaoToolbar icon={Network} rotulo="Criar chamado filho" tone="azul" onClick={onCriarFilhoAbrir} />
            <AcaoToolbar icon={Printer} rotulo="Imprimir" tone="azul" onClick={() => window.print()} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Mais ações"
              className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:hidden"
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onConciliarAbrir}>
                <GitMerge data-icon="inline-start" aria-hidden="true" />
                Conciliar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCriarFilhoAbrir}>
                <Network data-icon="inline-start" aria-hidden="true" />
                Criar chamado filho
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer data-icon="inline-start" aria-hidden="true" />
                Imprimir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Slots fixos (não um ternário que troca de posição): Pausar e
              Play/Retomar sempre ocupam o mesmo lugar na barra, cada um
              desabilitado quando não se aplica ao status atual. */}
          <AcaoToolbar
            icon={Pause}
            rotulo="Pausar chamado"
            tone="amarelo"
            onClick={onPausarAbrir}
            disabled={statusKey !== "em_andamento"}
          />
          <AcaoToolbar
            icon={Play}
            rotulo={statusKey === "pausado" ? "Retomar atendimento" : "Iniciar atendimento"}
            tone="verde"
            onClick={statusKey === "pausado" ? onRetomar : onIniciarAtendimento}
            disabled={statusKey === "em_andamento" || STATUS_FINAIS.includes(statusKey)}
          />
          <AcaoToolbar icon={Check} rotulo="Finalizar chamado" tone="preto" onClick={() => onStatusChange("finalizado")} />
          <AcaoToolbar icon={X} rotulo="Cancelar chamado" tone="vermelho" onClick={() => onStatusChange("cancelado")} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusKey} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Status do chamado">
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

        <Select value={prioridade ?? SEM_PRIORIDADE} onValueChange={onPrioridadeChange}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Prioridade do chamado">
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
      </div>
    </header>
  )
}
