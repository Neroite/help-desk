"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
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
import { atualizarUsuario } from "@/lib/config/usuarios"
import type { Empresa, Papel, Usuario } from "@/lib/types"

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

interface UsuariosClientProps {
  usuarios: Usuario[]
  empresas: Empresa[]
}

// Só edição, sem criação: criar usuário exige `auth.admin.createUser`, que
// precisa da service-role key e portanto de uma rota server-side dedicada.
// Enquanto não existe onboarding real, contas nascem pelo painel do Supabase
// (ou pelo seed) e esta tela cuida de papel/empresa/nome.
export function UsuariosClient({ usuarios, empresas }: UsuariosClientProps) {
  const [dialogAberto, setDialogAberto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [nome, setNome] = useState("")
  const [papelSelecionado, setPapelSelecionado] = useState<Papel>("solicitante")
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const empresaPorId = (id: string | null) =>
    id ? empresas.find((e) => e.id === id) : undefined

  function abrirEdicao(usuario: Usuario) {
    setUsuarioEditando(usuario)
    setNome(usuario.nome)
    setPapelSelecionado(usuario.papel)
    setEmpresaId(usuario.empresaId)
    setDialogAberto(true)
  }

  async function salvar() {
    if (!usuarioEditando) return

    setSalvando(true)
    try {
      await atualizarUsuario(usuarioEditando.id, nome, papelSelecionado, empresaId)
      setDialogAberto(false)
      toast.success("Usuário atualizado com sucesso.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar o usuário."
      )
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-(--space-4)">
      <div className="flex items-center justify-between gap-(--space-4)">
        <h1 className="text-2xl font-semibold text-foreground">Usuários</h1>
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
              const empresa = empresaPorId(usuario.empresaId)
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
              {usuarioEditando ? `Editar ${usuarioEditando.nome}` : "Editar usuário"}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="usuario-nome">Nome</FieldLabel>
              <Input
                id="usuario-nome"
                name="nome"
                autoComplete="off"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
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
                value={usuarioEditando?.email ?? ""}
                readOnly
                disabled
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
                    {(value: string) => PAPEL_LABEL[value as Papel] ?? value}
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
                value={empresaId ?? undefined}
                onValueChange={(value) => setEmpresaId(value)}
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
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDialogAberto(false)}
            >
              Cancelar
            </Button>
            <Button className="cursor-pointer" onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
