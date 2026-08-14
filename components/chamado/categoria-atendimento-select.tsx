"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useReferenceData } from "@/lib/reference-data/provider"

interface CategoriaAtendimentoSelectProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
}

// Lista plana -- categoria de atendimento não tem hierarquia (é uma
// dimensão ortogonal à categoria de problema, ex.: Remoto/Presencial).
export function CategoriaAtendimentoSelect({
  id = "categoria-atendimento",
  value,
  onValueChange,
}: CategoriaAtendimentoSelectProps) {
  const { categoriasAtendimento } = useReferenceData()
  return (
    <Select name="catAtendimentoId" value={value} onValueChange={(v) => onValueChange(v ?? "")}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Selecione uma categoria">
          {(value: string) => categoriasAtendimento.find((c) => c.id === value)?.nome}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {categoriasAtendimento.map((categoria) => (
            <SelectItem key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
