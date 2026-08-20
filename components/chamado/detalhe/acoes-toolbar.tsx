"use client"

import { type LucideIcon } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface AcaoToolbarProps {
  icon: LucideIcon
  rotulo: string
  onClick: () => void
  tone?: "verde" | "vermelho" | "azul" | "preto" | "amarelo"
  // Renderiza o botão apagado e inerte em vez de escondê-lo -- usado quando
  // duas ações mutuamente exclusivas (ex.: Pausar/Play) precisam ocupar
  // slots fixos lado a lado, pra a barra não "pular" de posição conforme o
  // status do chamado muda.
  disabled?: boolean
}

const TONE_CLASSES: Record<NonNullable<AcaoToolbarProps["tone"]>, string> = {
  azul: "border-transparent bg-blue-600 text-white hover:border-transparent hover:bg-blue-700 hover:text-white",
  verde: "border-transparent bg-green-600 text-white hover:border-transparent hover:bg-green-700 hover:text-white",
  vermelho: "border-transparent bg-red-600 text-white hover:border-transparent hover:bg-red-700 hover:text-white",
  preto: "border-transparent bg-neutral-900 text-white hover:border-transparent hover:bg-neutral-800 hover:text-white",
  amarelo: "border-transparent bg-amber-600 text-white hover:border-transparent hover:bg-amber-700 hover:text-white",
}

export function AcaoToolbar({ icon: Icon, rotulo, onClick, tone, disabled }: AcaoToolbarProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={rotulo}
        aria-disabled={disabled}
        onClick={disabled ? undefined : onClick}
        className={cn(
          "flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring",
          disabled
            // `opacity-40` sobre texto cinza claro em fundo transparente lavava o
            // ícone quase até o branco (some ao lado dos outros botões sólidos) --
            // `bg-muted` mantém o ícone na cor cheia, só o fundo sinaliza "inerte".
            ? "pointer-events-none cursor-not-allowed bg-muted"
            : cn("cursor-pointer", tone ? TONE_CLASSES[tone] : "hover:border-primary/40 hover:bg-muted hover:text-foreground")
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{rotulo}</TooltipContent>
    </Tooltip>
  )
}
