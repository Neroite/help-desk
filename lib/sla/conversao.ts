// Conversão entre horas (usadas nos campos de edição de política de SLA)
// e minutos (unidade armazenada em helpdesk.sla_policy).

export function horasParaMinutos(horas: number): number {
  return Math.round(horas * 60)
}

export function minutosParaHoras(minutos: number): number {
  return minutos / 60
}
