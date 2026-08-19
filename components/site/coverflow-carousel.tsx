"use client"

import { useEffect } from "react"
import { motion, useSpring, useTransform, type MotionValue, type PanInfo } from "motion/react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useReducedMotionSafe } from "@/lib/site/use-reduced-motion-safe"

export interface CoverflowSlide {
  key: string
  /** Rótulo curto pro botão do card (leitor de tela) — a legenda de verdade vive fora deste componente. */
  label: string
  content: React.ReactNode
}

interface CoverflowCarouselProps {
  slides: CoverflowSlide[]
  /**
   * Índice "cru", sem limite — cresce ou decresce livremente conforme o
   * usuário navega (não é preso a [0, slides.length)). O conteúdo exibido
   * em cada card usa o resto da divisão por `slides.length`; é isso que
   * faz o loop infinito ser suave (a spring nunca precisa "pular" de volta
   * pro início, só continua contando).
   */
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  ariaLabel: string
  className?: string
}

const SPRING = { stiffness: 300, damping: 32, mass: 0.9 }
const TRANSLATE_PCT_PER_STEP = 68
const ROTATE_DEG_PER_STEP = 32
const SCALE_DROP_PER_STEP = 0.22
const OPACITY_DROP_PER_STEP = 0.32
const MAX_STEPS_VISIVEIS = 2
const SWIPE_OFFSET_THRESHOLD = 60
const SWIPE_VELOCITY_THRESHOLD = 400

function mod(n: number, total: number) {
  return ((n % total) + total) % total
}

// Menor caminho (com sinal) de `a` até `b` num ciclo de tamanho `total` —
// ex. de 3 pra 0 num ciclo de 4 dá +1 (avança), não -3 (não recua).
function menorCaminhoCircular(a: number, b: number, total: number) {
  let delta = mod(b - a, total)
  if (delta > total / 2) delta -= total
  return delta
}

