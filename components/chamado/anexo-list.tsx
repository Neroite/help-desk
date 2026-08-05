import { FileText, ImageIcon, Upload } from "lucide-react"

import type { Anexo } from "@/lib/types"

interface AnexoListProps {
  anexos: Anexo[]
}

function formatarTamanho(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

// Upload real (signed URL, Supabase Storage) entra na fase 5 — aqui é só a
// lista + estado de drop zone visual.
export function AnexoList({ anexos }: AnexoListProps) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5">
        {anexos.map((anexo) => {
          const Icon = anexo.tipo === "imagem" ? ImageIcon : FileText
          return (
            <li
              key={anexo.id}
              className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs"
            >
              <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate text-foreground">{anexo.nome}</span>
              <span className="ml-auto shrink-0 font-tabular text-muted-foreground">
                {formatarTamanho(anexo.tamanhoKb)}
              </span>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Upload className="size-3.5" aria-hidden="true" />
        Anexar arquivo
      </button>
    </div>
  )
}
