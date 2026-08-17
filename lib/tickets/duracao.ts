// Conversão de intervalo em minutos apontados. Módulo puro (sem banco,
// sem "use server") justamente pra ser testável isolado — mesma linha do
// motor de SLA em lib/sla/.

/**
 * Minutos entre início e fim, arredondados ao inteiro mais próximo.
 *
 * Um intervalo curto porém real (alguns segundos) vira 1 minuto, não 0:
 * apontamento de zero minuto some dos totais e parece bug pro analista que
 * acabou de parar o timer. Intervalo negativo (relógio ajustado para trás)
 * vira 0 em vez de subtrair horas do chamado.
 */
export function minutosEntre(inicio: Date, fim: Date): number {
  const ms = fim.getTime() - inicio.getTime()
  if (ms <= 0) return 0
  return Math.max(1, Math.round(ms / 60000))
}
