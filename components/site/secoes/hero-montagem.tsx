"use client"

import { motion } from "motion/react"

import { MonitorCurvo } from "@/components/site/dispositivos/monitor-curvo"
import { Tablet } from "@/components/site/dispositivos/tablet"
import { SOMBRA_MONITOR, SOMBRA_TABLET } from "@/components/site/dispositivos/luz"
import { MockChamado } from "@/components/site/mockups/mock-chamado"
import { MockKanban } from "@/components/site/mockups/mock-kanban"
import { useReducedMotionSafe } from "@/lib/site/use-reduced-motion-safe"

const EASE = [0.22, 1, 0.36, 1] as const

// Card que aparece nos dois dispositivos: #1041 na fila do Kanban (atrás) é
// o MESMO chamado aberto no tablet (na frente) — não são dois dados soltos
// lado a lado, é o mesmo chamado em dois momentos. O realce (MockKanban
// destaque) é a metade "de dado" de fazer as imagens conversarem; a luz e a
// sombra compartilhadas (dispositivos/luz.ts) são a metade física.
const CARD_EM_COMUM = "#1041"

// Ângulo moderado no giro (rotateY) — os -28° de uma versão anterior
// distorciam demais o texto dos mockups e exigiam uma assimetria de bezel
// impossível de casar com naturalidade. rotateX mais alto que antes: visão
// de cima, olhando por cima dos dispositivos — pedido explícito do usuário
// —, não de frente. Mesmo TILT nos dois: planos paralelos, não dois
// cartões tortos em sentidos opostos.
const TILT = { rotateY: -16, rotateX: 16 }

// Sombra de contato no "chão" sob o conjunto — sem ela o monitor e o
// pedestal parecem flutuar em vez de apoiados numa superfície.
function SombraDeChao() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-[10%] bottom-0 h-8 rounded-full blur-xl"
      style={{ background: "color-mix(in srgb, var(--site-navy) 22%, transparent)" }}
    />
  )
}

// Sombra que o tablet projeta SOBRE a tela do monitor atrás dele — elemento
// dedicado (gradiente radial + blur), não um drop-shadow do tablet: aquele
// só sombreia o que está fora da peça, nunca o que está embaixo dela no
// mesmo plano. É essa mancha que separa visualmente "um na frente do outro"
// de "os dois colados no mesmo plano".
function SombraProjetada() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-[18%] left-[26%] h-[46%] w-[40%] rounded-[40%] blur-xl"
      style={{
        background:
          "radial-gradient(closest-side, color-mix(in srgb, var(--site-navy) 30%, transparent), transparent)",
      }}
    />
  )
}

// Abre a página com o sistema, não com o mecanismo de SLA — o Kanban (fila
// real) no monitor e o chamado aberto (detalhe real) no tablet dramatizam "o
// chamado inteiro em um só lugar" antes de qualquer frase explicar isso. O
// relógio de SLA (ShieldClock) é real e continua na página, só que como
// prova de um mecanismo específico mais abaixo (Mecanismo SLA), não como o
// resumo geral — ver components/site/secoes/mecanismo-sla.tsx.
//
// Monitor curvo + tablet: hardware desenhado em SVG com iluminação de
// verdade (components/site/dispositivos/), não mais div com gradiente
// linear de duas paradas — essa versão anterior lia "sem profundidade"
// porque duas paradas não modelam luz e a curva ignorava o ângulo da cena.
// Sem mouse: peça pequena que não se sustentava contra os dois
// dispositivos principais — pedido explícito do usuário pra tirar.
export function HeroMontagem() {
  const semAnimacao = useReducedMotionSafe()

  const palco = "relative min-w-0 min-h-[280px] pb-14 sm:min-h-[360px] sm:pb-20 [perspective:1700px] lg:min-h-[400px]"
  const posMonitor = "absolute top-0 right-[3%] w-[74%] sm:w-[70%]"
  const posTablet = "absolute top-[13%] left-[5%] w-[33%] sm:w-[30%]"

  if (semAnimacao) {
    return (
      <div className={palco}>
        <SombraDeChao />
        <div
          className={posMonitor}
          style={{ transform: `rotateY(${TILT.rotateY}deg) rotateX(${TILT.rotateX}deg)`, filter: SOMBRA_MONITOR }}
        >
          <MonitorCurvo>
            <MockKanban destaque={CARD_EM_COMUM} />
          </MonitorCurvo>
        </div>
        <SombraProjetada />
        <div
          className={posTablet}
          style={{
            transform: `rotateY(${TILT.rotateY}deg) rotateX(${TILT.rotateX}deg) translateZ(70px)`,
            filter: SOMBRA_TABLET,
          }}
        >
          <Tablet>
            <MockChamado />
          </Tablet>
        </div>
      </div>
    )
  }

  return (
    <div className={palco}>
      <SombraDeChao />

      <motion.div
        className={posMonitor}
        style={{ filter: SOMBRA_MONITOR }}
        initial={{ opacity: 0, y: 28, ...TILT }}
        animate={{ opacity: 1, y: 0, ...TILT }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <MonitorCurvo>
          <MockKanban destaque={CARD_EM_COMUM} />
        </MonitorCurvo>
      </motion.div>

      <SombraProjetada />

      <motion.div
        className={posTablet}
        style={{ filter: SOMBRA_TABLET }}
        initial={{ opacity: 0, y: 28, z: 70, ...TILT }}
        animate={{ opacity: 1, y: 0, z: 70, ...TILT }}
        transition={{ duration: 0.55, delay: 0.18, ease: EASE }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.5, delay: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          <Tablet>
            <MockChamado />
          </Tablet>
        </motion.div>
      </motion.div>
    </div>
  )
}
