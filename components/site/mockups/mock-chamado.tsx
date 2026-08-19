import { AlertTriangle } from "lucide-react"

import { BrowserChrome } from "@/components/site/browser-chrome"
import { MockAvatar, MockPrioridade } from "@/components/site/mockups/pecas"

export function MockChamado() {
  return (
    <BrowserChrome
      label="Prévia da definição de prioridade de um chamado: ao escolher Alta, os prazos de resposta e solução recalculam a partir da abertura"
      url="aegis.app/chamados/1041"
    >
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-tabular text-xs text-muted-foreground">#1041</span>
          <MockAvatar iniciais="JS" />
        </div>
        <p className="font-medium text-foreground">Acesso ao sistema financeiro</p>
        <div className="flex items-center gap-2 rounded-md border border-dashed border-accent/60 bg-accent/5 p-2 text-xs text-accent">
          <AlertTriangle className="size-3.5 shrink-0" />
          Defina a prioridade para calcular os prazos de SLA
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Prioridade:</span>
          <MockPrioridade rotulo="Alta" cor="var(--status-aguardando-solid)" />
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-surface p-2 text-xs">
          <div>
            <p className="text-muted-foreground">Resposta</p>
            <p className="font-tabular font-medium text-foreground">venc. 15:30</p>
          </div>
          <div>
            <p className="text-muted-foreground">Solução</p>
            <p className="font-tabular font-medium text-foreground">venc. amanhã 12:00</p>
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}
