"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useReferenceData } from "@/lib/reference-data/provider"

interface CategoriaProblemaSelectProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
}

// Bloco idêntico usado na abertura de chamado do analista e do
// solicitante (2 níveis: categoria-pai > subcategoria) — extraído pra não
// divergir os dois formulários quando a árvore de categorias mudar. As
// subcategorias de cada categoria raiz aparecem agrupadas sob um
// SelectLabel com o nome da categoria pai; raízes sem subcategoria viram
// elas mesmas um item selecionável, fora de qualquer grupo.
export function CategoriaProblemaSelect({
  id = "categoria",
  value,
  onValueChange,
}: CategoriaProblemaSelectProps) {
  const { categoriasProblema } = useReferenceData()

  const raizes = categoriasProblema.filter((c) => c.paiId === null)
  const filhosDe = (paiId: string) => categoriasProblema.filter((c) => c.paiId === paiId)

  return (
    <Select name="catProblemaId" value={value} onValueChange={(v) => onValueChange(v ?? "")}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Selecione uma categoria">
          {(value: string) => categoriasProblema.find((c) => c.id === value)?.nome}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {raizes.map((raiz) => {
          const filhos = filhosDe(raiz.id)
          if (filhos.length === 0) {
            return (
              <SelectGroup key={raiz.id}>
                <SelectItem value={raiz.id}>{raiz.nome}</SelectItem>
              </SelectGroup>
            )
          }
          return (
            <SelectGroup key={raiz.id}>
              <SelectLabel>{raiz.nome}</SelectLabel>
              {filhos.map((filho) => (
                <SelectItem key={filho.id} value={filho.id}>
                  {filho.nome}
                </SelectItem>
              ))}
            </SelectGroup>
          )
        })}
      </SelectContent>
    </Select>
  )
}