function Card({
  slide,
  slideIndex,
  totalSlides,
  activeIndex,
  springIndex,
  goToRaw,
}: {
  slide: CoverflowSlide
  slideIndex: number
  totalSlides: number
  activeIndex: number
  springIndex: MotionValue<number>
  goToRaw: (rawIndex: number) => void
}) {
  // offset contínuo: distância (com sinal, pelo caminho mais curto no
  // ciclo) entre este card e a posição atual da spring. `raw` seria a
  // distância se o ciclo não existisse; subtrair o múltiplo de
  // `totalSlides` mais próximo "dobra" isso pro caminho mais curto —
  // sempre em (-totalSlides/2, totalSlides/2], sem precisar de módulo
  // dentro do useTransform (que quebraria a interpolação contínua bem na
  // costura do loop).
  const offset = useTransform(springIndex, (v) => {
    const raw = slideIndex - v
    return raw - totalSlides * Math.round(raw / totalSlides)
  })

  const translateX = useTransform(offset, (o) => `${o * TRANSLATE_PCT_PER_STEP}%`)
  const rotateY = useTransform(offset, (o) => `${-o * ROTATE_DEG_PER_STEP}deg`)
  const scale = useTransform(offset, (o) => 1 - Math.min(Math.abs(o), MAX_STEPS_VISIVEIS) * SCALE_DROP_PER_STEP)
  const opacity = useTransform(offset, (o) => 1 - Math.min(Math.abs(o), MAX_STEPS_VISIVEIS) * OPACITY_DROP_PER_STEP)

  const distanciaDiscreta = Math.abs(menorCaminhoCircular(activeIndex, slideIndex, totalSlides))
  const isActive = distanciaDiscreta === 0

  const style = {
    translateX,
    translateY: "-50%",
    rotateY,
    scale,
    opacity,
    zIndex: 10 - distanciaDiscreta,
  } as const

  const cardClassName =
    "absolute top-1/2 left-1/2 w-[82%] -translate-x-1/2 sm:w-[62%] lg:w-[48%] [transform-style:preserve-3d]"

  return (
    <motion.button
      type="button"
      style={style}
      onClick={() => goToRaw(activeIndex + menorCaminhoCircular(activeIndex, slideIndex, totalSlides))}
      aria-label={isActive ? undefined : `Ir para: ${slide.label}`}
      aria-current={isActive || undefined}
      className={cn(
        cardClassName,
        "cursor-pointer rounded-2xl outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      )}
    >
      {slide.content}
    </motion.button>
  )
}

// Efeito coverflow em loop infinito: o card ativo fica centralizado e em
// foco, os vizinhos encolhem/rotacionam/desbotam pros lados em perspectiva
// 3D, ocupando a largura inteira do contêiner (mesma largura das outras
// seções da landing). A posição é uma spring (motion/react) sobre um
// índice CRU e sem limite — nunca clampado, nunca resetado — não um loop
// de requestAnimationFrame manual: a spring já resolve nativamente trocar
// de alvo no meio da animação (mesmo padrão de
// components/site/site-header.tsx pra a barra de progresso), e por ser
// sem limite, atravessar a costura do loop (do último slide de volta ao
// primeiro) é só mais um passo — não precisa de nenhum salto/reset visual.
//
// Com prefers-reduced-motion, a árvore inteira é outra (ver
// useReducedMotionSafe): sem 3D, sem spring — só o card ativo, cheio, com
// os mesmos controles de navegação (o loop aqui é só módulo, sem
// animação). Isso também garante que SSR e a primeira renderização do
// cliente sejam idênticas (o hook começa "sem animação" nos dois), o
// mesmo problema de hidratação já corrigido em components/site/reveal.tsx
// e components/site/shield-clock.tsx.
export function CoverflowCarousel({
  slides,
  activeIndex,
  onActiveIndexChange,
  ariaLabel,
  className,
}: CoverflowCarouselProps) {
  const semAnimacao = useReducedMotionSafe()
  const springIndex = useSpring(activeIndex, SPRING)
  const total = slides.length
  const ativoMod = mod(activeIndex, total)

  // useSpring(number) só usa o argumento como valor INICIAL — ele não
  // observa a prop em renders seguintes (diferente de passar uma
  // MotionValue como fonte, que o hook de fato assina). Sem este efeito, a
  // spring fica parada no índice do primeiro render pra sempre, e cada
  // card calcula seu offset visual contra um "ativo" desatualizado —
  // achado real testando no browser, não só em teoria.
  useEffect(() => {
    springIndex.set(activeIndex)
  }, [activeIndex, springIndex])

  function goToRaw(rawIndex: number) {
    onActiveIndexChange(rawIndex)
  }

  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      goToRaw(activeIndex - 1)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      goToRaw(activeIndex + 1)
    }
  }

  function aoSoltarArraste(_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (info.offset.x <= -SWIPE_OFFSET_THRESHOLD || info.velocity.x <= -SWIPE_VELOCITY_THRESHOLD) {
      goToRaw(activeIndex + 1)
    } else if (info.offset.x >= SWIPE_OFFSET_THRESHOLD || info.velocity.x >= SWIPE_VELOCITY_THRESHOLD) {
      goToRaw(activeIndex - 1)
    }
  }

  const controles = (
    <div className="flex items-center justify-center gap-4">
      <Button variant="ghost" size="icon-sm" onClick={() => goToRaw(activeIndex - 1)} aria-label="Passo anterior">
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>

      <div className="flex items-center gap-2">
        {slides.map((slide, i) => (
          <Button
            key={slide.key}
            variant="ghost"
            size="icon-xs"
            onClick={() => goToRaw(activeIndex + menorCaminhoCircular(activeIndex, i, total))}
            aria-label={`Ir para o passo ${i + 1} de ${total}`}
            aria-current={i === ativoMod || undefined}
            className={cn(
              "rounded-full p-0",
              i === ativoMod ? "size-2.5 bg-primary hover:bg-primary" : "size-2 bg-border hover:bg-muted-foreground/40"
            )}
          />
        ))}
      </div>

      <Button variant="ghost" size="icon-sm" onClick={() => goToRaw(activeIndex + 1)} aria-label="Próximo passo">
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )

  if (semAnimacao) {
    return (
      <div
        className={cn("flex flex-col gap-6", className)}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        onKeyDown={aoTeclar}
      >
        <div className="mx-auto w-full max-w-2xl">{slides[ativoMod]?.content}</div>
        {controles}
      </div>
    )
  }

  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onKeyDown={aoTeclar}
    >
      <motion.div
        className="relative h-[340px] w-full min-w-0 overflow-hidden [perspective:1200px] sm:h-[380px] lg:h-[420px]"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={aoSoltarArraste}
      >
        {slides.map((slide, i) => (
          <Card
            key={slide.key}
            slide={slide}
            slideIndex={i}
            totalSlides={total}
            activeIndex={activeIndex}
            springIndex={springIndex}
            goToRaw={goToRaw}
          />
        ))}
      </motion.div>

      {controles}
    </div>
  )
}
