"use client"

import { useRef, useState } from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

interface AvaliacaoEstrelasProps {
  valor: number
  onChange?: (valor: number) => void
  somenteLeitura?: boolean
  className?: string
}

// Navegável por teclado (radiogroup de 5 estrelas) e reaproveitável em modo
// leitura para exibir avaliações já registradas.
export function AvaliacaoEstrelas({
  valor,
  onChange,
  somenteLeitura = false,
  className,
}: AvaliacaoEstrelasProps) {
  const [hover, setHover] = useState<number | null>(null)
  const [focoAtual, setFocoAtual] = useState(valor > 0 ? valor : 1)
  const botoesRef = useRef<Array<HTMLButtonElement | null>>([])
  const exibido = hover ?? valor

  if (somenteLeitura) {
    return (
      <div className={cn("flex items-center gap-0.5", className)} aria-label={`${valor} de 5 estrelas`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(
              "size-4",
              n <= valor ? "fill-accent text-accent" : "fill-none text-muted-foreground"
            )}
          />
        ))}
      </div>
    )
  }

  // Roving tabindex: só a estrela selecionada/focada é tab-stop (tabIndex 0),
  // as demais ficam em -1. Setas ←/→ (e ↑/↓) movem o foco e já selecionam,
  // seguindo o padrão ARIA de radiogroup ("selection follows focus").
  function selecionar(n: number) {
    setFocoAtual(n)
    onChange?.(n)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, n: number) {
    let proximo: number
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      proximo = n < 5 ? n + 1 : 1
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      proximo = n > 1 ? n - 1 : 5
    } else if (event.key === "Home") {
      proximo = 1
    } else if (event.key === "End") {
      proximo = 5
    } else {
      return
    }
    event.preventDefault()
    selecionar(proximo)
    botoesRef.current[proximo - 1]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Avaliação de 1 a 5 estrelas"
      className={cn("flex items-center gap-1", className)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          ref={(el) => {
            botoesRef.current[n - 1] = el
          }}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          tabIndex={n === focoAtual ? 0 : -1}
          className="cursor-pointer rounded-sm p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-ring"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(null)}
          onClick={() => selecionar(n)}
          onKeyDown={(event) => handleKeyDown(event, n)}
        >
          <Star
            className={cn(
              "size-6",
              n <= exibido ? "fill-accent text-accent" : "fill-none text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  )
}
