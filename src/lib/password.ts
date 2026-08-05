// ============================================================================
// password.ts — hashing/verificação de senha (bcrypt)
// ============================================================================
// RUNTIME: Node.js APENAS. bcryptjs NÃO roda em edge.
//
// ⚠️  NUNCA importe este módulo a partir de `src/proxy.ts` (Proxy/ex-middleware)
//     nem de qualquer código que precise ser edge-safe. Para ler/verificar a
//     sessão em contexto de request, use `src/lib/session.ts` (jose), que não
//     puxa bcrypt. Este arquivo deve ser importado só por Server Actions e por
//     scripts Node (ex.: scripts/create-admin.ts).
import bcrypt from "bcryptjs";

// Custo do bcrypt. 12 é um bom equilíbrio entre segurança e latência de login.
const SALT_ROUNDS = 12;

/** Gera o hash bcrypt de uma senha em texto puro. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Compara uma senha em texto puro com um hash bcrypt (comparação constante). */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
