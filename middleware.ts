import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { redirectPorPapel } from "@/lib/auth/redirect-por-papel"
import type { Papel } from "@/lib/types"

// "/" é a landing pública (app/(site)/page.tsx). Deslogado vê a landing;
// logado cai na regra abaixo (pathname === "/") e vai pro shell do papel.
// robots/sitemap não têm extensão coberta pelo matcher (só exclui
// svg/png/jpg/jpeg/webp) — sem isso o crawler anônimo levaria 307 pra
// /login.
//
// "/landing" é a MESMA landing, mas fora da regra de redirect por papel:
// é o único jeito de abrir a landing estando logado, já que "/" empurra
// quem tem sessão pro shell. Rota pública aqui basta — nenhuma das três
// regras de redirect lá embaixo casa com ela.
const ROTAS_PUBLICAS = ["/", "/landing", "/login", "/robots.txt", "/sitemap.xml"]

function ehRotaPublica(pathname: string): boolean {
  return ROTAS_PUBLICAS.includes(pathname) || pathname.startsWith("/avaliar/")
}

// Landing/robots/sitemap sem cookie de sessão: não há o que revalidar, e
// a regra de redirect por papel só dispara pra quem TEM cookie. Evita um
// round-trip ao Auth por pageview anônimo na página mais acessada.
const SEM_AUTH_OK = new Set(["/", "/landing", "/robots.txt", "/sitemap.xml"])

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const temCookieSb = request.cookies.getAll().some((c) => c.name.startsWith("sb-"))
  if (!temCookieSb && SEM_AUTH_OK.has(request.nextUrl.pathname)) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "helpdesk" },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() (não getSession()) — revalida o token no servidor Auth a
  // cada request; getSession() só lê o cookie e pode aceitar um token já
  // revogado.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user) {
    if (ehRotaPublica(pathname)) return response
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  const { data: usuario } = await supabase
    .from("usuario")
    .select("papel")
    .eq("id", user.id)
    .single()

  // /logout precisa passar direto pro route handler pra qualquer papel —
  // senão a guarda de shell abaixo devolve o solicitante pro /portal antes
  // do signOut() rodar.
  if (pathname === "/logout") return response

  const papel = usuario?.papel as Papel | undefined
  if (!papel) {
    if (ehRotaPublica(pathname)) return response
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  const destinoCorreto = redirectPorPapel(papel)
  const noPortal = pathname.startsWith("/portal")
  const noShellInterno = !noPortal && !ehRotaPublica(pathname)

  // Esta checagem PRECISA rodar antes das duas abaixo: "/" agora é rota
  // pública (ehRotaPublica), então noShellInterno já dá false para "/" —
  // se essa ordem for invertida, um solicitante logado passaria a ver a
  // landing em vez de ser mandado pro /portal.
  if (pathname === "/login" || pathname === "/") {
    return NextResponse.redirect(new URL(destinoCorreto, request.url))
  }
  if (noPortal && papel !== "solicitante") {
    return NextResponse.redirect(new URL(destinoCorreto, request.url))
  }
  if (noShellInterno && papel === "solicitante") {
    return NextResponse.redirect(new URL(destinoCorreto, request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
}
