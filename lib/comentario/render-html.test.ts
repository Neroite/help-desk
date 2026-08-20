import { describe, expect, it } from "vitest"

import { construirHtmlComentario, documentoTemConteudo } from "./render-html"

describe("construirHtmlComentario", () => {
  it("parágrafo simples com texto escapado", () => {
    const doc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "a < b & c" }] }],
    }
    expect(construirHtmlComentario(doc)).toBe("<p>a &lt; b &amp; c</p>")
  })

  it("marcas aninhadas: negrito + itálico", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "forte", marks: [{ type: "bold" }, { type: "italic" }] }],
        },
      ],
    }
    expect(construirHtmlComentario(doc)).toBe("<p><em><strong>forte</strong></em></p>")
  })

  it("listas com item", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "um" }] }] },
          ],
        },
      ],
    }
    expect(construirHtmlComentario(doc)).toBe("<ul><li><p>um</p></li></ul>")
  })

  it("link http ganha rel e target", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "site", marks: [{ type: "link", attrs: { href: "https://exemplo.com" } }] },
          ],
        },
      ],
    }
    expect(construirHtmlComentario(doc)).toBe(
      '<p><a href="https://exemplo.com/" rel="noopener noreferrer" target="_blank">site</a></p>'
    )
  })

  it("link com protocolo não permitido vira texto sem âncora", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "clique",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    }
    expect(construirHtmlComentario(doc)).toBe("<p>clique</p>")
  })

  it("imagem servida pela rota interna é aceita", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "image", attrs: { src: "/api/anexos/123e4567-e89b-12d3-a456-426614174000", alt: "captura" } },
      ],
    }
    expect(construirHtmlComentario(doc)).toBe(
      '<img src="/api/anexos/123e4567-e89b-12d3-a456-426614174000" alt="captura">'
    )
  })

  it("imagem de URL arbitrária é rejeitada", () => {
    const doc = {
      type: "doc",
      content: [{ type: "image", attrs: { src: "https://evil.example/x.png" } }],
    }
    expect(construirHtmlComentario(doc)).toBe("")
  })

  it("nó desconhecido não emite tag mas preserva o texto de dentro", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "scriptMalicioso",
          content: [{ type: "text", text: "onerror=alert(1)" }],
        },
      ],
    }
    expect(construirHtmlComentario(doc)).toBe("onerror=alert(1)")
  })

  it("doc vazio/inválido devolve string vazia", () => {
    expect(construirHtmlComentario(null)).toBe("")
    expect(construirHtmlComentario(undefined)).toBe("")
  })
})

describe("documentoTemConteudo", () => {
  it("parágrafo com texto tem conteúdo", () => {
    const doc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Olá mundo" }] }],
    }
    expect(documentoTemConteudo(doc)).toBe(true)
  })

  it("parágrafo vazio (sem texto) não tem conteúdo", () => {
    const doc = { type: "doc", content: [{ type: "paragraph" }] }
    expect(documentoTemConteudo(doc)).toBe(false)
  })

  it("só espaço em branco não conta como conteúdo", () => {
    const doc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "   " }] }],
    }
    expect(documentoTemConteudo(doc)).toBe(false)
  })

  it("imagem servida pela rota interna, sem nenhum texto, é conteúdo válido", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph" },
        { type: "image", attrs: { src: "/api/anexos/123e4567-e89b-12d3-a456-426614174000" } },
      ],
    }
    expect(documentoTemConteudo(doc)).toBe(true)
  })

  it("imagem de URL arbitrária (rejeitada pelo render) não conta como conteúdo", () => {
    const doc = {
      type: "doc",
      content: [{ type: "image", attrs: { src: "https://evil.example/x.png" } }],
    }
    expect(documentoTemConteudo(doc)).toBe(false)
  })

  it("doc vazio/inválido não tem conteúdo", () => {
    expect(documentoTemConteudo(null)).toBe(false)
    expect(documentoTemConteudo(undefined)).toBe(false)
  })
})
