"use client"

import { useState } from "react"
import { Play, Plus, Square, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useReferenceData } from "@/lib/reference-data/provider"
import {
  excluirApontamento,
  iniciarTimer,
  pararTimer,
  registrarManual,
} from "@/lib/tickets/apontamentos"
import type { ApontamentoHoras as ApontamentoHorasItem, Usuario } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ApontamentoHorasProps {
  ticketNumero: number
  apontamentos: ApontamentoHorasItem[]
  /** Timer aberto do analista logado, em qualquer chamado — null se não há. */
  timerAberto: ApontamentoHorasItem | null
}

function formatarMinutos(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`
}

// timeZone fixo — mesmo cuidado de ticket-timeline.tsx e chamado-detalhe-client.tsx:
// servidor e cliente em fusos diferentes quebrariam a hidratação.
function formatarQuando(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

function StatTile({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-md border border-border px-3 py-2.5 text-center",
        destaque ? "bg-secondary/10" : "bg-surface"
      )}
    >
      <span className="font-tabular text-lg font-semibold text-foreground">{valor}</span>
      <span className="text-[11px] text-muted-foreground">{rotulo}</span>
    </div>
  )
}

// Totalizador + tabela "Horas apontadas" (referência Milvus, decisão 6: só o
// visual, sem coluna nova). A distinção faturável/não faturável foi removida
// do totalizador e da tabela por pedido do usuário ("não faz diferença") —
// o campo `faturavel` continua existindo no schema (registrarManual ainda
// grava `true` por padrão), só não aparece mais na UI.
export function ApontamentoHoras({
  ticketNumero,
  apontamentos,
  timerAberto,
}: ApontamentoHorasProps) {
  const { usuarioPorId, usuarioAtual } = useReferenceData()
  const [processando, setProcessando] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [minutosManual, setMinutosManual] = useState("")
  const [descricaoManual, setDescricaoManual] = useState("")

  // Apontamento em aberto não tem `minutos` ainda — só entra no total quando
  // o timer para. Por isso o `?? 0` em vez de confiar no campo.
  const encerrados = apontamentos.filter((a) => a.fim !== null)
  const totalMinutos = encerrados.reduce((soma, a) => soma + (a.minutos ?? 0), 0)

  const timerDesteChamado = timerAberto?.ticketId === ticketNumero ? timerAberto : null
  const timerDeOutroChamado = timerAberto && timerAberto.ticketId !== ticketNumero
    ? timerAberto
    : null

  async function executar(acao: () => Promise<void>, sucesso: string) {
    setProcessando(true)
    try {
      await acao()
      toast.success(sucesso)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar as horas.")
    } finally {
      setProcessando(false)
    }
  }

  async function salvarManual() {
    const minutos = Number(minutosManual)
    if (!Number.isInteger(minutos) || minutos <= 0) {
      toast.error("Informe uma duração em minutos maior que zero.")
      return
    }
    await executar(
      () =>
        registrarManual({
          ticketNumero,
          minutos,
          descricao: descricaoManual,
          faturavel: true,
        }),
      "Horas registradas."
    )
    setDialogAberto(false)
    setMinutosManual("")
    setDescricaoManual("")
  }

  return (
    <div className="flex flex-col gap-4">
      <StatTile rotulo="Total de horas" valor={formatarMinutos(totalMinutos)} destaque />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">Horas apontadas</h3>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            className="h-7 cursor-pointer text-xs"
            disabled={processando}
            onClick={() => setDialogAberto(true)}
          >
            <Plus className="size-3.5" data-icon="inline-start" />
            Novo apontamento de hora
          </Button>
          <Button
            type="button"
            size="sm"
            variant={timerDesteChamado ? "destructive" : undefined}
            className={cn(
              "h-7 cursor-pointer text-xs",
              !timerDesteChamado && "border-transparent bg-green-600 text-white hover:bg-green-700 hover:text-white"
            )}
            disabled={processando || Boolean(timerDeOutroChamado)}
            onClick={() =>
              timerDesteChamado
                ? executar(() => pararTimer(timerDesteChamado.id), "Timer encerrado.")
                : executar(() => iniciarTimer(ticketNumero), "Timer iniciado.")
            }
          >
            {timerDesteChamado ? (
              <Square className="size-3.5" data-icon="inline-start" />
            ) : (
              <Play className="size-3.5" data-icon="inline-start" />
            )}
            {timerDesteChamado ? "Parar timer" : "Iniciar timer"}
          </Button>
        </div>
      </div>

      {timerDeOutroChamado && (
        <p className="text-xs text-sla-atencao">
          Timer rodando no chamado #{timerDeOutroChamado.ticketId}. Pare-o para apontar aqui.
        </p>
      )}

      {!timerDesteChamado && encerrados.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-(--space-4) text-center text-sm text-muted-foreground">
          Nenhum apontamento ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="px-3 py-2 font-medium">Quando</th>
                <th className="px-3 py-2 font-medium">Operador</th>
                <th className="px-3 py-2 font-medium">Descrição</th>
                <th className="px-3 py-2 text-right font-medium">Horas trabalhadas</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {timerDesteChamado && (
                <tr className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{formatarQuando(timerDesteChamado.inicio)}</td>
                  <td className="px-3 py-2">
                    <OperadorCelula usuario={usuarioPorId(timerDesteChamado.analistaId)} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">—</td>
                  <td className="px-3 py-2 text-right font-tabular text-sla-atencao">
                    em andamento
                  </td>
                  <td className="px-3 py-2" />
                </tr>
              )}
              {encerrados.map((a) => {
                const podeExcluir = usuarioAtual?.id === a.analistaId || usuarioAtual?.papel === "admin"
                return (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">{formatarQuando(a.inicio)}</td>
                    <td className="px-3 py-2">
                      <OperadorCelula usuario={usuarioPorId(a.analistaId)} />
                    </td>
                    <td className="max-w-48 truncate px-3 py-2 text-muted-foreground" title={a.descricao ?? undefined}>
                      {a.descricao || "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-tabular text-foreground">
                      {formatarMinutos(a.minutos ?? 0)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {podeExcluir && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="size-6 cursor-pointer p-0"
                          aria-label="Excluir apontamento"
                          disabled={processando}
                          onClick={() =>
                            executar(() => excluirApontamento(a.id), "Apontamento excluído.")
                          }
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Lançar horas</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="apontamento-minutos">Duração (minutos)</FieldLabel>
              <Input
                id="apontamento-minutos"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={minutosManual}
                onChange={(event) => setMinutosManual(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="apontamento-descricao">Descrição</FieldLabel>
              <Input
                id="apontamento-descricao"
                autoComplete="off"
                value={descricaoManual}
                onChange={(event) => setDescricaoManual(event.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDialogAberto(false)}
            >
              Cancelar
            </Button>
            <Button className="cursor-pointer" onClick={salvarManual} disabled={processando}>
              {processando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OperadorCelula({ usuario }: { usuario: Usuario | undefined }) {
  return (
    <div className="flex items-center gap-1.5">
      <Avatar size="sm">
        <AvatarFallback>{usuario?.avatarIniciais ?? "?"}</AvatarFallback>
      </Avatar>
      <span className="text-foreground">{usuario?.nome ?? "—"}</span>
    </div>
  )
}
