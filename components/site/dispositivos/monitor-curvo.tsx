import {
  LUZ_ORIGEM,
  PARADAS_CARCACA,
  PARADAS_LATERAL,
  PARADAS_PEDESTAL,
  PARADAS_REFLEXO,
  VINHETA_CURVATURA,
} from "@/components/site/dispositivos/luz"

// Tudo em coordenadas normalizadas 0..1 (viewBox="0 0 1 1"): o mesmo path
// serve pra silhueta externa E pro furo da tela, só muda o inset que
// recebe — é o que garante que o buraco do bezel e o recorte da tela batem
// exatamente, sem costura. Ver plano: "o furo é assimétrico".
// Exportada: tablet.tsx reusa (com sag=0, vira retângulo arredondado comum)
// pra bezel com furo seguir a mesma técnica nos dois dispositivos.
export function pathCurvo(x: number, y: number, w: number, h: number, sag: number, r: number) {
  const x0 = x
  const y0 = y
  const x1 = x + w
  const y1 = y + h
  const midX = x + w / 2
  return [
    `M${x0 + r},${y0}`,
    `Q${midX},${y0 + sag} ${x1 - r},${y0}`,
    `Q${x1},${y0} ${x1},${y0 + r}`,
    `L${x1},${y1 - r}`,
    `Q${x1},${y1} ${x1 - r},${y1}`,
    `Q${midX},${y1 - sag} ${x0 + r},${y1}`,
    `Q${x0},${y1} ${x0},${y1 - r}`,
    `L${x0},${y0 + r}`,
    `Q${x0},${y0} ${x0 + r},${y0}`,
    "Z",
  ].join(" ")
}

// Amplitude baixa (~5% da altura): curva forte engolia a barra de URL e
// engrossava o bezel no centro mais que nas pontas (defeito da versão
// anterior). Bezel ASSIMÉTRICO — mais grosso à esquerda (lado que a cena em
// hero-montagem mantém perto da câmera, mesmo lado onde o tablet pousa),
// mais fino à direita (lado que a rotação afasta): é essa diferença, não a
// curva em si, que faz o olho aceitar que a tela é curva e não só recortada.
const SAG = 0.05
const R_OUTER = 0.045
const R_INNER = 0.032
const INSET = { top: 0.072, bottom: 0.046, esquerda: 0.058, direita: 0.026 }
const ESPESSURA_LATERAL = 0.02
// Espessura visível na aresta de CIMA: com a cena olhando de cima (rotateX
// alto em hero-montagem), essa aresta vira de frente pra câmera em vez de
// ficar de perfil — sem ela o topo parece uma folha de papel colada no ar.
const ESPESSURA_TOPO = 0.016

// `padding-top`/`padding-bottom` em CSS resolvem contra a LARGURA do
// contêiner, não a altura (regra do spec, não bug) — então uma fração
// vertical (INSET.top, calculada no viewBox quadrado 0..1) precisa passar
// por essa razão pra virar o percentual correto de padding. Sem isso o
// respiro do topo saía ~1,8× maior que o pretendido (16:9).
const ASPECTO_ALTURA_SOBRE_LARGURA = 9 / 16

const OUTER = pathCurvo(0, 0, 1, 1, SAG, R_OUTER)
const INNER = pathCurvo(
  INSET.esquerda,
  INSET.top,
  1 - INSET.esquerda - INSET.direita,
  1 - INSET.top - INSET.bottom,
  SAG,
  R_INNER,
)
const BEZEL_COM_FURO = `${OUTER} ${INNER}`

// Peça única de pescoço + base (aprovada pelo usuário na rodada anterior),
// só que agora com gradiente de luz e sombra de contato no pé em vez de
// cor chapada.
const PEDESTAL = "M31,0 L69,0 C70,40 79,64 97,72 L97,86 C97,95 93,100 86,100 L14,100 C7,100 3,95 3,86 L3,72 C21,64 30,40 31,0 Z"

interface MonitorCurvoProps {
  children: React.ReactNode
}

