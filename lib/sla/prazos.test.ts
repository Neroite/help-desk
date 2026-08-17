import { describe, expect, test } from "vitest"
import { aplicarPausa, aplicarRetomada, calcularPrazos, recalcularPorPrioridade } from "./prazos"
import type { TicketSlaState } from "./prazos"

const POLITICA_PADRAO = { prioridade: null, minutosResposta: 120, minutosSolucao: 480 }
const POLITICA_ALTA = { prioridade: "alta" as const, minutosResposta: 30, minutosSolucao: 240 }

describe("calcularPrazos", () => {
  test("calcula resposta e solucao a partir do criado_em", () => {
    const criadoEm = new Date(2026, 7, 3, 10, 0) // segunda 10:00
    const prazos = calcularPrazos(criadoEm, POLITICA_PADRAO)
    expect(prazos.respostaVenceEm).toEqual(new Date(2026, 7, 3, 12, 0))
    expect(prazos.solucaoVenceEm).toEqual(new Date(2026, 7, 3, 18, 0))
  })
})

describe("aplicarPausa", () => {
  test("grava o instante da pausa sem alterar os prazos", () => {
    const ticket: TicketSlaState = {
      criadoEm: new Date(2026, 7, 3, 10, 0),
      slaRespostaVenceEm: new Date(2026, 7, 3, 12, 0),
      slaSolucaoVenceEm: new Date(2026, 7, 3, 18, 0),
      slaPausadoEm: null,
      slaMinutosPausados: 0,
    }
    const agora = new Date(2026, 7, 3, 11, 0)
    const resultado = aplicarPausa(ticket, agora)
    expect(resultado.slaPausadoEm).toEqual(agora)
    expect(resultado.slaRespostaVenceEm).toEqual(ticket.slaRespostaVenceEm)
    expect(resultado.slaSolucaoVenceEm).toEqual(ticket.slaSolucaoVenceEm)
  })
})

describe("aplicarRetomada", () => {
  test("pausa que atravessa a noite empurra os prazos pelos minutos uteis parados", () => {
    const ticket: TicketSlaState = {
      criadoEm: new Date(2026, 7, 5, 9, 0),
      slaRespostaVenceEm: new Date(2026, 7, 5, 18, 0),
      slaSolucaoVenceEm: new Date(2026, 7, 6, 10, 0),
      slaPausadoEm: new Date(2026, 7, 5, 17, 30), // quarta 17:30
      slaMinutosPausados: 0,
    }
    const agora = new Date(2026, 7, 6, 9, 30) // quinta 09:30
    const resultado = aplicarRetomada(ticket, agora)

    expect(resultado.slaPausadoEm).toBeNull()
    expect(resultado.slaMinutosPausados).toBe(60)
    expect(resultado.slaRespostaVenceEm).toEqual(new Date(2026, 7, 6, 10, 0))
    expect(resultado.slaSolucaoVenceEm).toEqual(new Date(2026, 7, 6, 11, 0))
  })

  test("pausa que atravessa o fim de semana empurra os prazos", () => {
    const ticket: TicketSlaState = {
      criadoEm: new Date(2026, 7, 7, 9, 0),
      slaRespostaVenceEm: new Date(2026, 7, 7, 18, 0),
      slaSolucaoVenceEm: new Date(2026, 7, 10, 10, 0),
      slaPausadoEm: new Date(2026, 7, 7, 17, 0), // sexta 17:00
      slaMinutosPausados: 0,
    }
    const agora = new Date(2026, 7, 10, 9, 0) // segunda 09:00
    const resultado = aplicarRetomada(ticket, agora)

    expect(resultado.slaPausadoEm).toBeNull()
    expect(resultado.slaMinutosPausados).toBe(60)
    expect(resultado.slaRespostaVenceEm).toEqual(new Date(2026, 7, 10, 10, 0))
    expect(resultado.slaSolucaoVenceEm).toEqual(new Date(2026, 7, 10, 11, 0))
  })
})

describe("recalcularPorPrioridade", () => {
  test("triage recalcula prazo de chamado ja pausado somando os minutos ja parados", () => {
    const ticket: TicketSlaState = {
      criadoEm: new Date(2026, 7, 3, 10, 0), // segunda 10:00
      slaRespostaVenceEm: new Date(2026, 7, 3, 12, 0),
      slaSolucaoVenceEm: new Date(2026, 7, 3, 18, 0),
      slaPausadoEm: null,
      slaMinutosPausados: 120, // pausa anterior de 2h ja contabilizada
    }
    const resultado = recalcularPorPrioridade(ticket, POLITICA_ALTA)

    expect(resultado.respostaVenceEm).toEqual(new Date(2026, 7, 3, 12, 30))
    expect(resultado.solucaoVenceEm).toEqual(new Date(2026, 7, 3, 16, 0))
  })
})
