const HORA_ABERTURA = 9
const HORA_FECHAMENTO = 18

function ehDiaUtil(data: Date): boolean {
  const dia = data.getDay()
  return dia >= 1 && dia <= 5
}

function comHora(data: Date, hora: number, minuto: number): Date {
  const resultado = new Date(data)
  resultado.setHours(hora, minuto, 0, 0)
  return resultado
}

function proximoDiaUtilAs9(data: Date): Date {
  const dia = new Date(data)
  dia.setDate(dia.getDate() + 1)
  while (!ehDiaUtil(dia)) {
    dia.setDate(dia.getDate() + 1)
  }
  return comHora(dia, HORA_ABERTURA, 0)
}

// Empurra um instante qualquer pro início do próximo expediente, se ele cair
// fora do horário comercial (fim de semana, antes das 9h ou depois das 18h).
function inicioDoExpediente(data: Date): Date {
  const abertura = comHora(data, HORA_ABERTURA, 0)
  const fechamento = comHora(data, HORA_FECHAMENTO, 0)

  if (!ehDiaUtil(data)) return proximoDiaUtilAs9(comHora(data, HORA_ABERTURA, 0))
  if (data < abertura) return abertura
  if (data >= fechamento) return proximoDiaUtilAs9(data)
  return data
}

export function adicionarMinutosUteis(inicio: Date, minutos: number): Date {
  let atual = inicioDoExpediente(inicio)
  let restante = minutos

  while (restante > 0) {
    const fechamento = comHora(atual, HORA_FECHAMENTO, 0)
    const minutosAteFechar = (fechamento.getTime() - atual.getTime()) / 60_000

    if (restante <= minutosAteFechar) {
      return new Date(atual.getTime() + restante * 60_000)
    }

    restante -= minutosAteFechar
    atual = proximoDiaUtilAs9(atual)
  }

  return atual
}

export function minutosUteisEntre(a: Date, b: Date): number {
  if (b <= a) return 0

  let total = 0
  let cursor = new Date(a)

  while (cursor < b) {
    if (ehDiaUtil(cursor)) {
      const abertura = comHora(cursor, HORA_ABERTURA, 0)
      const fechamento = comHora(cursor, HORA_FECHAMENTO, 0)
      const inicioJanela = cursor > abertura ? cursor : abertura
      const fimJanela = b < fechamento ? b : fechamento

      if (fimJanela > inicioJanela) {
        total += (fimJanela.getTime() - inicioJanela.getTime()) / 60_000
      }
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
  }

  return total
}
