"use server";

// ============================================================================
// config/actions.ts — Server Actions das configurações (Settings, key-value)
// ============================================================================
// Toda action revalida a sessão por conta própria (o Proxy não cobre o POST
// das actions). redirect() lança NEXT_REDIRECT → sempre FORA do try/catch.
//
// FEEDBACK VISÍVEL: os formulários da config/page.tsx são <form action={...}>
// simples (Server Component, sem useActionState). Para não "fingir sucesso"
// quando o banco falha, cada action redireciona ao final com um código na query
// string (?error=…) que a página lê e exibe como aviso. No sucesso redirecionamos
// à URL limpa (/admin/config) para que um aviso antigo nunca fique preso.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Lê um campo do FormData SÓ como string (espelha propostas/actions.ts). Um
// <input type=file> forjado chega como File — `String(file)` viraria a string
// "[object File]" e persistiria lixo (inclusive uma `key` corrompida). Qualquer
// coisa que não seja string vira "".
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value !== "string" ? "" : value.trim();
}

/**
 * Cria ou atualiza um parâmetro pela chave (upsert). Usado tanto pelo
 * formulário "adicionar" quanto pela edição inline de cada linha da lista.
 */
export async function upsertSetting(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // `key` é obrigatória: se não vier como string (File forjado) ou vier vazia,
  // devolvemos erro visível em vez de gravar uma chave lixo ("[object File]").
  const key = field(formData, "key");
  if (!key) redirect("/admin/config?error=chave");

  // O valor pode ser propositalmente vazio; só a chave é obrigatória. Ainda
  // assim aplicamos a guarda de tipo (nunca persistir "[object File]"); NÃO
  // fazemos trim para preservar exatamente o que o admin digitou.
  const rawValue = formData.get("value");
  const value = typeof rawValue === "string" ? rawValue : "";

  let ok = true;
  try {
    await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  } catch (error) {
    console.error("Falha ao salvar configuração.", error);
    ok = false;
  }

  revalidatePath("/admin/config");
  // redirect() lança NEXT_REDIRECT — precisa ficar FORA do try/catch.
  redirect(ok ? "/admin/config" : "/admin/config?error=salvar");
}

/** Exclui um parâmetro (id via campo oculto do formulário). */
export async function deleteSetting(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const id = field(formData, "id");
  if (!id) redirect("/admin/config?error=excluir");

  let ok = true;
  try {
    await prisma.settings.delete({ where: { id } });
  } catch (error) {
    console.error("Falha ao excluir configuração.", error);
    ok = false;
  }

  revalidatePath("/admin/config");
  redirect(ok ? "/admin/config" : "/admin/config?error=excluir");
}
