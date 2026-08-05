import { AlertOctagon, Ticket as TicketIcon } from "lucide-react"

import { tickets } from "@/lib/mock/data"
import { STATUS_META } from "@/lib/status"
import { STATUS_FINAIS, STATUS_KEYS } from "@/lib/types"

export default function DashboardPage() {
  const agora = new Date()

  const contagemPorStatus = STATUS_KEYS.map((statusKey) => ({
    statusKey,
    total: tickets.filter((t) => t.statusKey === statusKey).length,
  }))

  const totalAbertos = tickets.filter((t) => !STATUS_FINAIS.includes(t.statusKey)).length

  const slaEstourado = tickets.filter(
    (t) =>
      !STATUS_FINAIS.includes(t.statusKey) &&
      t.slaSolucaoVenceEm !== null &&
      new Date(t.slaSolucaoVenceEm).getTime() < agora.getTime()
  ).length

  const totalGeral = tickets.length

  return (
    <div className="flex flex-col gap-(--space-4)">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 gap-(--space-3) sm:grid-cols-2">
        <div className="flex items-center gap-(--space-4) rounded-lg border border-border bg-surface p-(--space-4)">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TicketIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Chamados abertos</span>
            <span className="text-3xl font-semibold font-tabular text-foreground">
              {totalAbertos}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-(--space-4) rounded-lg border border-border bg-surface p-(--space-4)">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            style={{
              color: "var(--sla-estourado)",
              backgroundColor: "color-mix(in srgb, var(--sla-estourado) 12%, transparent)",
            }}
          >
            <AlertOctagon className="size-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">SLA estourado</span>
            <span
              className="text-3xl font-semibold font-tabular"
              style={{ color: slaEstourado > 0 ? "var(--sla-estourado)" : undefined }}
            >
              {slaEstourado}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-(--space-3) md:grid-cols-3 lg:grid-cols-6">
        {contagemPorStatus.map(({ statusKey, total }) => {
          const meta = STATUS_META[statusKey]
          const Icon = meta.icon
          return (
            <div
              key={statusKey}
              className="flex flex-col gap-(--space-2) rounded-lg border border-border bg-surface p-(--space-3)"
            >
              <div className="flex items-center gap-1.5">
                <Icon
                  className="size-4"
                  style={{ color: `var(--${meta.colorVar})` }}
                  aria-hidden="true"
                />
                <span className="truncate text-xs font-medium text-muted-foreground">
                  {meta.rotuloPadrao}
                </span>
              </div>
              <span
                className="text-2xl font-semibold font-tabular"
                style={{ color: `var(--${meta.colorVar})` }}
              >
                {total}
              </span>
            </div>
          )
        })}
      </div>

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
              <div key={statusKey} className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
