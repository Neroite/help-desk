"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { categoriasProblema, empresas, usuarios } from "@/lib/mock/data"

// Abertura em nome do cliente, feita pelo analista — diferente do
// formulário do solicitante (outra tela). Por isso não pede prioridade
// nem categoria de atendimento: isso é decidido no triage, na tela de
// detalhe do chamado.
export default function NovoChamadoPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [solicitanteId, setSolicitanteId] = useState("")
  const [catProblemaId, setCatProblemaId] = useState("")

  const solicitantes = usuarios.filter(
    (usuario) => usuario.papel === "solicitante" && usuario.empresaId === empresaId
  )

  function handleEmpresaChange(value: string) {
    setEmpresaId(value)
    setSolicitanteId("")
  }

  const podeEnviar = titulo.trim() !== "" && descricao.trim() !== "" && empresaId !== "" && solicitanteId !== ""

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!podeEnviar) return

    // Mock — sem backend ainda, só simula a criação e volta pra fila.
    console.log("Novo chamado (mock, sem persistência):", {
      titulo,
      descricao,
      empresaId,
      solicitanteId,
      catProblemaId: catProblemaId || null,
    })
    toast.success("Chamado criado com sucesso.")
    router.push("/chamados")
  }

  return (
    <div className="flex flex-col gap-(--space-4)">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/chamados" aria-label="Voltar para chamados" />}
          nativeButton={false}
          className="cursor-pointer"
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">Novo chamado</h1>
      </div>
      <p className="max-w-xl text-sm text-muted-foreground">
        Abertura em nome do cliente. Prioridade e categoria de atendimento são definidas depois, no triage.
      </p>

      <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-(--space-4)">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="titulo">Título</FieldLabel>
            <Input
              id="titulo"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Resumo do problema"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Detalhe o que está acontecendo"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="empresa">Cliente</FieldLabel>
            <Select value={empresaId} onValueChange={(value) => handleEmpresaChange(value ?? "")}>
              <SelectTrigger id="empresa" className="w-full">
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

          <Field>
            <FieldLabel htmlFor="solicitante">Solicitante</FieldLabel>
            <Select
              value={solicitanteId}
              onValueChange={(value) => setSolicitanteId(value ?? "")}
              disabled={!empresaId}
            >
              <SelectTrigger id="solicitante" className="w-full">
                <SelectValue placeholder={empresaId ? "Selecione o solicitante" : "Escolha a empresa primeiro"}>
                  {(value: string) => solicitantes.find((u) => u.id === value)?.nome}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {solicitantes.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nome}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {empresaId && solicitantes.length === 0 && (
              <FieldDescription>Essa empresa não tem solicitantes cadastrados.</FieldDescription>
            )}
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
          </Field>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              render={<Link href="/chamados" />}
              nativeButton={false}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!podeEnviar} className="cursor-pointer">
              Criar chamado
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
