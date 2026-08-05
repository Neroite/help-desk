"use client"

import { useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { StatusBadge } from "@/components/chamado/status-badge"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { empresas } from "@/lib/mock/data"
import { STATUS_META } from "@/lib/status"
import { STATUS_KEYS, type Empresa } from "@/lib/types"

export default function EmpresasPage() {
  const [dialogAberto, setDialogAberto] = useState(false)
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null)

  function abrirEdicao(empresa: Empresa) {
    setEmpresaEditando(empresa)
    setDialogAberto(true)
  }

  function abrirNovo() {
    setEmpresaEditando(null)
    setDialogAberto(true)
  }

  function salvar() {
    setDialogAberto(false)
    toast.success(
      empresaEditando ? "Empresa atualizada com sucesso." : "Empresa criada com sucesso."
    )
  }

  return (
    <div className="flex flex-col gap-(--space-4)">
      <div className="flex items-center justify-between gap-(--space-4)">
        <h1 className="text-2xl font-semibold text-foreground">Empresas</h1>
        <Button onClick={abrirNovo} className="cursor-pointer">
          <Plus data-icon="inline-start" />
          Nova empresa
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Status ativos</TableHead>
              <TableHead>Catálogo em uso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresas.map((empresa) => (
              <TableRow key={empresa.id}>
                <TableCell className="font-medium text-foreground">{empresa.nome}</TableCell>
                <TableCell className="text-muted-foreground">{empresa.cnpj}</TableCell>
                <TableCell className="text-muted-foreground">
                  {empresa.statusAtivos.length} de {STATUS_KEYS.length}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {empresa.statusAtivos.map((statusKey) => (
                      <StatusBadge
                        key={statusKey}
                        statusKey={statusKey}
                        rotulo={empresa.statusRotulos[statusKey]}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => abrirEdicao(empresa)}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {empresaEditando ? `Editar ${empresaEditando.nome}` : "Nova empresa"}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="empresa-nome">Nome</FieldLabel>
              <Input id="empresa-nome" defaultValue={empresaEditando?.nome ?? ""} />
            </Field>
            <Field>
              <FieldLabel htmlFor="empresa-cnpj">CNPJ</FieldLabel>
              <Input id="empresa-cnpj" defaultValue={empresaEditando?.cnpj ?? ""} />
            </Field>

            <Field>
              <FieldLabel>Status ativos para esta empresa</FieldLabel>
              <div className="flex flex-col gap-(--space-2)">
                {STATUS_KEYS.map((statusKey) => {
                  const ativo = empresaEditando?.statusAtivos.includes(statusKey) ?? false
                  const rotuloAtual = empresaEditando?.statusRotulos[statusKey] ?? ""
                  return (
                    <div
                      key={statusKey}
                      className="flex items-center gap-(--space-3) rounded-lg border border-border p-(--space-2)"
                    >
                      <label className="flex flex-1 cursor-pointer items-center gap-(--space-2)">
                        <Checkbox defaultChecked={ativo} />
                        <span className="text-sm text-foreground">
                          {STATUS_META[statusKey].rotuloPadrao}
                        </span>
                      </label>
                      <Input
                        placeholder="Rótulo customizado"
                        defaultValue={rotuloAtual}
                        className="w-48"
                      />
                    </div>
                  )
                })}
              </div>
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
