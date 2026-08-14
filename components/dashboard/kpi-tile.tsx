import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface KpiTileProps {
  rotulo: string
  valor: number
  icon: LucideIcon
  /** Nome da CSS custom property (sem "--"), ex. "status-andamento". */
  colorVar?: string
  href: string
  className?: string
}

// Tile denso estilo Milvus: rótulo pequeno em caixa alta + ícone tingido no
// topo, número grande alinhado à direita embaixo. Valor zero cai pro cinza
// neutro de propósito — é isso que faz os números que importam saltarem aos
// olhos numa tela cheia de tiles (ver spec do dashboard).
export function KpiTile({ rotulo, valor, icon: Icon, colorVar, href, className }: KpiTileProps) {
  const destacado = valor > 0

  return (
    <Link
      href={href}
      className={cn(
        "group flex cursor-pointer flex-col justify-between gap-(--space-3) rounded-lg border border-border bg-surface p-(--space-3) transition-colors",
        "hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {rotulo}
        </span>
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full"
          style={
            destacado && colorVar
              ? {
                  color: `var(--${colorVar})`,
                  backgroundColor: `color-mix(in srgb, var(--${colorVar}) 14%, transparent)`,
                }
              : undefined
          }
        >
          <Icon
            className={cn("size-4", !(destacado && colorVar) && "text-muted-foreground")}
            aria-hidden="true"
          />
        </span>
      </div>
      <span
        className={cn(
          "text-right text-2xl font-semibold font-tabular",
          !destacado && "text-muted-foreground"
        )}
        style={destacado && colorVar ? { color: `var(--${colorVar})` } : undefined}
      >
        {valor}
      </span>
    </Link>
  )
}
