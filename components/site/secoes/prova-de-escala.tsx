import { Metrica } from "@/components/site/metrica"
import { ProvaDeEscalaFatos } from "@/components/site/secoes/prova-de-escala-fatos"
import { ehPlaceholder, METRICAS } from "@/lib/site/prova-social"

// Enquanto nenhuma métrica real existir, mostra FATOS — verdades
// verificáveis no código, não vaidade. Troca para METRICAS é automática
// assim que um valor real substituir o placeholder "{{...}}".
export function ProvaDeEscala() {
  const temMetricaReal = METRICAS.some((m) => !ehPlaceholder(m.valor))

  return (
    <section style={{ backgroundColor: "var(--site-navy)" }} className="py-16 text-white">
      <div className="mx-auto max-w-6xl px-4">
        {temMetricaReal ? (
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {METRICAS.map((m) => (
              <Metrica key={m.chave} metrica={m} />
            ))}
          </div>
        ) : (
          <ProvaDeEscalaFatos />
        )}
      </div>
    </section>
  )
}
