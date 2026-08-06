"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { categoriasProblema } from "@/lib/mock/data"

interface CategoriaProblemaSelectProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
}

// Bloco idêntico usado na abertura de chamado do analista e do
// solicitante (2 níveis: categoria-pai > subcategoria, prefixo "—" na
// subcategoria) — extraído pra não divergir os dois formulários quando a
// árvore de categorias mudar.
export function CategoriaProblemaSelect({
  id = "categoria",
  value,
  onValueChange,
}: CategoriaProblemaSelectProps) {
  return (
    <Select name="catProblemaId" value={value} onValueChange={(v) => onValueChange(v ?? "")}>
      <SelectTrigger id={id} className="w-full">
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
  )
}
