"use server";

// ============================================================================
// conteudo/actions.ts — salva o conteúdo editável do site (registro único)
// ============================================================================
// RUNTIME: Node (Server Action). Revalida a sessão por conta própria (editor ou
// titular podem editar conteúdo). O formulário (client) envia TODO o documento
// como JSON no campo "payload"; aqui validamos que é um objeto e gravamos no
// SiteContent(id="main"). A leitura (getSiteContent) faz a coerção defensiva.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export type ContentFormState = { ok: boolean; error: string | null };

export async function saveSiteContent(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const payload = String(formData.get("payload") ?? "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return {
      ok: false,
      error: "Dados inválidos. Recarregue a página e tente novamente.",
    };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Dados inválidos." };
  }

  const data = parsed as Prisma.InputJsonValue;
  try {
    await prisma.siteContent.upsert({
      where: { id: "main" },
      update: { data },
      create: { id: "main", data },
    });
  } catch (error) {
    console.error("Falha ao salvar o conteúdo do site.", error);
    return { ok: false, error: "Não foi possível salvar agora. Tente novamente." };
  }

  // As páginas leem getSiteContent() em cache — invalida home + sobre + esta aba.
  revalidatePath("/");
  revalidatePath("/sobre");
  revalidatePath("/admin/conteudo");
  return { ok: true, error: null };
}
