"use client"

import { useRef, useState } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { atualizarSlaPolicy } from "@/lib/config/sla"
import { horasParaMinutos, minutosParaHoras } from "@/lib/sla/conversao"
import { PRIORIDADE_META } from "@/lib/status"
import type { SlaPolicy } from "@/lib/types"

function formatarMinutos(minutos: number): string {
  const horas = Math.floor(minutos / 60)
  const restoMin = minutos % 60
  if (horas === 0) return `${restoMin}min`
  if (restoMin === 0) return `${horas}h`
  return `${horas}h ${restoMin}min`
}

function rotuloPrioridade(policy: SlaPolicy): string {
  return policy.prioridade ? PRIORIDADE_META[policy.prioridade].rotulo : "Padrão (sem prioridade)"
}

interface SlaClientProps {
  policies: SlaPolicy[]
}

export function SlaClient({ policies }: SlaClientProps) {
  const [dialogAberto, setDialogAberto] = useState(false)
  const [policyEditando, setPolicyEditando] = useState<SlaPolicy | null>(null)
  const [salvando, setSalvando] = useState(false)
  const respostaRef = useRef<HTMLInputElement>(null)
  const solucaoRef = useRef<HTMLInputElement>(null)

  function abrirEdicao(policy: SlaPolicy) {
    setPolicyEditando(policy)
    setDialogAberto(true)
  }

  async function salvar() {
    if (!policyEditando) return
    const respostaHoras = Number(respostaRef.current?.value ?? 0)
    const solucaoHoras = Number(solucaoRef.current?.value ?? 0)
    setSalvando(true)
    try {
      await atualizarSlaPolicy(
        policyEditando.prioridade,
        horasParaMinutos(respostaHoras),
        horasParaMinutos(solucaoHoras)
      )
      setDialogAberto(false)
      toast.success("Política de SLA atualizada com sucesso.")
    } catch {
      toast.error("Não foi possível atualizar a política de SLA.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-(--space-4)">
      <h1 className="text-2xl font-semibold text-foreground">Política de SLA</h1>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prioridade</TableHead>
              <TableHead>Resposta</TableHead>
              <TableHead>Solução</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.prioridade ?? "padrao"}>
                <TableCell className="font-medium text-foreground">
                  {rotuloPrioridade(policy)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatarMinutos(policy.minutosResposta)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatarMinutos(policy.minutosSolucao)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => abrirEdicao(policy)}
                  >
                    <Pencil data-icon="inline-start" />
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {policyEditando ? `Editar SLA — ${rotuloPrioridade(policyEditando)}` : "Editar SLA"}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="sla-resposta">Tempo de resposta (horas)</FieldLabel>
              <Input
                id="sla-resposta"
                ref={respostaRef}
                type="number"
                min={0}
                step="0.25"
                defaultValue={minutosParaHoras(policyEditando?.minutosResposta ?? 0)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sla-solucao">Tempo de solução (horas)</FieldLabel>
              <Input
                id="sla-solucao"
                ref={solucaoRef}
                type="number"
                min={0}
                step="0.25"
                defaultValue={minutosParaHoras(policyEditando?.minutosSolucao ?? 0)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDialogAberto(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button className="cursor-pointer" onClick={salvar} disabled={salvando}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
