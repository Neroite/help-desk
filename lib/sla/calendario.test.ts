import { describe, expect, test } from "vitest"
import { adicionarMinutosUteis, minutosUteisEntre } from "./calendario"

describe("adicionarMinutosUteis", () => {
  test("soma minutos dentro do mesmo expediente", () => {
    const inicio = new Date(2026, 7, 3, 10, 0) // segunda 10:00
    const resultado = adicionarMinutosUteis(inicio, 60)
    expect(resultado).toEqual(new Date(2026, 7, 3, 11, 0))
  })

  test("transborda pro dia seguinte quando passa das 18:00", () => {
    const inicio = new Date(2026, 7, 5, 17, 30) // quarta 17:30
    const resultado = adicionarMinutosUteis(inicio, 60)
    expect(resultado).toEqual(new Date(2026, 7, 6, 9, 30)) // quinta 09:30
  })

  test("abertura sexta 17:00 com 8h pula fim de semana e cai na segunda", () => {
    const inicio = new Date(2026, 7, 7, 17, 0) // sexta 17:00
    const resultado = adicionarMinutosUteis(inicio, 8 * 60)
    expect(resultado).toEqual(new Date(2026, 7, 10, 16, 0)) // segunda 16:00
  })

  test("abertura antes do expediente conta a partir das 09:00 do mesmo dia", () => {
    const inicio = new Date(2026, 7, 3, 7, 0) // segunda 07:00
    const resultado = adicionarMinutosUteis(inicio, 30)
    expect(resultado).toEqual(new Date(2026, 7, 3, 9, 30))
  })

  test("abertura no fim de semana conta a partir das 09:00 da segunda", () => {
    const inicio = new Date(2026, 7, 8, 10, 0) // sábado
    const resultado = adicionarMinutosUteis(inicio, 30)
    expect(resultado).toEqual(new Date(2026, 7, 10, 9, 30)) // segunda 09:30
  })
})

describe("minutosUteisEntre", () => {
  test("minutos úteis dentro do mesmo expediente", () => {
    const a = new Date(2026, 7, 3, 10, 0)
    const b = new Date(2026, 7, 3, 11, 30)
    expect(minutosUteisEntre(a, b)).toBe(90)
  })

  test("minutos úteis atravessando a noite", () => {
    const a = new Date(2026, 7, 5, 17, 30) // quarta 17:30
    const b = new Date(2026, 7, 6, 9, 30) // quinta 09:30
    expect(minutosUteisEntre(a, b)).toBe(60)
  })

  test("minutos úteis atravessando o fim de semana", () => {
    const a = new Date(2026, 7, 7, 17, 0) // sexta 17:00
    const b = new Date(2026, 7, 10, 9, 0) // segunda 09:00
    expect(minutosUteisEntre(a, b)).toBe(60)
  })
})
