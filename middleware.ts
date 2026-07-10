import { NextRequest, NextResponse } from "next/server";
import { TOKEN_COOKIE, verifyToken } from "@/lib/auth";

// Substitui o PrivateRoute client-side do app React: a proteção de rota agora
// acontece no Edge, antes da página renderizar (sem "flash" de conteúdo).
//
// Escopo: apenas AUTENTICAÇÃO (logado ou não). A AUTORIZAÇÃO de admin exige
// consultar is_admin no banco, o que não roda bem no Edge — por isso as páginas
// admin (/questao, /dash-admin, /users) reconferem o is_admin no server-side.

const PUBLIC_PATHS = ["/login", "/register", "/auth-success"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const session = await verifyToken(token);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Já logado tentando acessar login/registro → manda para a home
  if (isPublic) {
    if (session && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Rota protegida sem sessão válida → login (preservando o destino)
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Roda em tudo, menos rotas de API (têm auth própria), assets do Next e
  // arquivos estáticos públicos.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)"],
};
