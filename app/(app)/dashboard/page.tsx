import { listarChamados } from "@/lib/tickets/queries"

import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const tickets = await listarChamados()
  return <DashboardClient tickets={tickets} />
}
