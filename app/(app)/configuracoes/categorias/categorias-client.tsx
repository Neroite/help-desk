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
import {
  atualizarCategoriaAtendimento,
  atualizarCategoriaProblema,
  criarCategoriaAtendimento,
  criarCategoriaProblema,
} from "@/lib/config/categorias"
import type { CategoriaAtendimento, CategoriaProblema } from "@/lib/types"

// Sentinela de valor pra representar "categoria raiz" (sem pai) dentro do
// Select -- o componente base-ui nao aceita item com value="" nem value=null.
const CATEGORIA_RAIZ = "raiz"

type CategoriaEditavel =
  | { tipo: "atendimento"; item: CategoriaAtendimento }
  | { tipo: "problema"; item: CategoriaProblema }

interface CategoriasClientProps {
  categoriasAtendimento: CategoriaAtendimento[]
  categoriasProblema: CategoriaProblema[]
}

export function CategoriasClient({
  categoriasAtendimento,
  categoriasProblema,
}: CategoriasClientProps) {
  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<CategoriaEditavel | null>(null)
  const [tipoNovo, setTipoNovo] = useState<"atendimento" | "problema">("atendimento")
  const [nome, setNome] = useState("")
  const [paiId, setPaiId] = useState<string>(CATEGORIA_RAIZ)
  const [salvando, setSalvando] = useState(false)

  const categoriasProblemaRaiz = categoriasProblema.filter((c) => c.paiId === null)

  function filhosDe(paiId: string) {
    return categoriasProblema.filter((c) => c.paiId === paiId)
  }

  function abrirEdicaoAtendimento(item: CategoriaAtendimento) {
    setEditando({ tipo: "atendimento", item })
    setNome(item.nome)
    setDialogAberto(true)
  }

  function abrirEdicaoProblema(item: CategoriaProblema) {
    setEditando({ tipo: "problema", item })
    setNome(item.nome)
    setPaiId(item.paiId ?? CATEGORIA_RAIZ)
    setDialogAberto(true)
  }

  function abrirNovo(tipo: "atendimento" | "problema") {
    setEditando(null)
    setTipoNovo(tipo)
    setNome("")
    setPaiId(CATEGORIA_RAIZ)
    setDialogAberto(true)
  }

  const tipoAtual = editando?.tipo ?? tipoNovo

  // Ao editar uma categoria raiz, ela nao pode virar pai dela mesma --
  // a hierarquia so tem 2 niveis, entao excluir o proprio id ja resolve.
  const opcoesPai = categoriasProblemaRaiz.filter((c) => c.id !== editando?.item.id)

  async function salvar() {
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) {
      toast.error("Informe um nome para a categoria.")
      return
    }

    setSalvando(true)
    try {
      if (tipoAtual === "atendimento") {
        if (editando) {
          await atualizarCategoriaAtendimento(editando.item.id, nomeLimpo)
        } else {
          await criarCategoriaAtendimento(nomeLimpo)
        }
      } else {
        const paiSelecionado = paiId === CATEGORIA_RAIZ ? null : paiId
        if (editando) {
          await atualizarCategoriaProblema(editando.item.id, nomeLimpo, paiSelecionado)
        } else {
          await criarCategoriaProblema(nomeLimpo, paiSelecionado)
        }
      }
      setDialogAberto(false)
      toast.success(editando ? "Categoria atualizada com sucesso." : "Categoria criada com sucesso.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar a categoria."
      )
    } finally {
      setSalvando(false)
    }
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
              <Input
                id="categoria-nome"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
              />
            </Field>

            {tipoAtual === "problema" && (
              <Field>
                <FieldLabel htmlFor="categoria-pai">Categoria pai</FieldLabel>
                <Select
                  value={paiId}
                  onValueChange={(valor) => setPaiId(valor ?? CATEGORIA_RAIZ)}
                >
                  <SelectTrigger id="categoria-pai" className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        value === CATEGORIA_RAIZ
                          ? "Nenhuma (categoria raiz)"
                          : opcoesPai.find((c) => c.id === value)?.nome ?? value
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={CATEGORIA_RAIZ}>Nenhuma (categoria raiz)</SelectItem>
                      {opcoesPai.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
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
