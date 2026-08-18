import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MetricaAgrupada } from "@/lib/relatorios/metricas"

function formatarMinutos(min: number | null): string {
  if (min === null) return "—"
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`
}

function formatarPercentual(pct: number | null): string {
  if (pct === null) return "—"
  return `${Math.round(pct)}%`
}

export function RelatorioTabela({
  titulo,
  colunaChave,
  linhas,
}: {
  titulo: string
  colunaChave: string
  linhas: MetricaAgrupada[]
}) {
  return (
    <div className="flex flex-col gap-(--space-2)">
      <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>
      <div className="rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{colunaChave}</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Abertos</TableHead>
              <TableHead className="text-right">Finalizados</TableHead>
              <TableHead className="text-right">Resposta média</TableHead>
              <TableHead className="text-right">Solução média</TableHead>
              <TableHead className="text-right">Cumpriu SLA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum chamado com esses filtros.
                </TableCell>
              </TableRow>
            )}
            {linhas.map((linha) => (
              <TableRow key={linha.chave}>
                <TableCell className="font-medium text-foreground">{linha.rotulo}</TableCell>
                <TableCell className="text-right font-tabular">{linha.total}</TableCell>
                <TableCell className="text-right font-tabular">{linha.abertos}</TableCell>
                <TableCell className="text-right font-tabular">{linha.finalizados}</TableCell>
                <TableCell className="text-right font-tabular">
                  {formatarMinutos(linha.tempoRespostaMedioMin)}
                </TableCell>
                <TableCell className="text-right font-tabular">
                  {formatarMinutos(linha.tempoSolucaoMedioMin)}
                </TableCell>
                <TableCell className="text-right font-tabular">
                  {formatarPercentual(linha.cumprimentoSlaPercentual)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
