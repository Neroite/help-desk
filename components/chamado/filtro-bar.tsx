"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ListFilter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useReferenceData } from "@/lib/reference-data/provider"
import { STATUS_META } from "@/lib/status"
import type { StatusKey } from "@/lib/types"

const slaOpcoes = [
  { value: "estourado", label: "Estourado" },
  { value: "prestes", label: "Prestes a estourar" },
  { value: "atencao", label: "Atenção" },
  { value: "ok", label: "No prazo" },
  { value: "pausado", label: "Pausado" },
]

const criadoOpcoes = [
  { value: "24h", label: "Últimas 24h" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "mais30d", label: "Mais de 30 dias" },
]

const TEXT_FILTROS = [
  { param: "ticket", label: "Ticket" },
  { param: "assunto", label: "Assunto" },
] as const

// Todo filtro vive na URL (query params) — link de fila filtrada é
// compartilhável e o botão voltar do navegador funciona.
export function FiltroBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { usuarios, empresas, categoriasProblema, mesasTrabalho } = useReferenceData()

  const analistas = useMemo(() => usuarios.filter((u) => u.papel === "analista"), [usuarios])
  const solicitantes = useMemo(() => usuarios.filter((u) => u.papel === "solicitante"), [usuarios])

  const selectFiltros = useMemo(() => {
    const operadorOpcoes = [
      { value: "eu", label: "Meus chamados" },
      ...analistas.map((a) => ({ value: a.id, label: a.nome })),
    ]
    const categoriaOpcoes = categoriasProblema.map((c) => ({
      value: c.id,
      label: c.paiId ? `— ${c.nome}` : c.nome,
    }))
    return [
      { param: "solicitante", label: "Solicitante", opcoes: solicitantes.map((u) => ({ value: u.id, label: u.nome })) },
      { param: "empresa", label: "Cliente", opcoes: empresas.map((e) => ({ value: e.id, label: e.nome })) },
      { param: "categoria", label: "Categoria", opcoes: categoriaOpcoes },
      { param: "analista", label: "Operador", opcoes: operadorOpcoes },
      { param: "mesa", label: "Mesa", opcoes: mesasTrabalho.map((m) => ({ value: m.id, label: m.nome })) },
      { param: "sla", label: "Resposta / Solução", opcoes: slaOpcoes },
      { param: "criado", label: "Criado", opcoes: criadoOpcoes },
    ] as const
  }, [analistas, solicitantes, empresas, categoriasProblema, mesasTrabalho])

  function setParam(param: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === "todos") {
      params.delete(param)
    } else {
      params.set(param, value)
    }
    params.delete("page")
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const filtrosAtivos =
    TEXT_FILTROS.some((f) => searchParams.get(f.param)) ||
    selectFiltros.some((f) => searchParams.get(f.param))

  const controles = (
    <>
      {TEXT_FILTROS.map((filtro) => (
        <TextFiltro key={filtro.param} param={filtro.param} label={filtro.label} setParam={setParam} />
      ))}

      {selectFiltros.map((filtro) => (
        <Select
          key={filtro.param}
          value={searchParams.get(filtro.param) ?? "todos"}
          onValueChange={(value) => setParam(filtro.param, value)}
        >
          {/* O trigger perde o rótulo visível ("Cliente", "Operador"...) assim
              que um valor é selecionado -- só o texto da opção aparece. O
              aria-label fixo garante que o nome do filtro continue anunciado
              por leitor de tela mesmo com um valor selecionado. */}
          <SelectTrigger className="h-8 w-40 text-xs md:w-40" aria-label={filtro.label}>
            <SelectValue placeholder={filtro.label}>
              {(value: string) =>
                value === "todos"
                  ? `${filtro.label}: todos`
                  : (filtro.opcoes.find((o) => o.value === value)?.label ?? value)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="todos">{filtro.label}: todos</SelectItem>
              {filtro.opcoes.map((opcao) => (
                <SelectItem key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ))}

      {filtrosAtivos && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 cursor-pointer text-xs"
          onClick={() => router.push("?", { scroll: false })}
        >
          Limpar filtros
        </Button>
      )}
    </>
  )

  return (
    <>
      {/* Telas largas: filtros inline, quebrando linha se precisar. */}
      <div className="hidden flex-wrap items-center gap-2 md:flex">{controles}</div>

      {/* Abaixo de 768px os filtros não cabem lado a lado — viram um Sheet
          disparado por um único botão, em vez de empilhar 6 controles e
          empurrar a lista pra baixo da dobra. */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" className="h-8 cursor-pointer gap-1.5 text-xs" />
            }
          >
            <ListFilter className="size-3.5" aria-hidden="true" />
            Filtros
            {filtrosAtivos && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                •
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4 pb-4">{controles}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

interface TextFiltroProps {
  param: string
  label: string
  setParam: (param: string, value: string | null) => void
}

// Input com debounce de 300ms antes de refletir na URL -- evita disparar
// navegação a cada tecla. Sincroniza de volta com a URL quando o valor
// muda por fora (ex: "Limpar filtros", navegação por link do dashboard).
function TextFiltro({ param, label, setParam }: TextFiltroProps) {
  const searchParams = useSearchParams()
  const valorUrl = searchParams.get(param) ?? ""
  const [valor, setValor] = useState(valorUrl)

  useEffect(() => {
    setValor(valorUrl)
  }, [valorUrl])

  useEffect(() => {
    if (valor === valorUrl) return
    const id = setTimeout(() => {
      setParam(param, valor.trim() === "" ? null : valor.trim())
    }, 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor])

  return (
    <Input
      value={valor}
      onChange={(event) => setValor(event.target.value)}
      placeholder={label}
      aria-label={label}
      className="h-8 w-32 text-xs"
    />
  )
}

const CHIP_PARAMS_IGNORADOS = new Set(["view", "sort", "dir", "page"])

// Pílulas de filtros ativos, cobrindo tanto os controles acima quanto os
// parâmetros só-de-URL usados pelos links do dashboard (status, aberto,
// semCategoria) -- esses não têm um <Select> dedicado aqui, mas o usuário
// ainda precisa ver por que a fila está filtrada e poder limpar cada um.
export function FiltroChips() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { usuarios, empresas, categoriasProblema, mesasTrabalho } = useReferenceData()

  const analistas = useMemo(() => usuarios.filter((u) => u.papel === "analista"), [usuarios])
  const solicitantes = useMemo(() => usuarios.filter((u) => u.papel === "solicitante"), [usuarios])

  function removerParam(param: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(param)
    params.delete("page")
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const chips: Array<{ param: string; rotulo: string }> = []

  for (const [param, valor] of searchParams.entries()) {
    if (CHIP_PARAMS_IGNORADOS.has(param) || !valor) continue

    if (param === "ticket") chips.push({ param, rotulo: `Ticket: "${valor}"` })
    else if (param === "assunto") chips.push({ param, rotulo: `Assunto: "${valor}"` })
    else if (param === "busca") chips.push({ param, rotulo: `Busca: "${valor}"` })
    else if (param === "solicitante")
      chips.push({ param, rotulo: `Solicitante: ${solicitantes.find((u) => u.id === valor)?.nome ?? valor}` })
    else if (param === "empresa")
      chips.push({ param, rotulo: `Cliente: ${empresas.find((e) => e.id === valor)?.nome ?? valor}` })
    else if (param === "categoria")
      chips.push({
        param,
        rotulo: `Categoria: ${categoriasProblema.find((c) => c.id === valor)?.nome ?? valor}`,
      })
    else if (param === "analista")
      chips.push({
        param,
        rotulo:
          valor === "eu"
            ? "Operador: meus chamados"
            : `Operador: ${analistas.find((a) => a.id === valor)?.nome ?? valor}`,
      })
    else if (param === "mesa")
      chips.push({ param, rotulo: `Mesa: ${mesasTrabalho.find((m) => m.id === valor)?.nome ?? valor}` })
    else if (param === "sla")
      chips.push({ param, rotulo: `SLA: ${slaOpcoes.find((o) => o.value === valor)?.label ?? valor}` })
    else if (param === "criado")
      chips.push({ param, rotulo: `Criado: ${criadoOpcoes.find((o) => o.value === valor)?.label ?? valor}` })
    else if (param === "status")
      chips.push({ param, rotulo: `Status: ${STATUS_META[valor as StatusKey]?.rotuloPadrao ?? valor}` })
    else if (param === "aberto" && valor === "1") chips.push({ param, rotulo: "Somente em aberto" })
    else if (param === "semCategoria" && valor === "1") chips.push({ param, rotulo: "Sem categoria" })
    else if (param === "aguardando" && valor === "1") chips.push({ param, rotulo: "Aguardando resposta" })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Filtros ativos">
      {chips.map((chip) => (
        <span
          key={chip.param}
          className="inline-flex h-6 items-center gap-1 rounded-full border border-border bg-muted/50 pl-2.5 pr-1 text-xs text-foreground"
        >
          {chip.rotulo}
          <button
            type="button"
            onClick={() => removerParam(chip.param)}
            aria-label={`Remover filtro: ${chip.rotulo}`}
            className="flex size-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  )
}
