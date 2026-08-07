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
import {
  clearMfaPendingCookie,
  getMfaPending,
  setMfaPendingCookie,
  setSessionCookie,
  signMfaPending,
  signSession,
} from "@/lib/session";
import { verifyTotp } from "@/lib/mfa";

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

export type LoginStep = "password" | "mfa";
export type LoginState = { error: string | null; step: LoginStep };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: GENERIC_ERROR, step: "password" };
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
      step: "password",
    };
  }

  // Busca + verificação. Sempre roda um bcrypt.compare (real ou isca) para
  // manter o tempo de resposta constante entre "usuário não existe" e "senha
  // errada". Falhas de I/O caem no catch e viram erro genérico.
  let ok = false;
  let userId: string | null = null;
  let mfaRequired = false;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, mfaEnabled: true, totpSecret: true },
    });
    const hash = user?.password ?? DUMMY_HASH;
    const passwordMatches = await verifyPassword(password, hash);
    if (user && passwordMatches) {
      ok = true;
      userId = user.id;
      // MFA "ligado" sem secret é estado inconsistente — trata como desligado
      // para não trancar ninguém para fora.
      mfaRequired = Boolean(user.mfaEnabled && user.totpSecret);
    }
  } catch (error) {
    console.error("Falha ao verificar credenciais de login.", error);
    return { error: GENERIC_ERROR, step: "password" };
  }

  if (!ok || !userId) {
    return { error: GENERIC_ERROR, step: "password" };
  }

  // MFA ligado: NÃO cria a sessão ainda. Grava o cookie pendente (5 min) e manda
  // a UI para a etapa do código. O Proxy segue barrando /admin sem admin_session.
  if (mfaRequired) {
    try {
      const pendingToken = await signMfaPending({ sub: userId, email });
      await setMfaPendingCookie(pendingToken);
    } catch (error) {
      console.error("Falha ao iniciar a etapa de MFA.", error);
      return { error: GENERIC_ERROR, step: "password" };
    }
    return { error: null, step: "mfa" };
  }

  // signSession() chama getEncodedKey(), que LANÇA se AUTH_SECRET sumir; sem
  // este try, uma configuração quebrada viraria um 500 "credenciais válidas mas
  // o login falha". Capturamos e devolvemos o erro genérico (o motivo real fica
  // só no log, para não vazar estado de configuração no formulário).
  try {
    const token = await signSession({ sub: userId, email });
    await setSessionCookie(token);
  } catch (error) {
    console.error("Falha ao assinar/gravar a sessão (AUTH_SECRET ausente?).", error);
    return { error: GENERIC_ERROR, step: "password" };
  }

  // redirect() lança NEXT_REDIRECT — precisa ficar FORA do try/catch acima,
  // senão o catch engoliria o sinal de redirecionamento.
  redirect("/admin");
}

// --- PASSO 2: verificação do código TOTP -------------------------------------
// Rate-limit do OTP por userId: 6 dígitos sem limite = brute-force trivial (1M
// combinações). 5 tentativas por janela de 5 min; ao estourar, derruba o cookie
// pendente — o atacante volta a precisar da SENHA.
const OTP_WINDOW_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const otpAttempts = new Map<string, number[]>();

function isOtpRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (otpAttempts.get(userId) ?? []).filter(
    (t) => t > now - OTP_WINDOW_MS,
  );
  if (recent.length >= OTP_MAX_ATTEMPTS) {
    otpAttempts.set(userId, recent);
    return true;
  }
  recent.push(now);
  otpAttempts.set(userId, recent);
  return false;
}

export async function verifyMfaLogin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");

  // Cookie pendente ausente/expirado/adulterado → recomeça do zero.
  const pending = await getMfaPending();
  if (!pending) {
    return {
      error: "A verificação expirou. Entre novamente com e-mail e senha.",
      step: "password",
    };
  }

  if (isOtpRateLimited(pending.sub)) {
    await clearMfaPendingCookie();
    return {
      error: "Muitas tentativas de código. Entre novamente com e-mail e senha.",
      step: "password",
    };
  }

  if (code.length !== 6) {
    return { error: "Informe o código de 6 dígitos do app.", step: "mfa" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: pending.sub },
      select: { mfaEnabled: true, totpSecret: true },
    });
    if (!user) {
      // Usuário excluído entre a senha e o OTP.
      await clearMfaPendingCookie();
      return { error: GENERIC_ERROR, step: "password" };
    }
    // MFA foi DESLIGADO entre a senha e o OTP (ex.: titular resetou): a senha foi
    // validada há <5 min — seguir para a sessão equivale ao login normal.
    if (user.mfaEnabled && user.totpSecret) {
      const valid = await verifyTotp(code, user.totpSecret);
      if (!valid) {
        return { error: "Código inválido. Confira o app e tente de novo.", step: "mfa" };
      }
    }
  } catch (error) {
    console.error("Falha ao verificar o código MFA.", error);
    return { error: "Falha ao verificar o código. Tente novamente.", step: "mfa" };
  }

  try {
    const token = await signSession({ sub: pending.sub, email: pending.email });
    await setSessionCookie(token);
    await clearMfaPendingCookie();
  } catch (error) {
    console.error("Falha ao assinar a sessão após o MFA.", error);
    return { error: GENERIC_ERROR, step: "password" };
  }

  // Fora do try/catch (NEXT_REDIRECT), como no login.
  redirect("/admin");
}
