import { listarSlaPolicies } from "@/lib/tickets/queries"

import { SlaClient } from "./sla-client"

export default async function SlaPage() {
  const policies = await listarSlaPolicies()

  return <SlaClient policies={policies} />
}
