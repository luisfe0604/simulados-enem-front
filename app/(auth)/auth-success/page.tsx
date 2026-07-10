import { redirect } from "next/navigation";

// No fluxo antigo esta página recebia ?token= na URL e salvava no localStorage.
// Agora o cookie httpOnly já é setado pelo callback do OAuth no servidor, então
// aqui só encaminhamos para a home (o middleware cuida do resto se não houver
// sessão). Mantida para compatibilidade com links/bookmarks antigos.
export default function AuthSuccessPage() {
  redirect("/");
}
