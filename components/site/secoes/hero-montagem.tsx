"use client"

import { motion } from "motion/react"

import { PalcoDistintivo } from "@/components/site/palco-distintivo"
import { useReducedMotionSafe } from "@/lib/site/use-reduced-motion-safe"

const EASE = [0.22, 1, 0.36, 1] as const

// Distintivo Aegis em 3D (Three.js + CSG) — artefato gerado à parte a partir
// do logo 2D e embutido via iframe em public/3d/distintivo-aegis.html (mesmo
// HTML standalone, só com o texto explicativo do artefato original escondido
// via CSS: aqui ele é peça visual do hero, não uma página própria). Substitui
// a montagem anterior de monitor curvo + tablet — decisão explícita do
// usuário, não uma reversão silenciosa: os componentes de dispositivos/
// mockups continuam em uso em pilares.tsx e como-funciona.tsx.
export function HeroMontagem() {
  const semAnimacao = useReducedMotionSafe()

  const palco = "relative min-w-0 min-h-[320px] sm:min-h-[420px] lg:min-h-[480px]"

  const badge = (
    <iframe
      src="/3d/distintivo-aegis.html"
      title="Distintivo Aegis em 3D"
      // `relative` não é enfeite: o PalcoDistintivo é absoluto e vem antes
      // no DOM, e elemento posicionado pinta acima de conteúdo em fluxo,
      // seja qual for a ordem. Sem isto o poço de luz do chão cobriria o
      // distintivo no ramo sem animação. Posicionado e depois no DOM, o
      // iframe volta para cima — sem precisar de z-index.
      className="relative h-full w-full border-0"
      // A sombra de contato é desenhada dentro do canvas e, com o FOV
      // vertical fixo da câmera, termina em corte reto na borda de baixo do
      // iframe. Com fundo claro liso o corte quase não aparecia; com halo e
      // anéis atrás ele virou emenda. Os últimos 10% dissolvem a sombra na
      // sombra ambiente do PalcoDistintivo em vez de cortá-la.
      style={{
        maskImage: "linear-gradient(180deg, #000 90%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(180deg, #000 90%, transparent 100%)",
      }}
      loading="lazy"
    />
  )

  // O palco (halo, anéis, chão) fica FORA do motion.div de propósito: o
  // distintivo entra subindo 28px, e arrastar os anéis junto faria o chão
  // deslizar por baixo da peça. O palco é o lugar; quem chega é o objeto.
  // O iframe é transparente (scene.background = null, setClearColor(0,0)),
  // então tudo isto aparece através dele.
  if (semAnimacao) {
    return (
      <div className={palco}>
        <PalcoDistintivo />
        {badge}
      </div>
    )
  }

  return (
    <div className={palco}>
      <PalcoDistintivo />
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        {badge}
      </motion.div>
    </div>
  )
}
