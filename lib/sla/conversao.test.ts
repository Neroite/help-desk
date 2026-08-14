import { describe, expect, test } from "vitest"
import { horasParaMinutos, minutosParaHoras } from "./conversao"

describe("horasParaMinutos", () => {
  test("converte hora exata pra minutos", () => {
    expect(horasParaMinutos(1)).toBe(60)
  })

  test("converte fração de hora pra minutos", () => {
    expect(horasParaMinutos(0.25)).toBe(15)
  })

  test("converte 8 horas pra 480 minutos", () => {
    expect(horasParaMinutos(8)).toBe(480)
  })

  test("arredonda quando o resultado não é inteiro", () => {
    expect(horasParaMinutos(0.33)).toBe(20)
  })
})

describe("minutosParaHoras", () => {
  test("converte minutos exatos pra hora", () => {
    expect(minutosParaHoras(60)).toBe(1)
  })

  test("converte 480 minutos pra 8 horas", () => {
    expect(minutosParaHoras(480)).toBe(8)
  })

  test("converte 15 minutos pra 0.25 horas", () => {
    expect(minutosParaHoras(15)).toBe(0.25)
  })

  test("converte 90 minutos pra 1.5 horas", () => {
    expect(minutosParaHoras(90)).toBe(1.5)
  })
})
