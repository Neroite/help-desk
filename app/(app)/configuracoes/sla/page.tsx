"use client"

import { useState } from "react"
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
import { slaPolicies } from "@/lib/mock/data"
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

export default function SlaPage() {
  const [dialogAberto, setDialogAberto] = useState(false)
  const [policyEditando, setPolicyEditando] = useState<SlaPolicy | null>(null)

  function abrirEdicao(policy: SlaPolicy) {
    setPolicyEditando(policy)
    setDialogAberto(true)
  }

  function salvar() {
    setDialogAberto(false)
    toast.success("Política de SLA atualizada com sucesso.")
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
            {slaPolicies.map((policy) => (
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
              <FieldLabel htmlFor="sla-resposta">Tempo de resposta (minutos)</FieldLabel>
              <Input
                id="sla-resposta"
                type="number"
                min={0}
                defaultValue={policyEditando?.minutosResposta ?? 0}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sla-solucao">Tempo de solução (minutos)</FieldLabel>
              <Input
                id="sla-solucao"
                type="number"
                min={0}
                defaultValue={policyEditando?.minutosSolucao ?? 0}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button className="cursor-pointer" onClick={salvar}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
