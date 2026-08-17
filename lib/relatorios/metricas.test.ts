import { describe, expect, it } from "vitest"

import {
  agruparMetricas,
  chamadoCumpriuSla,
  metricasPorAnalista,
  tempoRespostaMinutos,
  tempoSolucaoMinutos,
} from "@/lib/relatorios/metricas"
import type { Ticket } from "@/lib/types"

function saoPaulo(iso: string): string {
  return new Date(`${iso}-03:00`).toISOString()
}

function ticketBase(overrides: Partial<Ticket> = {}): Ticket {
  return {
    numero: 1,
    titulo: "Chamado de teste",
    descricao: "",
    empresaId: "empresa-1",
    solicitanteId: "solicitante-1",
    analistaId: "analista-1",
    statusKey: "finalizado",
    prioridade: null,
    catAtendimentoId: null,
    catProblemaId: null,
    criadoEm: saoPaulo("2026-08-18T09:00:00"),
    primeiraRespostaEm: null,
    finalizadoEm: null,
    slaRespostaVenceEm: null,
    slaSolucaoVenceEm: null,
    slaPausadoEm: null,
    slaMinutosPausados: 0,
    ultimaInteracaoEm: null,
    ultimaInteracaoPapel: null,
    ...overrides,
  }
}

describe("tempoRespostaMinutos / tempoSolucaoMinutos", () => {
  it("null quando ainda não respondido/finalizado", () => {
    const ticket = ticketBase()
    expect(tempoRespostaMinutos(ticket)).toBeNull()
    expect(tempoSolucaoMinutos(ticket)).toBeNull()
  })

  it("minutos úteis entre abertura e resposta/finalização", () => {
    const ticket = ticketBase({
      primeiraRespostaEm: saoPaulo("2026-08-18T10:00:00"),
      finalizadoEm: saoPaulo("2026-08-18T12:00:00"),
    })
    expect(tempoRespostaMinutos(ticket)).toBe(60)
    expect(tempoSolucaoMinutos(ticket)).toBe(180)
  })
})

describe("chamadoCumpriuSla", () => {
  it("cancelado fica fora da estatística", () => {
    const ticket = ticketBase({ statusKey: "cancelado", finalizadoEm: saoPaulo("2026-08-18T10:00:00") })
    expect(chamadoCumpriuSla(ticket)).toBeNull()
  })

  it("aberto (sem finalizadoEm) fica fora da estatística", () => {
    expect(chamadoCumpriuSla(ticketBase({ statusKey: "em_andamento" }))).toBeNull()
  })

  it("finalizado dentro do prazo", () => {
    const ticket = ticketBase({
      finalizadoEm: saoPaulo("2026-08-18T11:00:00"),
      slaSolucaoVenceEm: saoPaulo("2026-08-18T12:00:00"),
    })
    expect(chamadoCumpriuSla(ticket)).toBe(true)
  })

  it("finalizado fora do prazo", () => {
    const ticket = ticketBase({
      finalizadoEm: saoPaulo("2026-08-18T13:00:00"),
      slaSolucaoVenceEm: saoPaulo("2026-08-18T12:00:00"),
    })
    expect(chamadoCumpriuSla(ticket)).toBe(false)
  })
})

describe("agruparMetricas", () => {
  it("agrupa, conta abertos/finalizados e calcula médias e cumprimento", () => {
    const tickets = [
      ticketBase({
        numero: 1,
        analistaId: "a1",
        statusKey: "finalizado",
        primeiraRespostaEm: saoPaulo("2026-08-18T10:00:00"),
        finalizadoEm: saoPaulo("2026-08-18T12:00:00"),
        slaSolucaoVenceEm: saoPaulo("2026-08-18T13:00:00"),
      }),
      ticketBase({
        numero: 2,
        analistaId: "a1",
        statusKey: "em_andamento",
        finalizadoEm: null,
      }),
      ticketBase({
        numero: 3,
        analistaId: "a2",
        statusKey: "finalizado",
        finalizadoEm: saoPaulo("2026-08-18T14:00:00"),
        slaSolucaoVenceEm: saoPaulo("2026-08-18T12:00:00"),
      }),
    ]

    const resultado = agruparMetricas(
      tickets,
      (t) => t.analistaId,
      (id) => id.toUpperCase()
    )

    const a1 = resultado.find((r) => r.chave === "a1")!
    expect(a1.total).toBe(2)
    expect(a1.abertos).toBe(1)
    expect(a1.finalizados).toBe(1)
    expect(a1.cumprimentoSlaPercentual).toBe(100)

    const a2 = resultado.find((r) => r.chave === "a2")!
    expect(a2.cumprimentoSlaPercentual).toBe(0)
  })

  it("tickets sem chave (analista null) ficam de fora do agrupamento", () => {
    const tickets = [ticketBase({ analistaId: null })]
    const resultado = metricasPorAnalista(tickets, [])
    expect(resultado).toHaveLength(0)
  })

  it("usa o rótulo informado, com fallback para chave desconhecida", () => {
    const tickets = [ticketBase({ analistaId: "a1" })]
    const resultado = metricasPorAnalista(tickets, [{ id: "a1", nome: "Ana Silva" }])
    expect(resultado[0].rotulo).toBe("Ana Silva")

    const semCadastro = metricasPorAnalista(tickets, [])
    expect(semCadastro[0].rotulo).toBe("Desconhecido")
  })
})
