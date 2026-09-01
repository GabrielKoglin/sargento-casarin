// ============================================================================
// permissions.ts — permissões POR ÁREA do painel admin
// ============================================================================
// RUNTIME: Node APENAS (importa prisma + @/lib/session). NÃO importar no Proxy
// (src/proxy.ts é edge-safe). Usado em Server Components (páginas) e Server
// Actions para barrar acesso por seção.
//
// MODELO:
//  - "owner" (titular): acesso a TUDO — ignora a lista `permissions`.
//  - "editor": acessa SÓ as áreas listadas em `user.permissions`.
//  - Dashboard e Segurança (2FA pessoal): qualquer sessão válida.
//  - Equipe e Config: só "owner".
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { type AreaKey } from "./admin-areas";

// Reexporta o catálogo PURO de áreas (definido em ./admin-areas, sem imports de
// servidor) para quem já importa daqui. Componentes "use client" devem importar
// direto de "@/lib/admin-areas" para não puxar prisma ao bundle do navegador.
export { ADMIN_AREAS, ALL_AREA_KEYS, areaLabel, isAreaKey } from "./admin-areas";
export type { AreaKey } from "./admin-areas";

/** Usuário do painel resolvido do banco (a sessão só guarda id+e-mail). */
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
};

/**
 * Resolve o usuário logado (sessão → banco). Retorna null se não houver sessão
 * válida ou se o usuário não existir mais (cookie órfão) — o chamador decide o
 * que fazer. Falha de I/O também vira null (fail-closed).
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const session = await getSession();
  if (!session) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, name: true, email: true, role: true, permissions: true },
    });
    return user ?? null;
  } catch {
    return null;
  }
}

/** Titular acessa tudo; editor só as áreas concedidas. */
export function canAccessArea(user: AdminUser, area: AreaKey): boolean {
  if (user.role === "owner") return true;
  return user.permissions.includes(area);
}

/**
 * Guarda de PÁGINA/ACTION por área. Sem sessão → login. Sem permissão →
 * volta ao dashboard com um aviso (?denied=<area>). Retorna o usuário quando
 * autorizado. redirect() lança NEXT_REDIRECT (fica fora de try/catch).
 */
export async function requireArea(area: AreaKey): Promise<AdminUser> {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login");
  if (!canAccessArea(user, area)) redirect(`/admin?denied=${area}`);
  return user;
}

/** Guarda que exige só uma sessão válida (Dashboard, Segurança). */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login");
  return user;
}

/**
 * Guarda de área EXCLUSIVA do titular (Equipe, Config). Bootstrap: enquanto não
 * existir NENHUM owner (ex.: logo após a migração), qualquer sessão passa — assim
 * o titular consegue se promover sem cirurgia no banco.
 */
export async function requireOwner(): Promise<AdminUser> {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login");
  if (user.role !== "owner") {
    let owners = 0;
    try {
      owners = await prisma.user.count({ where: { role: "owner" } });
    } catch {
      owners = 1; // fail-closed: na dúvida, trata como se houvesse titular
    }
    if (owners > 0) redirect("/admin?denied=owner");
  }
  return user;
}
