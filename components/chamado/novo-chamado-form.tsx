"use client"

import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { AnexoList } from "@/components/chamado/anexo-list"
import { CategoriaProblemaSelect } from "@/components/chamado/categoria-problema-select"
import { ContatosSelect } from "@/components/chamado/contatos-select"
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
import { anexarArquivo } from "@/lib/tickets/anexos"

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
  const { empresas, mesasTrabalho } = useReferenceData()
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [contatoIds, setContatoIds] = useState<string[]>([])
  const [catProblemaId, setCatProblemaId] = useState("")
  const [mesaId, setMesaId] = useState("")
  const [pendentes, setPendentes] = useState<File[]>([])
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [enviando, setEnviando] = useState(false)

  function handleEmpresaChange(value: string) {
    setEmpresaId(value)
    setContatoIds([])
  }

  const erroTitulo = tentouEnviar && titulo.trim() === "" ? "Informe um título." : undefined
  const erroDescricao = tentouEnviar && descricao.trim() === "" ? "Informe uma descrição." : undefined
  const erroEmpresa = tentouEnviar && empresaId === "" ? "Selecione o cliente." : undefined
  const erroContatos = tentouEnviar && contatoIds.length === 0 ? "Selecione ao menos um contato." : undefined

  const podeEnviar = titulo.trim() !== "" && descricao.trim() !== "" && empresaId !== "" && contatoIds.length > 0
  const sujo = titulo.trim() !== "" || descricao.trim() !== "" || empresaId !== "" || contatoIds.length > 0

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
        contatoIds,
        catProblemaId: catProblemaId || null,
        mesaId: mesaId || null,
      })

      if (pendentes.length > 0) {
        const falhas: string[] = []
        for (const arquivo of pendentes) {
          const formData = new FormData()
          formData.set("arquivo", arquivo)
          try {
            await anexarArquivo(formData, { ticketNumero: numero })
          } catch {
            falhas.push(arquivo.name)
          }
        }
        if (falhas.length > 0) {
          toast.error(`Chamado criado, mas falhou o anexo: ${falhas.join(", ")}. Envie de novo pelo chamado.`)
        }
      }

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

        <Field data-invalid={!!erroContatos}>
          <FieldLabel htmlFor="contatos">Contatos</FieldLabel>
          <ContatosSelect
            id="contatos"
            empresaId={empresaId}
            contatoIds={contatoIds}
            onContatoIdsChange={setContatoIds}
          />
          <FieldDescription>O primeiro contato selecionado é o dono do chamado.</FieldDescription>
          <FieldError>{erroContatos}</FieldError>
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
          <AnexoList anexos={[]} pendentes={pendentes} onPendentesChange={setPendentes} />
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="categoria">
            Categoria do problema <span className="font-normal text-muted-foreground">(opcional)</span>
          </FieldLabel>
          <CategoriaProblemaSelect value={catProblemaId} onValueChange={setCatProblemaId} />
        </Field>

        <Field>
          <FieldLabel htmlFor="mesa">
            Mesa de trabalho <span className="font-normal text-muted-foreground">(opcional)</span>
          </FieldLabel>
          <Select name="mesaId" value={mesaId} onValueChange={(value) => setMesaId(value ?? "")}>
            <SelectTrigger id="mesa" className="w-full">
              <SelectValue placeholder="Selecione a mesa">
                {(value: string) => mesasTrabalho.find((m) => m.id === value)?.nome}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {mesasTrabalho.map((mesa) => (
                  <SelectItem key={mesa.id} value={mesa.id}>
                    {mesa.nome}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </form>
  )
}
