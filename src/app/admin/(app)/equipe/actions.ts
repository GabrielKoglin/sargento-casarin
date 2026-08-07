"use server";

// ============================================================================
// equipe/actions.ts — gestão da EQUIPE do painel (usuários com login)
// ============================================================================
// RUNTIME: Node (Server Actions) — pode importar bcrypt (@/lib/password) e
// prisma. Toda action revalida a sessão por conta própria (o Proxy não cobre o
// POST das actions) E confere o PAPEL: só "owner" (titular) gerencia a equipe.
//
// REGRAS DE SEGURANÇA (anti-lockout):
//  - Só owner cria/exclui/edita membros.
//  - Ninguém exclui a si mesmo (evita se trancar para fora).
//  - Nunca dá para remover/rebaixar o ÚLTIMO owner (senão a gestão fica órfã).
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export type MemberFormState = { error: string | null; ok: boolean };

const ROLES = new Set(["owner", "editor"]);

// Verifica sessão + papel "owner". Retorna o id do usuário atual, ou um objeto
// de erro pronto para devolver ao formulário. Redireciona ao login se não houver
// sessão (o titular precisa estar autenticado).
async function requireOwner(): Promise<
  { ownerId: string } | { error: string }
> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  try {
    const me = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { role: true },
    });
    // Bootstrap: enquanto NÃO existir nenhum owner no sistema (ex.: logo após a
    // migração que adicionou o campo `role`), qualquer sessão válida pode gerir
    // a equipe — assim o titular consegue se promover sem cirurgia no banco.
    const owners = await prisma.user.count({ where: { role: "owner" } });
    if (me?.role !== "owner" && owners > 0) {
      return { error: "Apenas o titular da conta pode gerenciar a equipe." };
    }
    return { ownerId: session.sub };
  } catch {
    return { error: "Falha ao validar permissão. Tente novamente." };
  }
}

// Um titular NÃO gerencia OUTRO titular — senão um titular poderia tomar a conta
// de outro (resetar senha/2FA, rebaixar, excluir). Retorna true se o alvo é um
// titular DIFERENTE do que está agindo → a ação é RECUSADA. A própria conta e os
// editores seguem gerenciáveis. Fail-closed: erro de leitura também recusa.
async function isPeerOwner(id: string, selfId: string): Promise<boolean> {
  if (id === selfId) return false;
  try {
    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    return target?.role === "owner";
  } catch {
    return true;
  }
}

// ---------------------------------------------------------------- criar membro
export async function createMember(
  _prev: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const guard = await requireOwner();
  if ("error" in guard) return { error: guard.error, ok: false };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "editor").trim();
  const role = ROLES.has(roleRaw) ? roleRaw : "editor";

  if (!name || !email || !password) {
    return { error: "Preencha nome, e-mail e senha.", ok: false };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "E-mail inválido.", ok: false };
  }
  if (password.length < 8) {
    return { error: "A senha deve ter ao menos 8 caracteres.", ok: false };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Já existe um membro com esse e-mail.", ok: false };
    }
    const hashed = await hashPassword(password);
    await prisma.user.create({
      data: { name: name.slice(0, 120), email: email.slice(0, 160), password: hashed, role },
    });
  } catch (error) {
    console.error("Falha ao criar membro da equipe.", error);
    return { error: "Não foi possível criar o membro agora.", ok: false };
  }

  revalidatePath("/admin/equipe");
  return { error: null, ok: true };
}

// -------------------------------------------------------------- excluir membro
export async function deleteMember(formData: FormData): Promise<void> {
  const guard = await requireOwner();
  if ("error" in guard) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  // Não exclui a própria conta (lockout) nem a de OUTRO titular (só editores).
  if (id === guard.ownerId) return;
  if (await isPeerOwner(id, guard.ownerId)) return;

  try {
    await prisma.user.delete({ where: { id } });
  } catch (error) {
    console.error("Falha ao excluir membro da equipe.", error);
  }

  revalidatePath("/admin/equipe");
}

// ---------------------------------------------------------- redefinir a senha
export async function resetMemberPassword(formData: FormData): Promise<void> {
  const guard = await requireOwner();
  if ("error" in guard) return;

  const id = String(formData.get("id") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 8) return;
  // Não redefine a senha de OUTRO titular (só a própria e a de editores).
  if (await isPeerOwner(id, guard.ownerId)) return;

  try {
    const hashed = await hashPassword(password);
    await prisma.user.update({ where: { id }, data: { password: hashed } });
  } catch (error) {
    console.error("Falha ao redefinir senha do membro.", error);
  }

  revalidatePath("/admin/equipe");
}

// ----------------------------------------------------------- alterar o papel
export async function setMemberRole(formData: FormData): Promise<void> {
  const guard = await requireOwner();
  if ("error" in guard) return;

  const id = String(formData.get("id") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "").trim();
  if (!id || !ROLES.has(roleRaw)) return;
  // Não altera o papel de OUTRO titular (nem rebaixa/ataca um par).
  if (await isPeerOwner(id, guard.ownerId)) return;

  try {
    // Auto-rebaixamento só se NÃO for o último titular (não deixar sem dono).
    if (roleRaw !== "owner") {
      const target = await prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });
      if (target?.role === "owner") {
        const owners = await prisma.user.count({ where: { role: "owner" } });
        if (owners <= 1) return;
      }
    }
    await prisma.user.update({ where: { id }, data: { role: roleRaw } });
  } catch (error) {
    console.error("Falha ao alterar papel do membro.", error);
  }

  revalidatePath("/admin/equipe");
}

// ------------------------------------------------------- resetar MFA (2FA)
// Recuperação v1: membro perdeu o celular → o TITULAR zera o MFA dele, e o
// membro volta a entrar só com a senha (e reativa em /admin/seguranca). A
// PRÓPRIA conta fica de fora: exigir o código atual em /admin/seguranca é o que
// impede uma sessão sequestrada de remover o MFA sem ter o app.
export async function resetMemberMfa(formData: FormData): Promise<void> {
  const guard = await requireOwner();
  if ("error" in guard) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id || id === guard.ownerId) return;
  // Não reseta o 2FA de OUTRO titular (só de editores) — evita takeover.
  if (await isPeerOwner(id, guard.ownerId)) return;

  try {
    await prisma.user.update({
      where: { id },
      data: { mfaEnabled: false, totpSecret: null },
    });
  } catch (error) {
    console.error("Falha ao resetar o MFA do membro.", error);
  }

  revalidatePath("/admin/equipe");
}
