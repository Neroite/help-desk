"use client"

import { useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { empresaPorId, empresas, usuarios } from "@/lib/mock/data"
import type { Papel, Usuario } from "@/lib/types"

const PAPEL_LABEL: Record<Papel, string> = {
  admin: "Admin",
  analista: "Analista",
  solicitante: "Solicitante",
}

const PAPEL_VARIANT: Record<Papel, "default" | "secondary" | "outline"> = {
  admin: "default",
  analista: "secondary",
  solicitante: "outline",
}

export default function UsuariosPage() {
  const [dialogAberto, setDialogAberto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [papelSelecionado, setPapelSelecionado] = useState<Papel>("solicitante")

  function abrirEdicao(usuario: Usuario) {
    setUsuarioEditando(usuario)
    setPapelSelecionado(usuario.papel)
    setDialogAberto(true)
  }

  function abrirNovo() {
    setUsuarioEditando(null)
    setPapelSelecionado("solicitante")
    setDialogAberto(true)
  }

  function salvar() {
    setDialogAberto(false)
    toast.success(
      usuarioEditando ? "Usuário atualizado com sucesso." : "Usuário criado com sucesso."
    )
  }

  return (
    <div className="flex flex-col gap-(--space-4)">
      <div className="flex items-center justify-between gap-(--space-4)">
        <h1 className="text-2xl font-semibold text-foreground">Usuários</h1>
        <Button onClick={abrirNovo} className="cursor-pointer">
          <Plus data-icon="inline-start" aria-hidden="true" />
          Novo usuário
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => {
              const empresa = usuario.empresaId ? empresaPorId(usuario.empresaId) : undefined
              return (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <Avatar size="sm">
                      <AvatarFallback>{usuario.avatarIniciais}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{usuario.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant={PAPEL_VARIANT[usuario.papel]}>
                      {PAPEL_LABEL[usuario.papel]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {empresa?.nome ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => abrirEdicao(usuario)}
                    >
                      <Pencil data-icon="inline-start" aria-hidden="true" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {usuarioEditando ? `Editar ${usuarioEditando.nome}` : "Novo usuário"}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="usuario-nome">Nome</FieldLabel>
              <Input
                id="usuario-nome"
                name="nome"
                autoComplete="off"
                defaultValue={usuarioEditando?.nome ?? ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="usuario-email">E-mail</FieldLabel>
              <Input
                id="usuario-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                defaultValue={usuarioEditando?.email ?? ""}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="usuario-papel">Papel</FieldLabel>
              <Select
                name="papel"
                value={papelSelecionado}
                onValueChange={(value) => setPapelSelecionado(value as Papel)}
              >
                <SelectTrigger id="usuario-papel" className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      ({ admin: "Admin", analista: "Analista", solicitante: "Solicitante" }[value] ?? value)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="analista">Analista</SelectItem>
                    <SelectItem value="solicitante">Solicitante</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="usuario-empresa">Empresa</FieldLabel>
              <Select
                name="empresaId"
                disabled={papelSelecionado !== "solicitante"}
                defaultValue={usuarioEditando?.empresaId ?? undefined}
              >
                <SelectTrigger id="usuario-empresa" className="w-full">
                  <SelectValue placeholder="Selecione a empresa">
                    {(value: string) => empresas.find((e) => e.id === value)?.nome}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
