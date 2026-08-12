import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { criarAgendador } from "./debounce"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("criarAgendador", () => {
  it("roda a função depois do intervalo configurado", () => {
    const agendador = criarAgendador(300)
    const fn = vi.fn()

    agendador.agendar(fn)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("coalesce chamadas em rajada numa única execução", () => {
    const agendador = criarAgendador(300)
    const fn = vi.fn()

    agendador.agendar(fn)
    vi.advanceTimersByTime(100)
    agendador.agendar(fn)
    vi.advanceTimersByTime(100)
    agendador.agendar(fn)
    vi.advanceTimersByTime(300)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("executa a função mais recente passada a agendar()", () => {
    const agendador = criarAgendador(300)
    const primeira = vi.fn()
    const ultima = vi.fn()

    agendador.agendar(primeira)
    vi.advanceTimersByTime(100)
    agendador.agendar(ultima)
    vi.advanceTimersByTime(300)

    expect(primeira).not.toHaveBeenCalled()
    expect(ultima).toHaveBeenCalledTimes(1)
  })

  it("cancelar() impede a execução agendada", () => {
    const agendador = criarAgendador(300)
    const fn = vi.fn()

    agendador.agendar(fn)
    agendador.cancelar()
    vi.advanceTimersByTime(300)

    expect(fn).not.toHaveBeenCalled()
  })
})