// Monitor com tela curva de verdade: bezel em SVG (iluminação de luz.ts,
// furo assimétrico via evenodd) com a UI viva por cima em HTML comum,
// recortada pelo MESMO path do furo via clip-path objectBoundingBox — os
// dois elementos (SVG e a tela) têm exatamente a mesma caixa, então o path
// bate sem costura em nenhum dos dois. (Uma primeira versão usava
// <foreignObject> pra embutir a UI dentro do próprio <svg>; o Chromium
// esparrama a altura de um filho com `height:100%` dentro de foreignObject
// pra dezenas de milhares de px — bug conhecido do elemento, não do path.
// HTML normal ao lado do SVG não tem esse problema.)
export function MonitorCurvo({ children }: MonitorCurvoProps) {
  return (
    <div className="relative aspect-[16/9]">
      <svg
        aria-hidden="true"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
      >
        <defs>
          <linearGradient id="mc-carcaca" x1={LUZ_ORIGEM.x1} y1={LUZ_ORIGEM.y1} x2={LUZ_ORIGEM.x2} y2={LUZ_ORIGEM.y2}>
            {PARADAS_CARCACA.map((p) => (
              <stop key={p.offset} offset={p.offset} stopColor={p.color} />
            ))}
          </linearGradient>
          <linearGradient id="mc-lateral" x1="0%" y1="0%" x2="100%" y2="0%">
            {PARADAS_LATERAL.map((p) => (
              <stop key={p.offset} offset={p.offset} stopColor={p.color} />
            ))}
          </linearGradient>
          {/* Aresta de cima: vira de frente pra luz numa visão de cima —
              clareia em vez de escurecer, ao contrário da lateral. */}
          <linearGradient id="mc-topo" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dde1e9" />
          </linearGradient>
          <clipPath id="mc-furo-clip" clipPathUnits="objectBoundingBox">
            <path d={INNER} />
          </clipPath>
        </defs>

        {/* Aresta de cima, pintada primeiro (atrás da face frontal). */}
        <path
          d={`M${R_OUTER + 0.03},0 L${R_OUTER + 0.08},${-ESPESSURA_TOPO} L${1 - R_OUTER - 0.08},${-ESPESSURA_TOPO} L${1 - R_OUTER - 0.03},0 Z`}
          fill="url(#mc-topo)"
        />

        {/* Lateral: espessura que a rotação expõe do lado direito (o que
            foge da câmera). Pintada primeiro = fica atrás da face frontal,
            que cobre a emenda entre as duas. */}
        <path
          d={`M1,${R_OUTER + 0.03} L${1 + ESPESSURA_LATERAL},${R_OUTER + 0.07} L${1 + ESPESSURA_LATERAL},${1 - R_OUTER - 0.07} L1,${1 - R_OUTER - 0.03} Z`}
          fill="url(#mc-lateral)"
        />

        {/* Face frontal com o furo da tela (fill-rule evenodd: dois
            subpaths, o segundo vira buraco no primeiro). */}
        <path d={BEZEL_COM_FURO} fillRule="evenodd" fill="url(#mc-carcaca)" />

        {/* Câmera: lente com anel, não só um ponto — some numa miniatura
            mas fica nítida no tamanho real da seção. */}
        <circle cx={0.5} cy={INSET.top / 2} r={0.009} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={0.0025} />
        <circle cx={0.5} cy={INSET.top / 2} r={0.0045} fill="rgba(0,0,0,0.35)" />
      </svg>

      {/* Tela: HTML comum do mesmo tamanho do <svg> acima, recortada pelo
          MESMO clipPath (mc-furo-clip) — por isso o `d={INNER}` não precisa
          ser convertido pra outro sistema de coordenada. */}
      <div className="absolute inset-0 overflow-hidden bg-background" style={{ clipPath: "url(#mc-furo-clip)" }}>
        {/* Faixa livre à esquerda (pl): é onde o tablet pousa em
            hero-montagem — sem ela o tablet cobria palavras do Kanban ao
            meio. Fade à direita (mask): a fila é mais larga que a tela, e
            terminar num card serrado era pior que dissolver o conteúdo.
            O padding usa os MESMOS INSET desta caixa cheia (não a caixa
            menor de antes) — é como a tela cai exatamente dentro do furo. */}
        <div
          className="h-full w-full [&_[role='img']]:rounded-none [&_[role='img']]:border-0 [&_[role='img']]:shadow-none"
          style={{
            paddingTop: `${(INSET.top + 0.02) * ASPECTO_ALTURA_SOBRE_LARGURA * 100}%`,
            paddingBottom: `${INSET.bottom * ASPECTO_ALTURA_SOBRE_LARGURA * 100}%`,
            paddingLeft: `${(INSET.esquerda + 0.12) * 100}%`,
            paddingRight: `${INSET.direita * 100}%`,
            maskImage: "linear-gradient(to right, #000 0%, #000 80%, transparent 96%)",
            WebkitMaskImage: "linear-gradient(to right, #000 0%, #000 80%, transparent 96%)",
          }}
        >
          {children}
        </div>
        {/* Vinheta de curvatura: as pontas de uma tela curva pegam menos luz
            que o centro — sem ela a curva lê como silhueta recortada, não
            como volume. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: VINHETA_CURVATURA }} />
        {/* Reflexo especular por cima do conteúdo. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(115deg, transparent 0%, transparent 30%, ${PARADAS_REFLEXO[1].color} 45%, ${PARADAS_REFLEXO[2].color} 58%, transparent 75%, transparent 100%)`,
          }}
        />
      </div>

      {/* Pedestal: pescoço + base fora do fluxo, dentro do mesmo grupo com
          rotação 3D do wrapper pai em hero-montagem — gira junto porque é o
          mesmo objeto rígido. Sombra de contato no pé (drop-shadow) em vez
          de só a sombra de chão do palco, senão a base achata. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute top-[92%] left-1/2 h-[23%] w-[33%] -translate-x-1/2 overflow-visible"
        style={{ filter: "drop-shadow(0 3px 3px color-mix(in srgb, var(--site-navy) 22%, transparent))" }}
      >
        <defs>
          <linearGradient id="mc-pedestal" x1="0%" y1="0%" x2="0%" y2="100%">
            {PARADAS_PEDESTAL.map((p) => (
              <stop key={p.offset} offset={p.offset} stopColor={p.color} />
            ))}
          </linearGradient>
        </defs>
        <path d={PEDESTAL} fill="url(#mc-pedestal)" />
      </svg>
    </div>
  )
}
