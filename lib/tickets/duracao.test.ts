import { describe, expect, it } from "vitest"

import { minutosEntre } from "./duracao"

describe("minutosEntre", () => {
  it("conta minutos cheios", () => {
    const inicio = new Date("2026-08-13T09:00:00Z")
    const fim = new Date("2026-08-13T09:30:00Z")
    expect(minutosEntre(inicio, fim)).toBe(30)
  })

  it("arredonda ao minuto mais próximo", () => {
    const inicio = new Date("2026-08-13T09:00:00Z")
    expect(minutosEntre(inicio, new Date("2026-08-13T09:10:20Z"))).toBe(10)
    expect(minutosEntre(inicio, new Date("2026-08-13T09:10:40Z"))).toBe(11)
  })

  it("nunca devolve zero para intervalo real, por curto que seja", () => {
    const inicio = new Date("2026-08-13T09:00:00Z")
    const fim = new Date("2026-08-13T09:00:05Z")
    expect(minutosEntre(inicio, fim)).toBe(1)
  })

  it("devolve zero quando início e fim coincidem", () => {
    const instante = new Date("2026-08-13T09:00:00Z")
    expect(minutosEntre(instante, instante)).toBe(0)
  })

  it("devolve zero em intervalo negativo (relógio ajustado para trás)", () => {
    const inicio = new Date("2026-08-13T09:30:00Z")
    const fim = new Date("2026-08-13T09:00:00Z")
    expect(minutosEntre(inicio, fim)).toBe(0)
  })

  it("atravessa a virada do dia", () => {
    const inicio = new Date("2026-08-13T23:50:00Z")
    const fim = new Date("2026-08-14T00:10:00Z")
    expect(minutosEntre(inicio, fim)).toBe(20)
  })
})
