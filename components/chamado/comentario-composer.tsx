"use client"

import { useState } from "react"
import { Lock, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ComentarioComposerProps {
  onEnviar?: (corpo: string, interno: boolean) => void
  mostrarNotaInterna?: boolean
}

// Alterna público/interno com a borda mudando de cor — nota interna nunca
// depende só da cor, mas aqui o composer é o ponto de escolha, não de
// exibição (isso é o TicketTimeline).
export function ComentarioComposer({ onEnviar, mostrarNotaInterna = true }: ComentarioComposerProps) {
  const [corpo, setCorpo] = useState("")
  const [interno, setInterno] = useState(false)

  function enviar() {
    if (!corpo.trim()) return
    onEnviar?.(corpo, interno)
    setCorpo("")
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border p-(--space-3)",
        interno ? "border-accent/50 bg-accent/5" : "border-border"
      )}
    >
      <Textarea
        placeholder={interno ? "Nota interna — não visível ao solicitante" : "Responder ao solicitante..."}
        value={corpo}
        onChange={(e) => setCorpo(e.target.value)}
        rows={3}
      />
      <div className="flex items-center justify-between">
        {mostrarNotaInterna ? (
          <Button
            type="button"
            variant={interno ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setInterno((v) => !v)}
          >
            <Lock className="size-3.5" data-icon="inline-start" />
            {interno ? "Nota interna" : "Marcar como interno"}
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" size="sm" className="h-7 text-xs" onClick={enviar}>
          <Send className="size-3.5" data-icon="inline-start" />
          Enviar
        </Button>
      </div>
    </div>
  )
}
