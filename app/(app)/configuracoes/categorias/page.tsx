"use client"

import { Fragment, useState } from "react"
import { Pencil, Plus } from "lucide-react"
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
import { categoriasAtendimento, categoriasProblema } from "@/lib/mock/data"
import type { CategoriaAtendimento, CategoriaProblema } from "@/lib/types"

type CategoriaEditavel =
  | { tipo: "atendimento"; item: CategoriaAtendimento }
  | { tipo: "problema"; item: CategoriaProblema }

const categoriasProblemaRaiz = categoriasProblema.filter((c) => c.paiId === null)

function filhosDe(paiId: string) {
  return categoriasProblema.filter((c) => c.paiId === paiId)
}

export default function CategoriasPage() {
  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<CategoriaEditavel | null>(null)
  const [tipoNovo, setTipoNovo] = useState<"atendimento" | "problema">("atendimento")

  function abrirEdicaoAtendimento(item: CategoriaAtendimento) {
    setEditando({ tipo: "atendimento", item })
    setDialogAberto(true)
  }

  function abrirEdicaoProblema(item: CategoriaProblema) {
    setEditando({ tipo: "problema", item })
    setDialogAberto(true)
  }

  function abrirNovo(tipo: "atendimento" | "problema") {
    setEditando(null)
    setTipoNovo(tipo)
    setDialogAberto(true)
  }

  function salvar() {
    setDialogAberto(false)
    toast.success(editando ? "Categoria atualizada com sucesso." : "Categoria criada com sucesso.")
  }

  const tituloDialog = editando
    ? `Editar ${editando.item.nome}`
    : tipoNovo === "atendimento"
      ? "Nova categoria de atendimento"
      : "Nova categoria de problema"

  return (
    <div className="flex flex-col gap-(--space-4)">
      <h1 className="text-2xl font-semibold text-foreground">Categorias</h1>

      <div className="grid grid-cols-1 gap-(--space-4) lg:grid-cols-2">
        <div className="flex flex-col gap-(--space-2)">
          <div className="flex items-center justify-between gap-(--space-2)">
            <h2 className="text-base font-medium text-foreground">Categorias de atendimento</h2>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => abrirNovo("atendimento")}
            >
              <Plus data-icon="inline-start" />
              Nova
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriasAtendimento.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell className="font-medium text-foreground">{categoria.nome}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => abrirEdicaoAtendimento(categoria)}
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
        </div>

        <div className="flex flex-col gap-(--space-2)">
          <div className="flex items-center justify-between gap-(--space-2)">
            <h2 className="text-base font-medium text-foreground">Categorias de problema</h2>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => abrirNovo("problema")}
            >
              <Plus data-icon="inline-start" />
              Nova
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriasProblemaRaiz.map((pai) => (
                  <Fragment key={pai.id}>
                    <TableRow>
                      <TableCell className="font-medium text-foreground">{pai.nome}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => abrirEdicaoProblema(pai)}
                        >
                          <Pencil data-icon="inline-start" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                    {filhosDe(pai.id).map((filho) => (
                      <TableRow key={filho.id}>
                        <TableCell className="pl-(--space-4) text-muted-foreground">
                          {filho.nome}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => abrirEdicaoProblema(filho)}
                          >
                            <Pencil data-icon="inline-start" />
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{tituloDialog}</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="categoria-nome">Nome</FieldLabel>
              <Input id="categoria-nome" defaultValue={editando?.item.nome ?? ""} />
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
