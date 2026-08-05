"use server";

// ============================================================================
// login/actions.ts — Server Action de login do painel admin
// ============================================================================
// RUNTIME: Node (Server Action). Aqui SIM pode importar bcrypt (@/lib/password)
// e prisma. O split edge/node é preservado porque o Proxy NÃO importa este
// arquivo — ele usa só @/lib/session (jose).
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie, signSession } from "@/lib/session";

// Hash "isca" com custo idêntico ao real: quando o e-mail não existe, ainda
// executamos uma comparação bcrypt para não vazar, pelo tempo de resposta, se
// o usuário existe (mitiga enumeração de usuários).
const DUMMY_HASH = "$2b$12$o20qny3jPxU7HgcaLTJmWOllADiqa.cnccDLzWrBH654W/DpBYXwe";

// Mensagem única e genérica: nunca revela SE foi o e-mail ou a senha que falhou.
const GENERIC_ERROR = "Credenciais inválidas.";

// --- Rate-limit leve, em memória (best-effort), por IP -----------------------
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 min
const RATE_LIMIT_MAX_ATTEMPTS = 8;
const RATE_LIMIT_PRUNE_THRESHOLD = 1000;
const loginAttempts = new Map<string, number[]>();

function pruneExpired(windowStart: number) {
  for (const [key, times] of loginAttempts) {
    const recent = times.filter((t) => t > windowStart);
    if (recent.length === 0) loginAttempts.delete(key);
    else if (recent.length !== times.length) loginAttempts.set(key, recent);
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  if (loginAttempts.size > RATE_LIMIT_PRUNE_THRESHOLD) pruneExpired(windowStart);

  const attempts = (loginAttempts.get(ip) ?? []).filter((t) => t > windowStart);
  if (attempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    loginAttempts.set(ip, attempts);
    return true;
  }
  attempts.push(now);
  loginAttempts.set(ip, attempts);
  return false;
}

export type LoginState = { error: string | null };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: GENERIC_ERROR };
  }

  // Rate-limit best-effort pelo IP (mesma cadeia usada no formulário público).
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip")?.trim() ||
    null;
  if (ip && isRateLimited(ip)) {
    return {
      error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    };
  }

  // Busca + verificação. Sempre roda um bcrypt.compare (real ou isca) para
  // manter o tempo de resposta constante entre "usuário não existe" e "senha
  // errada". Falhas de I/O caem no catch e viram erro genérico.
  let ok = false;
  let userId: string | null = null;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const hash = user?.password ?? DUMMY_HASH;
    const passwordMatches = await verifyPassword(password, hash);
    if (user && passwordMatches) {
      ok = true;
      userId = user.id;
    }
  } catch {
    console.error("Falha ao verificar credenciais de login.");
    return { error: GENERIC_ERROR };
  }

  if (!ok || !userId) {
    return { error: GENERIC_ERROR };
  }

  const token = await signSession({ sub: userId, email });
  await setSessionCookie(token);

  // redirect() lança NEXT_REDIRECT — precisa ficar FORA de try/catch.
  redirect("/admin");
}
