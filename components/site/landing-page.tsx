import { ComoFunciona } from "@/components/site/secoes/como-funciona"
import { CtaFinal } from "@/components/site/secoes/cta-final"
import { DorVirada } from "@/components/site/secoes/dor-virada"
import { FaqSection } from "@/components/site/secoes/faq"
import { Hero } from "@/components/site/secoes/hero"
import { MecanismoSla } from "@/components/site/secoes/mecanismo-sla"
import { ParaQuem } from "@/components/site/secoes/para-quem"
import { Pilares } from "@/components/site/secoes/pilares"
import { ProvaDeEscala } from "@/components/site/secoes/prova-de-escala"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

// A landing inteira mora aqui, e não no page.tsx, porque duas rotas a
// renderizam: "/" (pública, para visitante deslogado) e "/landing" (mesma
// página, mas acessível também para quem está logado — em "/" o middleware
// manda o usuário autenticado direto pro shell do papel).
//
// Hero é a primeira seção, de propósito: é o único h1 da página, e agora
// abre com o sistema de chamados (Kanban + chamado aberto), não mais com o
// mecanismo de SLA — decisão do usuário, o foco do produto pro visitante é
// "help desk completo", com o SLA como um mecanismo específico, não o
// resumo geral. O ShieldClock (elemento mais autoral do sistema visual)
// continua na página inteiro, só que como MecanismoSla, logo antes de
// Pilares — onde ele funciona como prova do pilar "Entenda a pausa" sem
// competir com o Hero pela primeira impressão.
export function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo">
        <Hero />
        <ComoFunciona />
        <ProvaDeEscala />
        <ParaQuem />
        <DorVirada />
        <MecanismoSla />
        <Pilares />
        <FaqSection />
        <CtaFinal />
      </main>
      <SiteFooter />
    </>
  )
}
