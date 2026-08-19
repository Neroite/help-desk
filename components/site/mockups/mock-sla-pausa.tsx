import { Pause } from "lucide-react"

import { BrowserChrome } from "@/components/site/browser-chrome"
import { MockSla } from "@/components/site/mockups/pecas"

export function MockSlaPausa() {
  return (
    <BrowserChrome
      label="Prévia do relógio de SLA congelado: ao pausar o chamado, o prazo para de contar e a retomada soma de volta os minutos parados"
      url="aegis.app/chamados/1035"
    >
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-tabular text-xs text-muted-foreground">#1035</span>
          <MockSla rotulo="" tempo="Pausado" cor="var(--sla-pausado)" />
        </div>
        <p className="font-medium text-foreground">Configuração de VPN para filial</p>
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted p-2 text-xs text-muted-foreground">
          <Pause className="mt-0.5 size-3.5 shrink-0" style={{ color: "var(--status-pausado)" }} />
          <span>
            Relógio de SLA congelado há <span className="font-tabular font-medium text-foreground">01h48</span>.
            Ao retomar, esse tempo é somado de volta ao prazo.
          </span>
        </div>
        <div className="rounded-md border border-border bg-surface p-2 font-tabular text-xs text-muted-foreground">
          Prazo restante no momento da pausa:{" "}
          <span className="font-medium text-foreground">03h12</span>
        </div>
      </div>
    </BrowserChrome>
  )
}
