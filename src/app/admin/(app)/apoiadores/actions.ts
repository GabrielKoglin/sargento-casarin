"use server";

// ============================================================================
// admin/(app)/apoiadores/actions.ts — CRUD dos líderes apoiadores
// ============================================================================
// Espelha adesivos/actions.ts. Toda action revalida a sessão (o Proxy não cobre
// o POST das actions) e revalida "/admin/apoiadores" no escopo layout (o badge
// de pendentes vive na sidebar) + "/adesivos" (mapa público). redirect() lança
// NEXT_REDIRECT → sempre fora do try.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cityCodeFromName } from "@/data/mt-cities";

function revalidate(): void {
  revalidatePath("/admin/apoiadores", "layout");
  revalidatePath("/adesivos");
}

/** Adiciona um líder pelo painel — já entra ATIVO (visível no mapa). */
export async function createLeader(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const name = String(formData.get("name") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (!name || !whatsapp || !city) return;

  try {
    await prisma.leader.create({
      data: {
        name: name.slice(0, 120),
        whatsapp: whatsapp.slice(0, 40),
        city: city.slice(0, 120),
        cityCode: cityCodeFromName(city),
        status: "active",
      },
    });
  } catch (error) {
    console.error("Falha ao adicionar líder.", error);
  }

  revalidate();
}

/** Aprova um cadastro pendente (feito pelo próprio apoiador) → ATIVO. */
export async function approveLeader(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  try {
    // Se o cadastro veio sem código IBGE, tenta resolver pelo nome agora.
    const current = await prisma.leader.findUnique({
      where: { id },
      select: { city: true, cityCode: true },
    });
    const cityCode = current?.cityCode ?? cityCodeFromName(current?.city ?? "");
    await prisma.leader.update({
      where: { id },
      data: { status: "active", cityCode },
    });
  } catch (error) {
    console.error("Falha ao aprovar líder.", error);
  }

  revalidate();
}

/** Exclui um líder (pendente ou ativo). */
export async function deleteLeader(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  try {
    await prisma.leader.delete({ where: { id } });
  } catch (error) {
    console.error("Falha ao excluir líder.", error);
  }

  revalidate();
}
