import type { Metadata } from "next"

import { LandingPage } from "@/components/site/landing-page"

// Mesma landing de "/", mas sem a guarda que manda usuário logado pro shell
// do papel — em "/" o middleware redireciona quem tem sessão, então esta é
// a única forma de abrir a landing sem deslogar.
//
// noindex: é conteúdo idêntico ao de "/", que é a URL canônica de verdade e
// a única que entra no sitemap. Sem isso o buscador veria a mesma página em
// dois endereços.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function LandingSempreAcessivel() {
  return <LandingPage />
}
