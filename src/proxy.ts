// ============================================================================
// proxy.ts — proteção de rotas /admin (Proxy do Next 16)
// ============================================================================
// ⚠️  NOME DO ARQUIVO: no Next 16 o antigo `middleware.ts` foi RENOMEADO para
//     `proxy.ts` (o convention `middleware` está deprecado). Ver
//     node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
//     Neste projeto o arquivo fica em `src/proxy.ts` (mesmo nível de `app`).
//
// IMPORT CHAIN (edge-safe por design): proxy.ts -> @/lib/session (jose +
// next/headers). NÃO importa bcrypt nem prisma. bcrypt vive só em
// @/lib/password (Node) e é usado apenas por Server Actions / scripts.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin/login é público — senão ninguém conseguiria autenticar.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Checagem "otimista": lê o cookie direto do request e valida a assinatura
  // (sem I/O de banco). A verificação forte (sessão + papel) é refeita no
  // layout do route group (app) e deve ser refeita em cada Server Action.
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Cobre a raiz /admin (dashboard) E todas as subrotas /admin/*. O bypass de
// /admin/login é tratado no corpo acima.
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
