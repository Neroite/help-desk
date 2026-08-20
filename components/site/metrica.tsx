import { ehPlaceholder, type MetricaProvaSocial } from "@/lib/site/prova-social"

interface MetricaProps {
  metrica: MetricaProvaSocial
  className?: string
}

// Se o valor é um placeholder ("{{...}}"), NUNCA renderiza como número —
// mostra um traço e avisa o leitor de tela que a métrica ainda não foi
// publicada. É o mecanismo que impede um número inventado de escapar.
export function Metrica({ metrica, className }: MetricaProps) {
  const pendente = ehPlaceholder(metrica.valor)

  return (
    <div className={className}>
      {pendente ? (
        <span
          className="inline-flex items-center rounded-md border border-dashed border-border px-2 text-d2 text-muted-foreground"
          title="Métrica ainda não publicada"
        >
          —<span className="sr-only">métrica ainda não publicada</span>
        </span>
      ) : (
        <span className="text-d2 font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {metrica.valor}
        </span>
      )}
      <p className="text-lead" style={{ color: "var(--site-navy-fg)" }}>
        {metrica.rotulo}
      </p>
    </div>
  )
}
