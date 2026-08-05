// ============================================================================
// session.ts — sessão do painel admin (JWT via `jose`)
// ============================================================================
// EDGE-SAFE: importa APENAS `jose` e `next/headers`. NÃO importa bcrypt nem
// prisma, para poder ser usado com segurança no `src/proxy.ts` (Proxy/
// ex-middleware). Mantê-lo assim é o que garante o split edge/node do painel.
//
// Divisão de responsabilidades:
//  - signSession / verifySessionToken .. puras (jose); servem tanto no Proxy
//    quanto em Server Components/Actions.
//  - setSessionCookie / clearSessionCookie / getSession .. helpers que usam
//    `cookies()` (async) de next/headers; usar SÓ em contexto de servidor
//    (Server Actions, Route Handlers, Server Components). No Proxy, leia o
//    cookie via `request.cookies.get(...)` e chame `verifySessionToken`.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/** Nome do cookie que guarda o JWT de sessão do admin. */
export const SESSION_COOKIE_NAME = "admin_session";

// Validade da sessão: 7 dias (em segundos, para o maxAge do cookie).
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Dados mínimos guardados na sessão (nunca dados sensíveis). */
export type SessionPayload = {
  /** id do usuário (claim `sub` do JWT). */
  sub: string;
  /** e-mail do usuário. */
  email: string;
};

// Deriva a chave HMAC do AUTH_SECRET. Lazy + validação: um segredo ausente é
// erro de configuração, então falhamos alto ao ASSINAR. Ao VERIFICAR, o erro é
// capturado e vira `null` (redireciona para login) — nunca derruba o Proxy.
function getEncodedKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET não configurado. Defina-o no .env (32+ bytes) antes de usar a autenticação.",
    );
  }
  return new TextEncoder().encode(secret);
}

/** Assina um JWT de sessão (HS256, expira em 7 dias). */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

/**
 * Verifica um token de sessão. Retorna o payload se válido, ou `null` para
 * token ausente/expirado/adulterado (ou segredo ausente). Edge-safe.
 */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

/** Grava o cookie de sessão. Usar em Server Action/Route Handler. */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    // Em dev (http://localhost) `secure` precisa ser false, senão o browser
    // descarta o cookie e o login "não gruda". Em produção (https) é true.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Remove o cookie de sessão (logout). Usar em Server Action/Route Handler. */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Lê e verifica a sessão a partir dos cookies do request (contexto de
 * servidor). Retorna o payload ou `null`. Usar em Server Components/Actions.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
