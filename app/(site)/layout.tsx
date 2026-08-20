import type { Metadata } from "next"

import "./site.css"

const TITULO = "Aegis — help desk com SLA que sabe quando parar"
const DESCRICAO =
  "Motor de SLA com expediente fixo e pausa que congela o prazo de verdade, Kanban em tempo real e isolamento de dado por empresa aplicado no banco."

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Aegis" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRICAO,
    images: ["/og.png"],
  },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className="landing">{children}</div>
}
