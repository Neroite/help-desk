import { describe, expect, test } from "vitest"
import { redirectPorPapel } from "./redirect-por-papel"

describe("redirectPorPapel", () => {
  test("admin cai no Kanban da fila de chamados", () => {
    expect(redirectPorPapel("admin")).toBe("/chamados?view=kanban")
  })

  test("analista cai no Kanban da fila de chamados", () => {
    expect(redirectPorPapel("analista")).toBe("/chamados?view=kanban")
  })

  test("solicitante cai no portal", () => {
    expect(redirectPorPapel("solicitante")).toBe("/portal")
  })
})
