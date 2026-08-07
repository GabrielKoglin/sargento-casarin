"use server";

// ============================================================================
// seguranca/actions.ts — ativar/desativar MFA (2FA) da PRÓPRIA conta
// ============================================================================
// RUNTIME: Node. Toda action revalida a sessão (o Proxy não cobre o POST). O
// secret só é EXIBIDO durante a ativação (antes de mfaEnabled=true); depois
// nenhuma action devolve o secret — os selects de leitura não o incluem.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createTotpSecret, totpKeyUri, verifyTotp } from "@/lib/mfa";

export type MfaBeginState = {
  error: string | null;
  qr: string | null; // data-URL do QR
  secret: string | null; // Base32 em texto (fallback de digitação manual)
};
export type MfaConfirmState = { error: string | null; ok: boolean };
export type MfaDisableState = { error: string | null; ok: boolean };

async function requireUser(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session.sub;
}

// Rate-limit leve do "desativar por código": uma sessão sequestrada não pode
// brute-forçar o OTP para remover o MFA. 5 tentativas / 5 min por usuário.
const DISABLE_WINDOW_MS = 5 * 60 * 1000;
const DISABLE_MAX_ATTEMPTS = 5;
const disableAttempts = new Map<string, number[]>();
function isDisableRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (disableAttempts.get(userId) ?? []).filter(
    (t) => t > now - DISABLE_WINDOW_MS,
  );
  if (recent.length >= DISABLE_MAX_ATTEMPTS) {
    disableAttempts.set(userId, recent);
    return true;
  }
  recent.push(now);
  disableAttempts.set(userId, recent);
  return false;
}

// ------------------------------------------------------------- iniciar setup
export async function beginMfaSetup(
  _prev: MfaBeginState,
  _formData: FormData,
): Promise<MfaBeginState> {
  const userId = await requireUser();
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mfaEnabled: true },
    });
    if (!user) redirect("/admin/login");
    if (user.mfaEnabled) {
      return {
        error: "O MFA já está ativo. Desative antes de gerar um novo QR.",
        qr: null,
        secret: null,
      };
    }
    // Grava o secret JÁ, mas com mfaEnabled=false: um setup abandonado nunca
    // bloqueia o login (o passo de OTP só dispara com mfaEnabled=true). Clicar
    // "Ativar" de novo simplesmente sobrescreve com um secret novo.
    const secret = createTotpSecret();
    await prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret, mfaEnabled: false },
    });
    const qr = await QRCode.toDataURL(totpKeyUri(user.email, secret), {
      width: 240,
      margin: 1,
    });
    return { error: null, qr, secret };
  } catch (error) {
    console.error("Falha ao iniciar a ativação do MFA.", error);
    return {
      error: "Não foi possível gerar o QR agora. Tente novamente.",
      qr: null,
      secret: null,
    };
  }
}

// ----------------------------------------------------------- confirmar setup
export async function confirmMfaSetup(
  _prev: MfaConfirmState,
  formData: FormData,
): Promise<MfaConfirmState> {
  const userId = await requireUser();
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) {
    return { error: "Digite o código de 6 dígitos que aparece no app.", ok: false };
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, mfaEnabled: true },
    });
    if (!user?.totpSecret) {
      return { error: "Gere o QR code primeiro (botão Ativar).", ok: false };
    }
    if (user.mfaEnabled) return { error: null, ok: true }; // já confirmado
    const valid = await verifyTotp(code, user.totpSecret);
    if (!valid) {
      return { error: "Código inválido. Escaneie o QR e tente de novo.", ok: false };
    }
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });
  } catch (error) {
    console.error("Falha ao confirmar o MFA.", error);
    return { error: "Não foi possível ativar agora. Tente novamente.", ok: false };
  }
  revalidatePath("/admin/seguranca");
  return { error: null, ok: true };
}

// ------------------------------------------------------------------ desativar
export async function disableMfa(
  _prev: MfaDisableState,
  formData: FormData,
): Promise<MfaDisableState> {
  const userId = await requireUser();
  if (isDisableRateLimited(userId)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos.", ok: false };
  }
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) {
    return { error: "Digite o código atual do app para desativar.", ok: false };
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, mfaEnabled: true },
    });
    if (!user?.mfaEnabled || !user.totpSecret) return { error: null, ok: true };
    const valid = await verifyTotp(code, user.totpSecret);
    if (!valid) return { error: "Código inválido.", ok: false };
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, totpSecret: null },
    });
  } catch (error) {
    console.error("Falha ao desativar o MFA.", error);
    return { error: "Não foi possível desativar agora. Tente novamente.", ok: false };
  }
  revalidatePath("/admin/seguranca");
  return { error: null, ok: true };
}
