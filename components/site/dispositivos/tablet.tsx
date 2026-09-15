import { pathCurvo } from "@/components/site/dispositivos/monitor-curvo"
import { LUZ_ORIGEM, PARADAS_CARCACA, PARADAS_LATERAL, PARADAS_REFLEXO } from "@/components/site/dispositivos/luz"

// Mesma técnica do monitor (bezel com furo em evenodd, tela em HTML comum
// recortada pelo mesmo path via clip-path objectBoundingBox — ver o
// comentário longo em monitor-curvo.tsx sobre por que não é
// <foreignObject>), sag=0 porque vidro de tablet é plano — só o monitor é
// curvo. Bezel uniforme (tablet de verdade tem moldura pareja); a única
// assimetria é a lateral, que sugere a mesma rotação 3D do monitor ao lado
// em hero-montagem, não uma curvatura própria.
const R_OUTER = 0.09
const R_INNER = 0.07
const INSET = 0.045
const ESPESSURA_LATERAL = 0.018

// Caixa é retrato (3:4) — o inverso da conversão do monitor: aqui é a
// LARGURA que precisa ser corrigida pela razão, porque padding-left/right
// também resolvem contra a largura do próprio contêiner, que já É a base
// (nenhuma conversão ali). A conversão entra em padding-top/bottom, que
// resolvem contra essa mesma largura mas represents uma fração vertical.
const ASPECTO_ALTURA_SOBRE_LARGURA = 4 / 3

const OUTER = pathCurvo(0, 0, 1, 1, 0, R_OUTER)
const INNER = pathCurvo(INSET, INSET, 1 - INSET * 2, 1 - INSET * 2, 0, R_INNER)
const BEZEL_COM_FURO = `${OUTER} ${INNER}`

interface TabletProps {
  children: React.ReactNode
}

export function Tablet({ children }: TabletProps) {
  return (
    <div className="relative aspect-[3/4]">
      <svg
        aria-hidden="true"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
      >
        <defs>
          <linearGradient id="tb-carcaca" x1={LUZ_ORIGEM.x1} y1={LUZ_ORIGEM.y1} x2={LUZ_ORIGEM.x2} y2={LUZ_ORIGEM.y2}>
            {PARADAS_CARCACA.map((p) => (
              <stop key={p.offset} offset={p.offset} stopColor={p.color} />
            ))}
          </linearGradient>
          <linearGradient id="tb-lateral" x1="0%" y1="0%" x2="100%" y2="0%">
            {PARADAS_LATERAL.map((p) => (
              <stop key={p.offset} offset={p.offset} stopColor={p.color} />
            ))}
          </linearGradient>
          <clipPath id="tb-furo-clip" clipPathUnits="objectBoundingBox">
            <path d={INNER} />
          </clipPath>
        </defs>

        {/* Lateral primeiro no DOM = atrás da face frontal, que cobre a
            emenda. Mesmo lado do monitor (direita) — os dois giram junto na
            mesma cena em hero-montagem. */}
        <path
          d={`M1,${R_OUTER + 0.02} L${1 + ESPESSURA_LATERAL},${R_OUTER + 0.05} L${1 + ESPESSURA_LATERAL},${1 - R_OUTER - 0.05} L1,${1 - R_OUTER - 0.02} Z`}
          fill="url(#tb-lateral)"
        />

        <path d={BEZEL_COM_FURO} fillRule="evenodd" fill="url(#tb-carcaca)" />

        <circle cx={0.5} cy={INSET / 2} r={0.009} fill="rgba(0,0,0,0.3)" />
        <rect x={0.42} y={1 - INSET / 2 - 0.006} width={0.16} height={0.012} rx={0.006} fill="rgba(0,0,0,0.22)" />
      </svg>

      <div className="absolute inset-0 overflow-hidden bg-background" style={{ clipPath: "url(#tb-furo-clip)" }}>
        <div
          className="h-full w-full [&_[role='img']]:rounded-none [&_[role='img']]:border-0 [&_[role='img']]:shadow-none"
          style={{
            paddingTop: `${INSET * ASPECTO_ALTURA_SOBRE_LARGURA * 100}%`,
            paddingBottom: `${INSET * ASPECTO_ALTURA_SOBRE_LARGURA * 100}%`,
            paddingLeft: `${INSET * 100}%`,
            paddingRight: `${INSET * 100}%`,
          }}
        >
          {children}
        </div>
        {/* Reflexo mais discreto que o do monitor (peça menor, não pode
            competir pela atenção). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(115deg, transparent 0%, transparent 32%, ${PARADAS_REFLEXO[1].color} 46%, ${PARADAS_REFLEXO[2].color} 58%, transparent 74%, transparent 100%)`,
            opacity: 0.7,
          }}
        />
      </div>
    </div>
  )
}
