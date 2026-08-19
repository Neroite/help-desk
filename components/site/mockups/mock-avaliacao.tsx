import { Star } from "lucide-react"

import { BrowserChrome } from "@/components/site/browser-chrome"

export function MockAvaliacao() {
  return (
    <BrowserChrome
      label="Prévia da avaliação de atendimento por link: o solicitante avalia com estrelas sem precisar fazer login"
      url="aegis.app/avaliar/9f2c…"
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center text-sm">
        <p className="font-medium text-foreground">Como foi o atendimento do chamado #1020?</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="size-6"
              style={{ color: "var(--sla-atencao)" }}
              fill={i < 4 ? "var(--sla-atencao)" : "none"}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Sem necessidade de login — o link é o suficiente</p>
      </div>
    </BrowserChrome>
  )
}
