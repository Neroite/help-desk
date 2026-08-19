import { BeneficiosCta } from "@/components/site/secoes/beneficios-cta"
import { ComoFunciona } from "@/components/site/secoes/como-funciona"
import { CtaFinal } from "@/components/site/secoes/cta-final"
import { DorVirada } from "@/components/site/secoes/dor-virada"
import { FaqSection } from "@/components/site/secoes/faq"
import { Hero } from "@/components/site/secoes/hero"
import { ParaQuem } from "@/components/site/secoes/para-quem"
import { Pilares } from "@/components/site/secoes/pilares"
import { ProvaDeEscala } from "@/components/site/secoes/prova-de-escala"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

// A landing inteira mora aqui, e não no page.tsx, porque duas rotas a
// renderizam: "/" (pública, para visitante deslogado) e "/landing" (mesma
// página, mas acessível também para quem está logado — em "/" o middleware
// manda o usuário autenticado direto pro shell do papel).
export function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo">
        <ComoFunciona />
        <ProvaDeEscala />
        <ParaQuem />
        <DorVirada />
        <Hero />
        <Pilares />
        <BeneficiosCta />
        <FaqSection />
        <CtaFinal />
      </main>
      <SiteFooter />
    </>
  )
}
