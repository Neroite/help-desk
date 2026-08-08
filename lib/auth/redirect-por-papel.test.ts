import { describe, expect, test } from "vitest"
import { redirectPorPapel } from "./redirect-por-papel"

describe("redirectPorPapel", () => {
  test("admin cai na fila de chamados do shell interno", () => {
    expect(redirectPorPapel("admin")).toBe("/chamados")
  })

  test("analista cai na fila de chamados do shell interno", () => {
    expect(redirectPorPapel("analista")).toBe("/chamados")
  })

  test("solicitante cai no portal", () => {
    expect(redirectPorPapel("solicitante")).toBe("/portal")
  })
})
