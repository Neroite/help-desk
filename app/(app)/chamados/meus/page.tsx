import { redirect } from "next/navigation"

// "Meus chamados" é a fila filtrada pelo analista logado. Sem auth ainda,
// então isso só redireciona para a fila global com o sentinel ?analista=eu
// — a página de /chamados traduz "eu" para o usuário mock "u-joao".
export default function MeusChamadosPage() {
  redirect("/chamados?analista=eu")
}
