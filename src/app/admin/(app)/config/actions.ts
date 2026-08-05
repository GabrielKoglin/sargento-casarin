"use server";

// ============================================================================
// config/actions.ts — Server Actions das configurações (Settings, key-value)
// ============================================================================
// Toda action revalida a sessão por conta própria (o Proxy não cobre o POST
// das actions). redirect() lança NEXT_REDIRECT → sempre FORA do try/catch.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Cria ou atualiza um parâmetro pela chave (upsert). Usado tanto pelo
 * formulário "adicionar" quanto pela edição inline de cada linha da lista.
 */
export async function upsertSetting(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const key = String(formData.get("key") ?? "").trim();
  // O valor pode ser propositalmente vazio; só a chave é obrigatória.
  const value = String(formData.get("value") ?? "");
  if (!key) return;

  try {
    await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  } catch {
    console.error("Falha ao salvar configuração.");
  }

  revalidatePath("/admin/config");
}

/** Exclui um parâmetro (id via campo oculto do formulário). */
export async function deleteSetting(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  try {
    await prisma.settings.delete({ where: { id } });
  } catch {
    console.error("Falha ao excluir configuração.");
  }

  revalidatePath("/admin/config");
}
