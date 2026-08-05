"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { empresas, usuarios } from "@/lib/mock/data"
import { PRIORIDADE_META, STATUS_META } from "@/lib/status"
import { PRIORIDADES, STATUS_KEYS } from "@/lib/types"

const analistas = usuarios.filter((u) => u.papel === "analista")

const FILTROS = [
  { param: "empresa", label: "Cliente", opcoes: empresas.map((e) => ({ value: e.id, label: e.nome })) },
  { param: "analista", label: "Operador", opcoes: analistas.map((a) => ({ value: a.id, label: a.nome })) },
  {
    param: "status",
    label: "Status",
    opcoes: STATUS_KEYS.map((s) => ({ value: s, label: STATUS_META[s].rotuloPadrao })),
  },
  {
    param: "prioridade",
    label: "Prioridade",
    opcoes: PRIORIDADES.map((p) => ({ value: p, label: PRIORIDADE_META[p].rotulo })),
  },
] as const

// Todo filtro vive na URL (query params) — link de fila filtrada é
// compartilhável e o botão voltar do navegador funciona. Ver seção de
// navegação do design.
export function FiltroBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setParam(param: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "todos") {
      params.delete(param)
    } else {
      params.set(param, value)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const filtrosAtivos = FILTROS.some((f) => searchParams.get(f.param))

  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTROS.map((filtro) => (
        <Select
          key={filtro.param}
          value={searchParams.get(filtro.param) ?? "todos"}
          onValueChange={(value) => setParam(filtro.param, value ?? "todos")}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
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
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => router.push("?", { scroll: false })}>
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
