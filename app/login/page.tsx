import {
  BarChart3,
  Bell,
  Kanban,
  Lock,
  Mail,
  Ticket,
  TimerReset,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { login } from "./actions"

const DESTAQUES = [
  { icon: TimerReset, texto: "SLA calculado automaticamente" },
  { icon: Kanban, texto: "Fila e Kanban em tempo real" },
  { icon: BarChart3, texto: "Dashboard de indicadores" },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { erro } = await searchParams

  return (
    <div className="mx-auto grid min-h-svh max-w-6xl lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center gap-8 bg-background px-4 py-16">
        <div className="flex items-center gap-2.5 text-foreground">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Ticket className="size-5" aria-hidden="true" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Help-Desk</span>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-semibold text-balance text-foreground">
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-primary-foreground">
              Entrar
            </span>{" "}
            no Help-Desk
          </h1>

          <form action={login} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  className="h-11 pl-9 text-base md:text-base"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Lock
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  className="h-11 pl-9 text-base md:text-base"
                  required
                />
              </div>
            </div>

            {erro ? (
              <p role="alert" className="text-sm text-destructive">
                {erro}
              </p>
            ) : null}

            <Button type="submit" className="mt-2 h-11 cursor-pointer text-base">
              Entrar
            </Button>
          </form>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/15 lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-10 lg:p-16">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-16 size-80 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-10 size-96 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex size-72 items-center justify-center">
          <div className="flex size-44 items-center justify-center rounded-[2.5rem] border border-primary/20 bg-surface/80 shadow-lg backdrop-blur-sm">
            <Ticket className="size-16 text-primary" aria-hidden="true" />
          </div>

          <div className="absolute top-2 left-0 flex size-14 items-center justify-center rounded-2xl border border-border bg-surface shadow-md">
            <Bell className="size-6 text-primary" aria-hidden="true" />
          </div>
          <div className="absolute right-0 bottom-8 flex size-16 items-center justify-center rounded-2xl border border-border bg-surface shadow-md">
            <TimerReset className="size-7 text-primary" aria-hidden="true" />
          </div>
          <div className="absolute top-10 -right-6 flex size-12 items-center justify-center rounded-2xl border border-border bg-surface shadow-md">
            <Kanban className="size-5 text-primary" aria-hidden="true" />
          </div>
          <div className="absolute bottom-0 left-6 flex size-12 items-center justify-center rounded-2xl border border-border bg-surface shadow-md">
            <BarChart3 className="size-5 text-primary" aria-hidden="true" />
          </div>
        </div>

        <div className="relative flex max-w-sm flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-semibold text-balance text-foreground">
            Atenda mais rápido, com o <span className="text-primary">SLA sempre à vista</span>
          </h2>
          <p className="text-sm text-pretty text-muted-foreground">
            Fila unificada, Kanban colaborativo e prazos calculados automaticamente — tudo num só
            lugar para sua equipe nunca perder um chamado de vista.
          </p>
        </div>

        <div className="relative flex flex-wrap items-center justify-center gap-2">
          {DESTAQUES.map(({ icon: Icon, texto }) => (
            <span
              key={texto}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm"
            >
              <Icon className="size-3.5 text-primary" aria-hidden="true" />
              {texto}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
