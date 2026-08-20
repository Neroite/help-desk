import { describe, expect, test } from "vitest"
import {
  aplicarPausa,
  aplicarRetomada,
  calcularPrazos,
  pausarSeNecessario,
  recalcularPorPrioridade,
} from "./prazos"
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

describe("pausarSeNecessario", () => {
  // Cobre a combinação entre pausa por status (pausado/aguardando_aprovacao)
  // e pausa manual de SLA (independente do status) -- as duas escrevem no
  // mesmo campo sla_pausado_em, então aplicarPausa direto (não idempotente)
  // resetaria o relógio se chamado duas vezes em qualquer ordem.
  test("pausa quando o SLA ainda não está pausado", () => {
    const ticket: TicketSlaState = {
      criadoEm: new Date(2026, 7, 3, 10, 0),
      slaRespostaVenceEm: new Date(2026, 7, 3, 12, 0),
      slaSolucaoVenceEm: new Date(2026, 7, 3, 18, 0),
      slaPausadoEm: null,
      slaMinutosPausados: 0,
    }
    const agora = new Date(2026, 7, 3, 11, 0)
    const resultado = pausarSeNecessario(ticket, agora)
    expect(resultado.slaPausadoEm).toEqual(agora)
  })

  test("chamar duas vezes seguidas (ex.: pausa manual + status vira 'pausado') é no-op na segunda", () => {
    const ticket: TicketSlaState = {
      criadoEm: new Date(2026, 7, 3, 10, 0),
      slaRespostaVenceEm: new Date(2026, 7, 3, 12, 0),
      slaSolucaoVenceEm: new Date(2026, 7, 3, 18, 0),
      slaPausadoEm: null,
      slaMinutosPausados: 0,
    }
    const primeiraPausa = new Date(2026, 7, 3, 11, 0)
    const segundaTentativa = new Date(2026, 7, 3, 13, 0) // 2h depois

    const pausado = pausarSeNecessario(ticket, primeiraPausa)
    const resultado = pausarSeNecessario(pausado, segundaTentativa)

    // slaPausadoEm continua no instante da PRIMEIRA pausa -- se tivesse
    // sido sobrescrito para as 13h, os minutos entre 11h e 13h "sumiriam"
    // do cálculo de pausa quando o SLA finalmente retomar.
    expect(resultado.slaPausadoEm).toEqual(primeiraPausa)
  })

  test("pausa manual seguida de status virar 'pausado' não reseta o relógio (ordem 1)", () => {
    const semPausa: TicketSlaState = {
      criadoEm: new Date(2026, 7, 3, 10, 0),
      slaRespostaVenceEm: new Date(2026, 7, 3, 12, 0),
      slaSolucaoVenceEm: new Date(2026, 7, 3, 18, 0),
      slaPausadoEm: null,
      slaMinutosPausados: 0,
    }
    // 1) pausarSlaManualmente
    const apósPausaManual = pausarSeNecessario(semPausa, new Date(2026, 7, 3, 10, 30))
    // 2) mudarStatus("pausado") -- rota que hoje também passa por
    // pausarSeNecessario (via estavaPausado derivado de sla_pausado_em)
    const apósStatusPausado = pausarSeNecessario(apósPausaManual, new Date(2026, 7, 3, 11, 45))

    expect(apósStatusPausado.slaPausadoEm).toEqual(new Date(2026, 7, 3, 10, 30))
  })

  test("status virar 'pausado' seguido de pausa manual não reseta o relógio (ordem 2)", () => {
    const semPausa: TicketSlaState = {
      criadoEm: new Date(2026, 7, 3, 10, 0),
      slaRespostaVenceEm: new Date(2026, 7, 3, 12, 0),
      slaSolucaoVenceEm: new Date(2026, 7, 3, 18, 0),
      slaPausadoEm: null,
      slaMinutosPausados: 0,
    }
    // 1) mudarStatus("pausado")
    const apósStatusPausado = pausarSeNecessario(semPausa, new Date(2026, 7, 3, 10, 30))
    // 2) pausarSlaManualmente -- bloqueado na prática pela guarda de status
    // em pausarSlaManualmente, mas o motor puro também precisa ser seguro
    // caso a guarda falhe.
    const apósPausaManual = pausarSeNecessario(apósStatusPausado, new Date(2026, 7, 3, 11, 45))

    expect(apósPausaManual.slaPausadoEm).toEqual(new Date(2026, 7, 3, 10, 30))
  })
})

describe("aplicarRetomada", () => {
  test("chamar duas vezes seguidas é no-op na segunda (idempotência)", () => {
    const ticket: TicketSlaState = {
      criadoEm: new Date(2026, 7, 3, 10, 0),
      slaRespostaVenceEm: new Date(2026, 7, 3, 12, 0),
      slaSolucaoVenceEm: new Date(2026, 7, 3, 18, 0),
      slaPausadoEm: new Date(2026, 7, 3, 11, 0),
      slaMinutosPausados: 0,
    }
    const retomado = aplicarRetomada(ticket, new Date(2026, 7, 3, 11, 30))
    const resultado = aplicarRetomada(retomado, new Date(2026, 7, 3, 14, 0))

    expect(resultado).toEqual(retomado)
  })

  // aplicarRetomada não recebe status_key como argumento -- opera só sobre
  // slaPausadoEm. Por construção, iniciarAtendimento retoma corretamente
  // uma pausa manual mesmo partindo de um status que já não estava em
  // STATUS_PAUSA_SLA (ex.: "a_fazer" com SLA pausado manualmente).
  test("retoma independente de qualquer noção de status -- opera só sobre slaPausadoEm", () => {
    const ticket: TicketSlaState = {
      criadoEm: new Date(2026, 7, 3, 10, 0),
      slaRespostaVenceEm: new Date(2026, 7, 3, 12, 0),
      slaSolucaoVenceEm: new Date(2026, 7, 3, 18, 0),
      slaPausadoEm: new Date(2026, 7, 3, 10, 30),
      slaMinutosPausados: 0,
    }
    const resultado = aplicarRetomada(ticket, new Date(2026, 7, 3, 11, 0))

    expect(resultado.slaPausadoEm).toBeNull()
    expect(resultado.slaMinutosPausados).toBe(30)
  })

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
