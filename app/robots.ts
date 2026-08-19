import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /landing é a mesma página que "/" (a canônica) — fora do índice
      // para não competir com ela como conteúdo duplicado.
      disallow: ["/chamados", "/portal", "/configuracoes", "/dashboard", "/avaliar", "/landing"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/sitemap.xml`,
  }
}
