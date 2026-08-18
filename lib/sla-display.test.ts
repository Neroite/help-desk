import { describe, expect, test } from "vitest"
import { calcularProgressoSla, type TicketSlaInfo } from "./sla-display"

const BASE: TicketSlaInfo = {
  criadoEm: new Date(2026, 7, 3, 9, 0).toISOString(), // segunda 09:00
  statusKey: "em_andamento",
  slaPausadoEm: null,
  slaMinutosPausados: 0,
  primeiraRespostaEm: null,
  finalizadoEm: null,
  slaRespostaVenceEm: new Date(2026, 7, 3, 11, 0).toISOString(), // +120min úteis
  slaSolucaoVenceEm: new Date(2026, 7, 3, 17, 0).toISOString(), // +480min úteis
}

describe("calcularProgressoSla", () => {
  test("sem prazo definido fica em 0% ok", () => {
    const ticket = { ...BASE, slaRespostaVenceEm: null }
    const agora = new Date(2026, 7, 3, 10, 0)
    const resultado = calcularProgressoSla(ticket, "resposta", agora)
    expect(resultado.percentual).toBe(0)
    expect(resultado.severidade).toBe("ok")
  })

  test("na metade do prazo fica em ~50% ok", () => {
    const agora = new Date(2026, 7, 3, 10, 0) // 60min de 120min úteis
    const resultado = calcularProgressoSla(BASE, "resposta", agora)
    expect(resultado.percentual).toBeCloseTo(50, 5)
    expect(resultado.severidade).toBe("ok")
  })

  test("a partir de 75% fica em atenção", () => {
    const agora = new Date(2026, 7, 3, 10, 31) // 91/120 = 75.83%
    const resultado = calcularProgressoSla(BASE, "resposta", agora)
    expect(resultado.percentual).toBeGreaterThanOrEqual(75)
    expect(resultado.severidade).toBe("atencao")
  })

  test("a partir de 90% fica crítico", () => {
    const agora = new Date(2026, 7, 3, 10, 49) // 109/120 = 90.83%
    const resultado = calcularProgressoSla(BASE, "resposta", agora)
    expect(resultado.percentual).toBeGreaterThanOrEqual(90)
    expect(resultado.severidade).toBe("critico")
  })

  test("prazo vencido fica estourado com barra cheia", () => {
    const agora = new Date(2026, 7, 3, 11, 30)
    const resultado = calcularProgressoSla(BASE, "resposta", agora)
    expect(resultado.percentual).toBe(100)
    expect(resultado.severidade).toBe("estourado")
  })

  test("chamado pausado congela no percentual do momento da pausa, mesmo o tempo passando", () => {
    const ticket: TicketSlaInfo = {
      ...BASE,
      statusKey: "pausado",
      slaPausadoEm: new Date(2026, 7, 3, 10, 0).toISOString(), // pausou aos 60/120min = 50%
    }
    const cincoHorasDepois = new Date(2026, 7, 3, 15, 0)
    const resultado = calcularProgressoSla(ticket, "resposta", cincoHorasDepois)
    expect(resultado.percentual).toBeCloseTo(50, 5)
    expect(resultado.severidade).toBe("pausado")
  })

  test("retomada continua do ponto onde parou, sem contar o tempo pausado", () => {
    // Ticket real: pausou às 10:00 (60/120min = 50%), retomou às 13:00
    // (aplicarRetomada soma 180min a slaMinutosPausados e empurra
    // slaRespostaVenceEm de 11:00 -> 14:00). 30min depois de retomar
    // (13:30) deve estar em (60+30)/120 = 75% — não em 90/300.
    const ticket: TicketSlaInfo = {
      ...BASE,
      slaMinutosPausados: 180,
      slaRespostaVenceEm: new Date(2026, 7, 3, 14, 0).toISOString(),
    }
    const agora = new Date(2026, 7, 3, 13, 30)
    const resultado = calcularProgressoSla(ticket, "resposta", agora)
    expect(resultado.percentual).toBeCloseTo(75, 5)
  })

  test("resposta encerrada (primeira_resposta_em) congela e ignora o relógio depois disso", () => {
    const ticket: TicketSlaInfo = {
      ...BASE,
      primeiraRespostaEm: new Date(2026, 7, 3, 10, 0).toISOString(), // respondeu aos 60/120 = 50%
    }
    const muitoDepois = new Date(2026, 7, 10, 9, 0)
    const resultado = calcularProgressoSla(ticket, "resposta", muitoDepois)
    expect(resultado.percentual).toBeCloseTo(50, 5)
    expect(resultado.severidade).toBe("ok")
  })

  test("solução encerrada (finalizado_em) congela mesmo com status final", () => {
    const ticket: TicketSlaInfo = {
      ...BASE,
      statusKey: "finalizado",
      finalizadoEm: new Date(2026, 7, 3, 12, 0).toISOString(), // 180/480 = 37.5%
    }
    const muitoDepois = new Date(2026, 7, 10, 9, 0)
    const resultado = calcularProgressoSla(ticket, "solucao", muitoDepois)
    expect(resultado.percentual).toBeCloseTo(37.5, 5)
    expect(resultado.severidade).toBe("ok")
  })

  test("cancelado sem nunca ter sido respondido congela a barra de resposta em finalizado_em", () => {
    const ticket: TicketSlaInfo = {
      ...BASE,
      statusKey: "cancelado",
      finalizadoEm: new Date(2026, 7, 3, 9, 30).toISOString(), // 30/120 = 25%
    }
    const muitoDepois = new Date(2026, 7, 10, 9, 0)
    const resultado = calcularProgressoSla(ticket, "resposta", muitoDepois)
    expect(resultado.percentual).toBeCloseTo(25, 5)
  })
})
