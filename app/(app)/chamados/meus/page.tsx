import { redirect } from "next/navigation"

// "Meus chamados" é a fila filtrada pelo analista logado — redireciona
// pra fila global com o sentinel ?analista=eu, que o chamados-client
// traduz pro id do usuário autenticado (useReferenceData().usuarioAtual).
export default function MeusChamadosPage() {
  redirect("/chamados?analista=eu")
}
