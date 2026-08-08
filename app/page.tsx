import { redirect } from "next/navigation";

// O middleware já redireciona "/" pro destino certo (login, /chamados ou
// /portal) antes de chegar aqui — isso só cobre o caso raro de usuário
// autenticado sem linha em helpdesk.usuario (papel indefinido).
export default function Home() {
  redirect("/chamados");
}
