"use client"

import { useState } from "react"
import { Play, Plus, Square, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import type { ApontamentoHoras as ApontamentoHorasItem } from "@/lib/types"

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
  const [faturavelManual, setFaturavelManual] = useState(true)

  // Apontamento em aberto não tem `minutos` ainda — só entra no total quando
  // o timer para. Por isso o `?? 0` em vez de confiar no campo.
  const encerrados = apontamentos.filter((a) => a.fim !== null)
  const totalMinutos = encerrados.reduce((soma, a) => soma + (a.minutos ?? 0), 0)
  const faturavelMinutos = encerrados
    .filter((a) => a.faturavel)
    .reduce((soma, a) => soma + (a.minutos ?? 0), 0)

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
          faturavel: faturavelManual,
        }),
      "Horas registradas."
    )
    setDialogAberto(false)
    setMinutosManual("")
    setDescricaoManual("")
    setFaturavelManual(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-tabular text-sm font-medium text-foreground">
          {formatarMinutos(totalMinutos)}{" "}
          <span className="font-sans text-xs font-normal text-muted-foreground">
            ({formatarMinutos(faturavelMinutos)} faturável)
          </span>
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            disabled={processando}
            onClick={() => setDialogAberto(true)}
          >
            <Plus className="size-3.5" data-icon="inline-start" />
            Lançar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={timerDesteChamado ? "destructive" : "outline"}
            className="h-7 text-xs"
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

      <ul className="flex flex-col gap-2">
        {timerDesteChamado && (
          <li className="flex flex-col gap-0.5 border-t border-border pt-2 text-xs first:border-0 first:pt-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                {usuarioPorId(timerDesteChamado.analistaId)?.nome}
              </span>
              <span className="font-tabular text-sla-atencao">em andamento</span>
            </div>
            <p className="text-muted-foreground">Timer iniciado, ainda sem duração fechada.</p>
          </li>
        )}

        {encerrados.map((a) => {
          const podeExcluir = usuarioAtual?.id === a.analistaId || usuarioAtual?.papel === "admin"
          return (
            <li
              key={a.id}
              className="flex flex-col gap-0.5 border-t border-border pt-2 text-xs first:border-0 first:pt-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {usuarioPorId(a.analistaId)?.nome}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-tabular text-muted-foreground">
                    {formatarMinutos(a.minutos ?? 0)}
                  </span>
                  {podeExcluir && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="size-6 p-0"
                      aria-label="Excluir apontamento"
                      disabled={processando}
                      onClick={() =>
                        executar(() => excluirApontamento(a.id), "Apontamento excluído.")
                      }
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </span>
              </div>
              {a.descricao && <p className="text-muted-foreground">{a.descricao}</p>}
              {a.faturavel && (
                <span className="w-fit rounded-sm bg-sla-ok/10 px-1.5 py-0.5 text-[10px] font-medium text-sla-ok">
                  Faturável
                </span>
              )}
            </li>
          )
        })}
      </ul>

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
            <Field orientation="horizontal">
              <Checkbox
                id="apontamento-faturavel"
                checked={faturavelManual}
                onCheckedChange={(marcado) => setFaturavelManual(marcado === true)}
              />
              <FieldLabel htmlFor="apontamento-faturavel">Faturável</FieldLabel>
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
