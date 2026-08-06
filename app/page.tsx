import { redirect } from "next/navigation";

// Sem auth real ainda (papel do usuário logado é mockado nas telas) —
// a raiz do site entra direto na fila de chamados, a tela que o
// analista/admin usa o dia inteiro.
export default function Home() {
  redirect("/chamados");
}
