// ============================================================================
// mfa.ts — TOTP (app autenticador) via otplib v13
// ============================================================================
// RUNTIME: Node (Server Actions). NÃO importar de src/proxy.ts.
// ⚠️ otplib v13: API FUNCIONAL (generateSecret/generateURI/verify). A API v12
// (authenticator.generateSecret/keyuri/verify) NÃO existe mais. `epochTolerance`
// é em SEGUNDOS (não "janela de steps"). `verify` é assíncrona e retorna união
// discriminada { valid:true, ... } | { valid:false }.
import { generateSecret, generateURI, verify } from "otplib";

/** Nome que aparece no app autenticador (Google Authenticator/Authy). */
export const MFA_ISSUER = "Sgt Casarin";

/** Gera um secret TOTP novo (Base32). */
export function createTotpSecret(): string {
  return generateSecret();
}

/** Monta a URI otpauth:// para virar QR code (label = e-mail do usuário). */
export function totpKeyUri(email: string, secret: string): string {
  return generateURI({ issuer: MFA_ISSUER, label: email, secret });
}

/**
 * Verifica um código de 6 dígitos contra o secret. Tolerância de ±30s (1
 * período) para relógio de celular levemente fora. Nunca lança.
 */
export async function verifyTotp(code: string, secret: string): Promise<boolean> {
  const token = code.replace(/\D/g, "");
  if (token.length !== 6) return false;
  try {
    const result = await verify({ secret, token, epochTolerance: 30 });
    return result.valid;
  } catch {
    return false;
  }
}
