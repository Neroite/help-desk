// PLACEHOLDER — o Aegis ainda não tem base de clientes apurada. NADA
// neste arquivo pode ir ao ar como número real sem substituição
// explícita + fonte. Contrato: valor que começa com "{{" NÃO é
// renderizado como número; <Metrica> (components/site/metrica.tsx) troca
// por um traço e um rótulo de "ainda não publicado".
const SENTINELA = "{{"

export function ehPlaceholder(valor: string): boolean {
  return valor.startsWith(SENTINELA)
}

export interface MetricaProvaSocial {
  chave: string
  rotulo: string
  valor: string
  fonte: string
}

export const METRICAS: readonly MetricaProvaSocial[] = [
  {
    chave: "chamados",
    rotulo: "Chamados gerenciados",
    valor: "{{TICKETS}}",
    fonte: "TODO: count(helpdesk.chamado)",
  },
  {
    chave: "equipes",
    rotulo: "Equipes usando",
    valor: "{{EQUIPES}}",
    fonte: "TODO: count(helpdesk.empresa)",
  },
  {
    chave: "sla",
    rotulo: "SLA cumprido",
    valor: "{{SLA_PCT}}",
    fonte: "TODO: fase 8 (relatórios)",
  },
]

// Vazios de propósito. As seções que os consomem NÃO renderizam quando
// length === 0 — não existe logo ou depoimento genérico de enfeite.
export const LOGOS_CLIENTES: readonly { nome: string; src: string }[] = []
export const DEPOIMENTOS: readonly { nome: string; cargo: string; texto: string }[] = []

// Fatos verificáveis no código, não vaidade. É o que a seção de prova de
// escala mostra enquanto METRICAS estiver com placeholder.
export const FATOS = [
  {
    valor: "09:00–18:00",
    rotulo: "Expediente do motor de SLA",
    detalhe: "Seg. a sex. — lib/sla/calendario.ts",
  },
  {
    valor: "6",
    rotulo: "Status configuráveis",
    detalhe: "Sua empresa liga, desliga e renomeia cada um",
  },
  {
    valor: "3",
    rotulo: "Papéis",
    detalhe: "Admin, analista e solicitante, com portal próprio",
  },
  {
    valor: "RLS",
    rotulo: "Isolamento por empresa",
    detalhe: "Aplicado no Postgres, não na aplicação",
  },
] as const
