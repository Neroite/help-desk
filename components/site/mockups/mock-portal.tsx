import { Paperclip } from "lucide-react"

import { BrowserChrome } from "@/components/site/browser-chrome"
import { MockStatus } from "@/components/site/mockups/pecas"

const CHAMADOS = [
  { numero: "#1041", titulo: "Acesso ao sistema financeiro", status: "a-fazer" as const, rotulo: "A fazer" },
  { numero: "#1038", titulo: "Migração de e-mail corporativo", status: "andamento" as const, rotulo: "Em andamento" },
  { numero: "#1020", titulo: "Renovação de licença de software", status: "finalizado" as const, rotulo: "Finalizado" },
]

export function MockPortal() {
  return (
    <BrowserChrome
      label="Prévia do portal do solicitante: lista dos próprios chamados com status, separada da área interna da equipe"
      url="aegis.app/portal"
    >
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium text-foreground">Meus chamados</p>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
            + Abrir chamado
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {CHAMADOS.map((c) => (
            <div
              key={c.numero}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface p-2 text-xs"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-tabular text-muted-foreground">{c.numero}</span>
                <span className="truncate font-medium text-foreground">{c.titulo}</span>
              </div>
              <MockStatus status={c.status} rotulo={c.rotulo} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Paperclip className="size-3.5" />
          Anexos e categoria ficam junto do chamado, sem tela separada
        </div>
      </div>
    </BrowserChrome>
  )
}
