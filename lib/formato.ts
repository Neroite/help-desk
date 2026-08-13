// "Agora" só existe depois de montar no cliente (useSlaClock) -- mesmo
// guard de hidratação do SlaBadge/SlaProgress. Enquanto não montou, quem
// chama deve mostrar reticências em vez de calcular o relativo.
export function formatarRelativo(dataIso: string, agora: Date): string {
  const diffMs = new Date(dataIso).getTime() - agora.getTime()
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" })

  const diffMin = Math.round(diffMs / 60_000)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute")

  const diffHoras = Math.round(diffMs / 3_600_000)
  if (Math.abs(diffHoras) < 24) return rtf.format(diffHoras, "hour")

  const diffDias = Math.round(diffMs / 86_400_000)
  if (Math.abs(diffDias) < 30) return rtf.format(diffDias, "day")

  const diffMeses = Math.round(diffMs / (86_400_000 * 30))
  return rtf.format(diffMeses, "month")
}
