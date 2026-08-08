"use client"

import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { AnexoList } from "@/components/chamado/anexo-list"
import { CategoriaProblemaSelect } from "@/components/chamado/categoria-problema-select"
import {
  Field,
  FieldDescription,
  FieldError,
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
import { useReferenceData } from "@/lib/reference-data/provider"
import { criarChamado } from "@/lib/tickets/actions"

interface NovoChamadoFormProps {
  formId: string
  onCriado: (numero: number) => void
  onSujoChange?: (sujo: boolean) => void
}

// Só os campos — sem header nem barra de ações, pra servir tanto a página
// cheia (/chamados/novo) quanto o modal (NovoChamadoDialog). Abertura em
// nome do cliente, feita pelo analista: não pede prioridade nem categoria
// de atendimento, isso é decidido no triage.
export function NovoChamadoForm({ formId, onCriado, onSujoChange }: NovoChamadoFormProps) {
  const { empresas, usuarios } = useReferenceData()
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [solicitanteId, setSolicitanteId] = useState("")
  const [catProblemaId, setCatProblemaId] = useState("")
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const solicitantes = usuarios.filter(
    (usuario) => usuario.papel === "solicitante" && usuario.empresaId === empresaId
  )

  function handleEmpresaChange(value: string) {
    setEmpresaId(value)
    setSolicitanteId("")
  }

  const erroTitulo = tentouEnviar && titulo.trim() === "" ? "Informe um título." : undefined
  const erroDescricao = tentouEnviar && descricao.trim() === "" ? "Informe uma descrição." : undefined
  const erroEmpresa = tentouEnviar && empresaId === "" ? "Selecione o cliente." : undefined
  const erroSolicitante = tentouEnviar && solicitanteId === "" ? "Selecione o solicitante." : undefined

  const podeEnviar = titulo.trim() !== "" && descricao.trim() !== "" && empresaId !== "" && solicitanteId !== ""
  const sujo = titulo.trim() !== "" || descricao.trim() !== "" || empresaId !== "" || solicitanteId !== ""

  useEffect(() => {
    onSujoChange?.(sujo)
  }, [sujo, onSujoChange])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!podeEnviar || enviando) {
      setTentouEnviar(true)
      return
    }

    setEnviando(true)
    try {
      const { numero } = await criarChamado({
        titulo,
        descricao,
        empresaId,
        solicitanteId,
        catProblemaId: catProblemaId || null,
      })
      onCriado(numero)
    } catch {
      toast.error("Não foi possível criar o chamado.")
      setEnviando(false)
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="grid gap-(--space-4) md:grid-cols-[1.6fr_1fr]">
      <FieldGroup>
        <Field data-invalid={!!erroEmpresa}>
          <FieldLabel htmlFor="empresa">Cliente</FieldLabel>
          <Select
            name="empresaId"
            value={empresaId}
            onValueChange={(value) => handleEmpresaChange(value ?? "")}
          >
            <SelectTrigger id="empresa" className="w-full" aria-invalid={!!erroEmpresa}>
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
          <FieldError>{erroEmpresa}</FieldError>
        </Field>

        <Field data-invalid={!!erroSolicitante}>
          <FieldLabel htmlFor="solicitante">Solicitante</FieldLabel>
          <Select
            name="solicitanteId"
            value={solicitanteId}
            onValueChange={(value) => setSolicitanteId(value ?? "")}
            disabled={!empresaId}
          >
            <SelectTrigger id="solicitante" className="w-full" aria-invalid={!!erroSolicitante}>
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
          <FieldError>{erroSolicitante}</FieldError>
        </Field>

        <Field data-invalid={!!erroTitulo}>
          <FieldLabel htmlFor="titulo">Título</FieldLabel>
          <Input
            id="titulo"
            name="titulo"
            autoComplete="off"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Resumo do problema…"
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
            placeholder="Detalhe o que está acontecendo…"
            aria-invalid={!!erroDescricao}
            required
          />
          <FieldError>{erroDescricao}</FieldError>
        </Field>

        <Field>
          <FieldLabel>Anexo</FieldLabel>
          <AnexoList anexos={[]} />
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="categoria">
            Categoria do problema <span className="font-normal text-muted-foreground">(opcional)</span>
          </FieldLabel>
          <CategoriaProblemaSelect value={catProblemaId} onValueChange={setCatProblemaId} />
        </Field>
      </FieldGroup>
    </form>
  )
}
