"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AnexoList } from "@/components/chamado/anexo-list"
import { categoriasProblema } from "@/lib/mock/data"

// Formulário do solicitante — sem prioridade nem categoria de atendimento,
// isso é decidido no triage pelo analista (outra tela).
export default function NovoChamadoPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [catProblemaId, setCatProblemaId] = useState("")

  const podeEnviar = titulo.trim() !== "" && descricao.trim() !== ""

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!podeEnviar) return

    // Mock — sem backend ainda, só simula a abertura e volta pra lista.
    toast.success("Chamado aberto com sucesso!")
    router.push("/portal")
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-(--space-4)">
      <div className="flex items-center gap-(--space-2)">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/portal" aria-label="Voltar para meus chamados" />}
          nativeButton={false}
          className="cursor-pointer"
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">Abrir chamado</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-(--space-4)">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="titulo">Título</FieldLabel>
            <Input
              id="titulo"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Resuma o problema em poucas palavras"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Descreva o problema com o máximo de detalhes possível"
              rows={6}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="categoria">
              Categoria do problema <span className="font-normal text-muted-foreground">(opcional)</span>
            </FieldLabel>
            <Select value={catProblemaId} onValueChange={(value) => setCatProblemaId(value ?? "")}>
              <SelectTrigger id="categoria" className="w-full">
                <SelectValue placeholder="Selecione uma categoria">
                  {(value: string) => {
                    const categoria = categoriasProblema.find((c) => c.id === value)
                    return categoria ? (categoria.paiId ? `— ${categoria.nome}` : categoria.nome) : undefined
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categoriasProblema.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.paiId ? `— ${categoria.nome}` : categoria.nome}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              Ajuda a equipe a direcionar seu chamado mais rápido.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Anexo</FieldLabel>
            <AnexoList anexos={[]} />
          </Field>

          <div className="flex justify-end gap-(--space-2)">
            <Button type="button" variant="ghost" render={<Link href="/portal" />} nativeButton={false} className="cursor-pointer">
              Cancelar
            </Button>
            <Button type="submit" disabled={!podeEnviar} className="cursor-pointer">
              Abrir chamado
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
