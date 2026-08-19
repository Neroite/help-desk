import { Metrica } from "@/components/site/metrica"
import { ehPlaceholder, FATOS, METRICAS } from "@/lib/site/prova-social"

// Enquanto nenhuma métrica real existir, mostra FATOS — verdades
// verificáveis no código, não vaidade. Troca para METRICAS é automática
// assim que um valor real substituir o placeholder "{{...}}".
export function ProvaDeEscala() {
  const temMetricaReal = METRICAS.some((m) => !ehPlaceholder(m.valor))

  return (
    <section style={{ backgroundColor: "var(--site-navy)" }} className="py-16 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {temMetricaReal
            ? METRICAS.map((m) => <Metrica key={m.chave} metrica={m} />)
            : FATOS.map((fato) => (
                <div key={fato.rotulo}>
                  <p className="text-d2 font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    {fato.valor}
                  </p>
                  <p className="text-lead" style={{ color: "var(--site-navy-fg)" }}>
                    {fato.rotulo}
                  </p>
                  <p className="text-sm text-white/60">{fato.detalhe}</p>
                </div>
              ))}
        </div>
      </div>
    </section>
  )
}
