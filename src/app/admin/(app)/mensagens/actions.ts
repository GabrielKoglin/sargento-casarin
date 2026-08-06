"use server";

// ============================================================================
// mensagens/actions.ts — ações da caixa de mensagens (Contact)
// ============================================================================
// Mensagens são SOMENTE LEITURA. A única mutação permitida é excluir (para
// limpar spam). Toda action revalida a sessão por conta própria (o Proxy não
// cobre o POST das actions). redirect() lança NEXT_REDIRECT → fica fora do try.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/** Exclui uma mensagem recebida (id via campo oculto do formulário). */
export async function deleteContact(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  try {
    await prisma.contact.delete({ where: { id } });
  } catch (error) {
    console.error("Falha ao excluir mensagem.", error);
  }

  // "layout" também: o badge de não lidas vive na sidebar (layout do painel).
  revalidatePath("/admin/mensagens", "layout");
}

/** Marca UMA mensagem como lida (some o selo "Nova" e desconta do badge). */
export async function markContactRead(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  try {
    await prisma.contact.update({ where: { id }, data: { read: true } });
  } catch (error) {
    console.error("Falha ao marcar mensagem como lida.", error);
  }

  revalidatePath("/admin/mensagens", "layout");
}

/** Marca TODAS as mensagens como lidas (zera o badge de notificação). */
export async function markAllContactsRead(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  try {
    await prisma.contact.updateMany({
      where: { read: false },
      data: { read: true },
    });
  } catch (error) {
    console.error("Falha ao marcar todas as mensagens como lidas.", error);
  }

  revalidatePath("/admin/mensagens", "layout");
}
