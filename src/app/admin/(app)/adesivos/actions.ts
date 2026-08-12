"use server";

// ============================================================================
// adesivos/actions.ts — ações da fila de pedidos de adesivo (StickerRequest)
// ============================================================================
// Espelha mensagens/actions.ts: a única mutação de conteúdo é excluir; o resto
// é marcar como entregue (baixa o badge de pendentes). Toda action revalida a
// sessão (o Proxy não cobre o POST das actions). redirect() lança NEXT_REDIRECT
// → fica fora do try.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/** Exclui um pedido de adesivo (id via campo oculto do formulário). */
export async function deleteStickerRequest(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  try {
    await prisma.stickerRequest.delete({ where: { id } });
  } catch (error) {
    console.error("Falha ao excluir pedido de adesivo.", error);
  }

  // "layout" também: o badge de pendentes vive na sidebar (layout do painel).
  revalidatePath("/admin/adesivos", "layout");
}

/** Marca UM pedido como entregue (some o selo "Novo" e desconta do badge). */
export async function markStickerDelivered(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  try {
    await prisma.stickerRequest.update({ where: { id }, data: { delivered: true } });
  } catch (error) {
    console.error("Falha ao marcar pedido como entregue.", error);
  }

  revalidatePath("/admin/adesivos", "layout");
}

/** Marca TODOS os pedidos pendentes como entregues (zera o badge). */
export async function markAllStickersDelivered(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  try {
    await prisma.stickerRequest.updateMany({
      where: { delivered: false },
      data: { delivered: true },
    });
  } catch (error) {
    console.error("Falha ao marcar todos os pedidos como entregues.", error);
  }

  revalidatePath("/admin/adesivos", "layout");
}
