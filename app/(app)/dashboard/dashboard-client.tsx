"use client"

import {
  AlertOctagon,
  AlertTriangle,
  Pause,
  Tag,
  Ticket as TicketIcon,
  User,
} from "lucide-react"

import { KpiTile } from "@/components/dashboard/kpi-tile"
import { useReferenceData } from "@/lib/reference-data/provider"
import { useRealtimeRefresh } from "@/lib/realtime/use-realtime-refresh"
import { calcularSeveridade } from "@/lib/sla-display"
import { useSlaClock } from "@/lib/sla-clock"
import { STATUS_META } from "@/lib/status"
import { STATUS_FINAIS, STATUS_KEYS, type StatusKey, type Ticket } from "@/lib/types"

export function DashboardClient({ tickets }: { tickets: Ticket[] }) {
  // "use client" + useSlaClock() em vez de `new Date()` direto: qualquer
  // cálculo que dependa de "agora" (severidade de SLA) precisa desse guard,
  // senão o servidor calcula com um instante diferente do cliente e gera
  // mismatch de hidratação — ver lib/sla-clock.tsx.
  const agora = useSlaClock()
  const { usuarioAtual } = useReferenceData()

  // KPIs derivam direto de `tickets` (prop) a cada render — sem estado
  // local pra resincronizar, só precisamos que o router.refresh() aconteça.
  useRealtimeRefresh([{ tabela: "ticket" }])

  const contagemPorStatus = STATUS_KEYS.map((statusKey) => ({
    statusKey,
    total: tickets.filter((t) => t.statusKey === statusKey).length,
  }))
  const totalPorStatus = (statusKey: StatusKey) =>
    contagemPorStatus.find((c) => c.statusKey === statusKey)?.total ?? 0

  const totalAbertos = tickets.filter((t) => !STATUS_FINAIS.includes(t.statusKey)).length

  const meus = tickets.filter(
    (t) => t.analistaId === usuarioAtual?.id && !STATUS_FINAIS.includes(t.statusKey)
  ).length

  const semCategoria = tickets.filter((t) => t.catProblemaId === null).length

  const pausados = totalPorStatus("pausado")

  // Severidade depende de "agora": enquanto o relógio não montou no cliente
  // (agora === null), tratamos como 0 em vez de calcular — servidor e
  // primeira renderização do cliente ficam idênticos, sem mismatch. O
  // useEffect do SlaClockProvider atualiza isso logo em seguida.
  const naoFinalizados = agora ? tickets.filter((t) => !STATUS_FINAIS.includes(t.statusKey)) : []
  const slaEstourado = agora
    ? naoFinalizados.filter(
        (t) => calcularSeveridade(t.slaSolucaoVenceEm, t.statusKey, agora) === "estourado"
      ).length
    : 0
  const slaPrestesAEstourar = agora
    ? naoFinalizados.filter((t) => {
        const severidade = calcularSeveridade(t.slaSolucaoVenceEm, t.statusKey, agora)
        return severidade === "critico" || severidade === "atencao"
      }).length
    : 0

  const totalGeral = tickets.length

  return (
    <div className="flex flex-col gap-(--space-6)">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

      <section className="flex flex-col gap-(--space-2)">
        <h2 className="text-sm font-semibold text-foreground">Tickets</h2>
        <div className="grid grid-cols-2 gap-(--space-3) sm:grid-cols-3 lg:grid-cols-6">
          <KpiTile
            rotulo="Ag. aprovação"
            valor={totalPorStatus("aguardando_aprovacao")}
            icon={STATUS_META.aguardando_aprovacao.icon}
            colorVar={STATUS_META.aguardando_aprovacao.colorVar}
            href="/chamados?status=aguardando_aprovacao"
          />
          <KpiTile
            rotulo="A fazer"
            valor={totalPorStatus("a_fazer")}
            icon={STATUS_META.a_fazer.icon}
            colorVar={STATUS_META.a_fazer.colorVar}
            href="/chamados?status=a_fazer"
          />
          <KpiTile
            rotulo="Em atendimento"
            valor={totalPorStatus("em_andamento")}
            icon={STATUS_META.em_andamento.icon}
            colorVar={STATUS_META.em_andamento.colorVar}
            href="/chamados?status=em_andamento"
          />
          <KpiTile
            rotulo="Pausados"
            valor={pausados}
            icon={STATUS_META.pausado.icon}
            colorVar={STATUS_META.pausado.colorVar}
            href="/chamados?status=pausado"
          />
          <KpiTile
            rotulo="Abertos"
            valor={totalAbertos}
            icon={TicketIcon}
            colorVar="primary"
            href="/chamados?aberto=1"
          />
          <KpiTile
            rotulo="Meus"
            valor={meus}
            icon={User}
            colorVar="kpi-meus"
            href="/chamados?analista=eu"
          />
        </div>
      </section>

      <section className="flex flex-col gap-(--space-2)">
        <h2 className="text-sm font-semibold text-foreground">SLA</h2>
        <div className="grid grid-cols-2 gap-(--space-3) sm:grid-cols-3 lg:grid-cols-4">
          <KpiTile
            rotulo="Estourados"
            valor={slaEstourado}
            icon={AlertOctagon}
            colorVar="sla-estourado"
            href="/chamados?sla=estourado"
          />
          <KpiTile
            rotulo="Prestes a estourar"
            valor={slaPrestesAEstourar}
            icon={AlertTriangle}
            colorVar="sla-atencao"
            href="/chamados?sla=prestes"
          />
          <KpiTile
            rotulo="Sem categoria"
            valor={semCategoria}
            icon={Tag}
            colorVar="muted-foreground"
            href="/chamados?semCategoria=1"
          />
          <KpiTile
            rotulo="Pausados"
            valor={pausados}
            icon={Pause}
            colorVar={STATUS_META.pausado.colorVar}
            href="/chamados?status=pausado"
          />
        </div>
      </section>

      <div className="flex flex-col gap-(--space-2) rounded-lg border border-border bg-surface p-(--space-4)">
        <span className="text-sm font-medium text-foreground">Distribuição por status</span>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {contagemPorStatus
            .filter(({ total }) => total > 0)
            .map(({ statusKey, total }) => {
              const meta = STATUS_META[statusKey]
              const percentual = totalGeral > 0 ? (total / totalGeral) * 100 : 0
              return (
                <div
                  key={statusKey}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${percentual}%`,
                    backgroundColor: `var(--${meta.colorVar})`,
                  }}
                  title={`${meta.rotuloPadrao}: ${total}`}
                />
              )
            })}
        </div>
        <div className="flex flex-wrap gap-(--space-3)">
          {contagemPorStatus.map(({ statusKey, total }) => {
            const meta = STATUS_META[statusKey]
            return (
              <div
                key={statusKey}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--${meta.colorVar})` }}
                  aria-hidden="true"
                />
                {meta.rotuloPadrao} ({total})
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
