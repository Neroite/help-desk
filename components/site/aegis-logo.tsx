import Image from "next/image"

interface AegisMarkProps {
  className?: string
  "aria-hidden"?: boolean
}

// Marca oficial (Gemini_Generated_Image_.jpg, recortada com fundo
// transparente em public/marca/aegis-mark.png) — substitui o "A" vazado
// desenhado à mão que existia aqui antes.
export function AegisMark({ className, "aria-hidden": ariaHidden }: AegisMarkProps) {
  return (
    <Image
      src="/marca/aegis-mark.png"
      alt={ariaHidden ? "" : "Aegis"}
      width={32}
      height={36}
      className={className}
      aria-hidden={ariaHidden}
    />
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
      <AegisMark className={markClassName ?? "h-7 w-auto"} aria-hidden />
      <span className="text-lead font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        Aegis
      </span>
    </span>
  )
}
