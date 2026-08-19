"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AegisLogo } from "@/components/site/aegis-logo"
import { NAV, HERO } from "@/lib/site/conteudo"

// Menu mobile é um disclosure EM FLUXO, não Sheet: Sheet renderiza num
// portal (fora da árvore do DOM local), o que escaparia do escopo de
// tokens `.landing` (site.css) — o menu perderia --radius:14px e as
// chaves de tipografia de display.
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const sentinelaRef = useRef<HTMLDivElement>(null)
  const semAnimacao = useReducedMotion()

  // Barra fina de progresso de leitura — a única peça de motion "ambiente"
  // do header, e ela mesma amarra a ideia central da página (tempo que
  // passa) ao gesto mais comum na landing (rolar a página).
  const { scrollYProgress } = useScroll()
  const progresso = useSpring(scrollYProgress, { stiffness: 280, damping: 40, restDelta: 0.001 })

  useEffect(() => {
    const alvo = sentinelaRef.current
    if (!alvo) return
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), {
      rootMargin: "-1px 0px 0px 0px",
      threshold: 1,
    })
    observer.observe(alvo)
    return () => observer.disconnect()
  }, [])

  const progressoExibido = semAnimacao ? scrollYProgress : progresso

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <div ref={sentinelaRef} className="h-px" aria-hidden="true" />
      <header
        data-scrolled={scrolled}
        className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-sm transition-[border-color,box-shadow] duration-200 data-[scrolled=true]:border-border data-[scrolled=true]:shadow-sm relative"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="shrink-0">
            <AegisLogo />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-lead text-foreground/80 transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button render={<Link href="/login" />} nativeButton={false} variant="ghost">
              Entrar
            </Button>
            <Button render={<Link href="/login" />} nativeButton={false}>
              {HERO.ctaPrimario}
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg text-foreground md:hidden"
            aria-expanded={menuAberto}
            aria-controls="menu-mobile"
            onClick={() => setMenuAberto((v) => !v)}
          >
            {menuAberto ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="sr-only">{menuAberto ? "Fechar menu" : "Abrir menu"}</span>
          </button>
        </div>

        {menuAberto ? (
          <nav id="menu-mobile" className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-2 py-2 text-lead text-foreground/80"
                onClick={() => setMenuAberto(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button render={<Link href="/login" />} nativeButton={false} variant="outline">
                Entrar
              </Button>
              <Button render={<Link href="/login" />} nativeButton={false}>
                {HERO.ctaPrimario}
              </Button>
            </div>
          </nav>
        ) : null}

        <motion.div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary"
          style={{ scaleX: progressoExibido }}
        />
      </header>
    </>
  )
}
