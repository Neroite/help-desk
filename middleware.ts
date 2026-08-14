import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { redirectPorPapel } from "@/lib/auth/redirect-por-papel"
import type { Papel } from "@/lib/types"

const ROTAS_PUBLICAS = ["/login"]

function ehRotaPublica(pathname: string): boolean {
  return ROTAS_PUBLICAS.includes(pathname) || pathname.startsWith("/avaliar/")
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

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
  if (!papel) return response

  const destinoCorreto = redirectPorPapel(papel)
  const noPortal = pathname.startsWith("/portal")
  const noShellInterno = !noPortal && !ehRotaPublica(pathname)

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
