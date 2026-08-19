type AegisMarkProps = React.SVGProps<SVGSVGElement>

// Escudo com "A" vazado (fill-rule evenodd) — a cor de fundo aparece
// através do "A", então a marca funciona sobre branco, sobre o navy da
// prova de escala e no dark, sem precisar de uma segunda variante.
export function AegisMark({ className, "aria-hidden": ariaHidden, ...props }: AegisMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={ariaHidden ? undefined : "img"}
      aria-label={ariaHidden ? undefined : "Aegis"}
      aria-hidden={ariaHidden}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16 2 27 6.5v8.2c0 8.1-4.7 13.6-11 15.3-6.3-1.7-11-7.2-11-15.3V6.5L16 2Z"
        fill="var(--site-brand, #1e40af)"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      <path
        d="M16 9 21.5 22h-3.1l-1.15-2.9h-5.7L10.4 22H7.3L12.9 9h3.1Zm-1.55 3.35-1.9 4.85h3.8l-1.9-4.85Z"
        fill="currentColor"
        className="text-background"
      />
      <path
        d="M21.5 22h3.1l-2.05-5.1-2.55 1.9L21.5 22Z"
        fill="var(--site-brand-accent, #d97706)"
      />
    </svg>
  )
}

interface AegisLogoProps {
  className?: string
  markClassName?: string
}

// Marca + wordmark. `aria-hidden` no SVG porque o texto "Aegis" ao lado
// já é lido pelo leitor de tela — evitar duplicar o nome do produto.
export function AegisLogo({ className, markClassName }: AegisLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <AegisMark className={markClassName ?? "size-7"} aria-hidden />
      <span className="text-lead font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        Aegis
      </span>
    </span>
  )
}
