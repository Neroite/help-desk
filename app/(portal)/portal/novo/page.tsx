"use client"

import { useState, type FormEvent, type MouseEvent } from "react"
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { AnexoList } from "@/components/chamado/anexo-list"
import { CategoriaProblemaSelect } from "@/components/chamado/categoria-problema-select"

// Formulário do solicitante — sem prioridade nem categoria de atendimento,
// isso é decidido no triage pelo analista (outra tela).
export default function NovoChamadoPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [catProblemaId, setCatProblemaId] = useState("")
  const [tentouEnviar, setTentouEnviar] = useState(false)

  const erroTitulo = tentouEnviar && titulo.trim() === "" ? "Informe um título." : undefined
  const erroDescricao = tentouEnviar && descricao.trim() === "" ? "Informe uma descrição." : undefined

  const podeEnviar = titulo.trim() !== "" && descricao.trim() !== ""

  function formularioTemDados() {
    return titulo.trim() !== "" || descricao.trim() !== ""
  }

  function handleCancelar(event: MouseEvent<HTMLAnchorElement>) {
    if (formularioTemDados() && !window.confirm("Descartar as alterações?")) {
      event.preventDefault()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!podeEnviar) {
      setTentouEnviar(true)
      return
    }

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
          render={<Link href="/portal" aria-label="Voltar para meus chamados" onClick={handleCancelar} />}
          nativeButton={false}
          className="cursor-pointer"
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">Abrir chamado</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-(--space-4)">
        <FieldGroup>
          <Field data-invalid={!!erroTitulo}>
            <FieldLabel htmlFor="titulo">Título</FieldLabel>
            <Input
              id="titulo"
              name="titulo"
              autoComplete="off"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Resuma o problema em poucas palavras…"
              aria-invalid={!!erroTitulo}
              required
            />
            <FieldError>{erroTitulo}</FieldError>
          </Field>

          <Field data-invalid={!!erroDescricao}>
            <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
            <Textarea
              id="descricao"
              name="descricao"
              autoComplete="off"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Descreva o problema com o máximo de detalhes possível…"
              rows={6}
              aria-invalid={!!erroDescricao}
              required
            />
            <FieldError>{erroDescricao}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="categoria">
              Categoria do problema <span className="font-normal text-muted-foreground">(opcional)</span>
            </FieldLabel>
            <CategoriaProblemaSelect value={catProblemaId} onValueChange={setCatProblemaId} />
            <FieldDescription>
              Ajuda a equipe a direcionar seu chamado mais rápido.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Anexo</FieldLabel>
            <AnexoList anexos={[]} />
          </Field>

          <div className="flex justify-end gap-(--space-2)">
            <Button
              type="button"
              variant="ghost"
              render={<Link href="/portal" onClick={handleCancelar} />}
              nativeButton={false}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button type="submit" className="cursor-pointer">
              Abrir chamado
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
