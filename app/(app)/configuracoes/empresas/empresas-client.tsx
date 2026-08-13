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
import { atualizarEmpresa, criarEmpresa } from "@/lib/config/empresas"
import { STATUS_META } from "@/lib/status"
import { STATUS_KEYS, type Empresa, type StatusKey } from "@/lib/types"

// Só esse status é uma escolha real por empresa — os outros 5 são
// obrigatórios em toda fila (ver lib/config/empresas.ts).
const STATUS_OPCIONAL: StatusKey = "aguardando_aprovacao"
const STATUS_FIXOS = STATUS_KEYS.filter((s) => s !== STATUS_OPCIONAL)

interface EmpresasClientProps {
  empresas: Empresa[]
}

export function EmpresasClient({ empresas }: EmpresasClientProps) {
  const [dialogAberto, setDialogAberto] = useState(false)
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null)
  const [nome, setNome] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [aguardandoAtivo, setAguardandoAtivo] = useState(false)
  const [rotulos, setRotulos] = useState<Partial<Record<StatusKey, string>>>({})
  const [salvando, setSalvando] = useState(false)

  function abrirEdicao(empresa: Empresa) {
    setEmpresaEditando(empresa)
    setNome(empresa.nome)
    setCnpj(empresa.cnpj)
    setAguardandoAtivo(empresa.statusAtivos.includes(STATUS_OPCIONAL))
    setRotulos(empresa.statusRotulos)
    setDialogAberto(true)
  }

  function abrirNovo() {
    setEmpresaEditando(null)
    setNome("")
    setCnpj("")
    setAguardandoAtivo(false)
    setRotulos({})
    setDialogAberto(true)
  }

  function atualizarRotulo(statusKey: StatusKey, valor: string) {
    setRotulos((atual) => ({ ...atual, [statusKey]: valor }))
  }

  async function salvar() {
    const nomeLimpo = nome.trim()
    const cnpjLimpo = cnpj.trim()
    if (!nomeLimpo || !cnpjLimpo) {
      toast.error("Informe nome e CNPJ da empresa.")
      return
    }

    setSalvando(true)
    try {
      if (empresaEditando) {
        await atualizarEmpresa(empresaEditando.id, nomeLimpo, cnpjLimpo, aguardandoAtivo, rotulos)
      } else {
        await criarEmpresa(nomeLimpo, cnpjLimpo, aguardandoAtivo, rotulos)
      }
      setDialogAberto(false)
      toast.success(empresaEditando ? "Empresa atualizada com sucesso." : "Empresa criada com sucesso.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a empresa.")
    } finally {
      setSalvando(false)
    }
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
            <DialogTitle>{empresaEditando ? `Editar ${empresaEditando.nome}` : "Nova empresa"}</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="empresa-nome">Nome</FieldLabel>
              <Input id="empresa-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="empresa-cnpj">CNPJ</FieldLabel>
              <Input id="empresa-cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
            </Field>

            <Field>
              <FieldLabel>Status da fila para esta empresa</FieldLabel>
              <div className="flex flex-col gap-(--space-2)">
                {/* 5 status fixos — sempre ativos em toda empresa, sem checkbox
                    (só o rótulo customizado é editável). */}
                {STATUS_FIXOS.map((statusKey) => (
                  <div
                    key={statusKey}
                    className="flex items-center gap-(--space-3) rounded-lg border border-border p-(--space-2)"
                  >
                    <div className="flex flex-1 items-center gap-(--space-2)">
                      <span className="text-sm text-foreground">
                        {STATUS_META[statusKey].rotuloPadrao}
                      </span>
                      <span className="text-xs text-muted-foreground">sempre ativo</span>
                    </div>
                    <Input
                      placeholder="Rótulo customizado"
                      value={rotulos[statusKey] ?? ""}
                      onChange={(e) => atualizarRotulo(statusKey, e.target.value)}
                      className="w-48"
                    />
                  </div>
                ))}

                {/* Único status opcional — a empresa escolhe se usa etapa de
                    aprovação antes de iniciar o atendimento. */}
                <div className="flex items-center gap-(--space-3) rounded-lg border border-border p-(--space-2)">
                  <label className="flex flex-1 cursor-pointer items-center gap-(--space-2)">
                    <Checkbox
                      checked={aguardandoAtivo}
                      onCheckedChange={(checked) => setAguardandoAtivo(checked === true)}
                    />
                    <span className="text-sm text-foreground">
                      {STATUS_META[STATUS_OPCIONAL].rotuloPadrao}
                    </span>
                  </label>
                  <Input
                    placeholder="Rótulo customizado"
                    value={rotulos[STATUS_OPCIONAL] ?? ""}
                    onChange={(e) => atualizarRotulo(STATUS_OPCIONAL, e.target.value)}
                    className="w-48"
                  />
                </div>
              </div>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              disabled={salvando}
              onClick={() => setDialogAberto(false)}
            >
              Cancelar
            </Button>
            <Button className="cursor-pointer" disabled={salvando} onClick={salvar}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
