// Fonte única de luz da cena do Hero: monitor e tablet (hero-montagem.tsx)
// leem sob a mesma direção porque puxam tudo daqui — highlight, sombra e
// vinheta calibrados juntos, não reinventados por componente. É a metade
// "física" de fazer as duas telas conversarem (a outra metade, o dado em
// comum entre o card do Kanban e o chamado aberto, mora em hero-montagem).
//
// Luz vindo de cima-esquerda: paradas de gradiente vão de claro (perto da
// luz) a escuro (terminador) na diagonal 0,0 → 1,1 do objectBoundingBox, e
// toda sombra cai para baixo-direita. Cores de sombra sempre via
// color-mix(var(--site-navy)) — Fixed-Navy Rule de site.css, nenhuma cor
// nova na paleta.

export const LUZ_ORIGEM = { x1: "0%", y1: "0%", x2: "100%", y2: "100%" } as const

// Carcaça de plástico branco: highlight → meio-tom → terminador → luz
// rebatida no rodapé (a rebatida é o que dá espessura — sem ela a peça
// escurece até a borda e lê como sombra achatada, não como volume).
export const PARADAS_CARCACA = [
  { offset: "0%", color: "#ffffff" },
  { offset: "24%", color: "#f5f7fb" },
  { offset: "50%", color: "#e3e7ef" },
  { offset: "78%", color: "#c7cdd9" },
  { offset: "100%", color: "#d9dde6" },
] as const

// Lateral/espessura: face que a rotação expõe, sempre de costas pra luz —
// mais escura no geral, sem highlight.
export const PARADAS_LATERAL = [
  { offset: "0%", color: "#c3c8d3" },
  { offset: "55%", color: "#aab0bf" },
  { offset: "100%", color: "#9299a9" },
] as const

// Pedestal: luz vem de cima (não da diagonal do bezel) porque é uma
// superfície que se ergue do chão — escurece até o pé, onde encontra a
// própria sombra de contato.
export const PARADAS_PEDESTAL = [
  { offset: "0%", color: "#f7f9fc" },
  { offset: "38%", color: "#e7ebf1" },
  { offset: "72%", color: "#ccd2dd" },
  { offset: "100%", color: "#b7bdc9" },
] as const

// Reflexo especular: faixa diagonal clara e de baixa opacidade sobre o
// vidro. Pico em 35% (não 100%) — vidro real nunca estoura pra branco
// puro, e um pico alto lavava o conteúdo da tela por baixo.
export const PARADAS_REFLEXO = [
  { offset: "0%", color: "rgba(255,255,255,0)" },
  { offset: "45%", color: "rgba(255,255,255,0.30)" },
  { offset: "58%", color: "rgba(255,255,255,0.14)" },
  { offset: "100%", color: "rgba(255,255,255,0)" },
] as const

function sombra(dx: number, dy: number, blur: number, opacidadePct: number) {
  return `drop-shadow(${dx}px ${dy}px ${blur}px color-mix(in srgb, var(--site-navy) ${opacidadePct}%, transparent))`
}

// Duas camadas por peça: ambiente (longa, difusa, o "peso" geral) + contato
// (curta, mais escura, o que gruda o objeto no plano atrás dele). Uma sem a
// outra é sempre a versão errada — só ambiente flutua, só contato pesa
// pouco demais pro tamanho da peça.
export const SOMBRA_MONITOR = `${sombra(14, 30, 15, 12)} ${sombra(6, 12, 34, 24)}`
export const SOMBRA_TABLET = `${sombra(10, 16, 10, 16)} ${sombra(4, 7, 20, 26)}`

// Vinheta de curvatura: as pontas de uma tela curva recebem menos luz que o
// centro. Só o monitor tem — o tablet é vidro plano.
export const VINHETA_CURVATURA =
  "linear-gradient(90deg, color-mix(in srgb, var(--site-navy) 14%, transparent) 0%, transparent 18%, transparent 82%, color-mix(in srgb, var(--site-navy) 16%, transparent) 100%)"
