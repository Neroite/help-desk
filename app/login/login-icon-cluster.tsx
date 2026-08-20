"use client"

import { BarChart3, Bell, Kanban, TimerReset } from "lucide-react"
import { motion, useReducedMotion, type Variants } from "motion/react"

import { AegisLogo } from "@/components/brand/aegis-logo"

const ICONES = [
  { Icon: Bell, className: "top-2 left-0 size-14", iconClassName: "size-6" },
  { Icon: TimerReset, className: "right-0 bottom-8 size-16", iconClassName: "size-7" },
  { Icon: Kanban, className: "top-10 -right-6 size-12", iconClassName: "size-5" },
  { Icon: BarChart3, className: "bottom-0 left-6 size-12", iconClassName: "size-5" },
] as const

const FLOAT_DELAYS = [0, 0.4, 0.8, 1.2]
const FLOAT_DURATIONS = [3.2, 3.6, 3, 3.4]

export function LoginIconCluster() {
  const semAnimacao = useReducedMotion()

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: semAnimacao ? 0 : 0.12, delayChildren: 0.15 },
    },
  }

  const item: Variants = {
    hidden: { opacity: 0, scale: 0.6, y: 12 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 },
    },
  }

  return (
    <motion.div
      className="relative flex size-72 items-center justify-center"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <motion.div
        variants={item}
        animate={semAnimacao ? undefined : { scale: [1, 1.03, 1] }}
        transition={
          semAnimacao ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }
        className="flex size-44 items-center justify-center rounded-[2.5rem] border border-primary/20 bg-surface/80 shadow-lg backdrop-blur-sm"
      >
        <AegisLogo className="size-16 text-primary" />
      </motion.div>

      {ICONES.map(({ Icon, className, iconClassName }, i) => (
        <motion.div
          key={className}
          variants={item}
          className={`absolute flex items-center justify-center rounded-2xl border border-border bg-surface shadow-md ${className}`}
        >
          <motion.div
            animate={semAnimacao ? undefined : { y: [0, -8, 0] }}
            transition={
              semAnimacao
                ? undefined
                : {
                    duration: FLOAT_DURATIONS[i],
                    delay: FLOAT_DELAYS[i],
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          >
            <Icon className={`${iconClassName} text-primary`} aria-hidden="true" />
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  )
}
