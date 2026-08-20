// Constrói o HTML de um comentário a partir do JSON do editor Tiptap
// (`editor.getJSON()`) -- nunca aceita HTML pronto vindo do cliente. Sanitização
// por construção (correção C2 do plano de rebrand): nó desconhecido não é
// mapeado, atributo não previsto nunca é emitido. Módulo puro, sem acesso a
// banco -- mesma linha de lib/sla/.

interface NoDoc {
  type?: string
  attrs?: Record<string, unknown>
  content?: NoDoc[]
  text?: string
  marks?: { type: string; attrs?: Record<string, unknown> }[]
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const PROTOCOLOS_LINK_PERMITIDOS = new Set(["http:", "https:", "mailto:"])

// Link de comentário é sempre absoluto -- URL relativa lança sem base, o que
// já serve de filtro (nunca vem de dentro do editor mesmo assim).
function hrefSeguro(href: unknown): string | null {
  if (typeof href !== "string") return null
  try {
    const url = new URL(href)
    return PROTOCOLOS_LINK_PERMITIDOS.has(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

// Só aceita imagem servida pela rota interna de anexo (app/api/anexos/[id]) --
// nunca uma URL arbitrária, senão o editor vira um jeito de embutir qualquer
// coisa de qualquer host.
const REGEX_SRC_ANEXO = /^\/api\/anexos\/[0-9a-f-]{36}$/

function srcSeguro(src: unknown): string | null {
  return typeof src === "string" && REGEX_SRC_ANEXO.test(src) ? src : null
}

function aplicarMarcas(textoEscapado: string, marks: NoDoc["marks"] | undefined): string {
  if (!marks || marks.length === 0) return textoEscapado
  return marks.reduce((acc, marca) => {
    switch (marca.type) {
      case "bold":
        return `<strong>${acc}</strong>`
      case "italic":
        return `<em>${acc}</em>`
      case "underline":
        return `<u>${acc}</u>`
      case "strike":
        return `<s>${acc}</s>`
      case "link": {
        const href = hrefSeguro(marca.attrs?.href)
        return href
          ? `<a href="${escapar(href)}" rel="noopener noreferrer" target="_blank">${acc}</a>`
          : acc
      }
      default:
        // Marca desconhecida: ignora a marca, preserva o texto.
        return acc
    }
  }, textoEscapado)
}

function renderizarFilhos(no: NoDoc): string {
  return (no.content ?? []).map(renderizarNo).join("")
}

function renderizarNo(no: NoDoc): string {
  switch (no.type) {
    case "doc":
      return renderizarFilhos(no)
    case "paragraph":
      return `<p>${renderizarFilhos(no)}</p>`
    case "text":
      return aplicarMarcas(escapar(no.text ?? ""), no.marks)
    case "hardBreak":
      return "<br>"
    case "bulletList":
      return `<ul>${renderizarFilhos(no)}</ul>`
    case "orderedList":
      return `<ol>${renderizarFilhos(no)}</ol>`
    case "listItem":
      return `<li>${renderizarFilhos(no)}</li>`
    case "image": {
      const src = srcSeguro(no.attrs?.src)
      if (!src) return ""
      const alt = typeof no.attrs?.alt === "string" ? escapar(no.attrs.alt) : ""
      return `<img src="${src}" alt="${alt}">`
    }
    default:
      // Nó desconhecido (ex.: extensão do editor que este módulo ainda não
      // mapeia): não emite a tag, mas desce pro conteúdo pra não perder texto
      // que estava dentro dele.
      return renderizarFilhos(no)
  }
}

export function construirHtmlComentario(doc: unknown): string {
  if (!doc || typeof doc !== "object") return ""
  return renderizarNo(doc as NoDoc)
}

// "Vazio" não pode ser só "sem texto" -- um comentário com só uma imagem
// colada/inserida (sem nenhuma palavra) é válido, mas um nó de imagem não
// tem texto nenhum. Sem essa checagem contar imagem como conteúdo, tanto o
// botão "Adicionar" no cliente quanto a validação no servidor bloqueavam o
// envio -- o usuário inseria a imagem e não conseguia mandar o comentário,
// mesmo com o upload já tendo funcionado.
export function documentoTemConteudo(doc: unknown): boolean {
  function temConteudo(no: NoDoc): boolean {
    if (no.type === "text") return (no.text ?? "").trim() !== ""
    if (no.type === "image") return srcSeguro(no.attrs?.src) !== null
    return (no.content ?? []).some(temConteudo)
  }
  if (!doc || typeof doc !== "object") return false
  return temConteudo(doc as NoDoc)
}
