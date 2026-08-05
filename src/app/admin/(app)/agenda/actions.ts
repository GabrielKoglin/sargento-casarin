"use server";

// ============================================================================
// agenda/actions.ts — Server Actions do CRUD de Event (Agenda)
// ============================================================================
// RUNTIME: Node (Server Action). Cada action revalida a sessão por conta
// própria (getSession) — o Proxy não cobre o POST das actions. redirect() lança
// NEXT_REDIRECT e por isso fica SEMPRE fora de try/catch.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/** Estado do formulário (consumido por useActionState no client). */
export type EventFormState = { error: string | null };

// Campos crus vindos do FormData, já normalizados e validados.
type ParsedEvent = {
  title: string;
  date: Date;
  location: string;
  description: string;
};

/**
 * Lê e valida os campos do evento a partir do FormData. Retorna a tupla
 * [dados, null] em sucesso ou [null, mensagem] quando algum campo é inválido.
 */
function parseEventForm(
  formData: FormData,
): [ParsedEvent, null] | [null, string] {
  const title = String(formData.get("title") ?? "").trim();
  const rawDate = String(formData.get("date") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !rawDate || !location || !description) {
    return [null, "Preencha todos os campos."];
  }

  // O input datetime-local envia "YYYY-MM-DDTHH:mm" (horário de parede local).
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return [null, "Data inválida."];
  }

  return [{ title, date, location, description }, null];
}

// Invalida o cache da lista do painel E da página pública /agenda (que lê Event).
function revalidateAgenda() {
  revalidatePath("/admin/agenda");
  revalidatePath("/agenda");
}

/** Cria um novo evento. */
export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [data, error] = parseEventForm(formData);
  if (!data) return { error };

  try {
    await prisma.event.create({ data });
  } catch {
    console.error("Falha ao criar evento.");
    return { error: "Não foi possível salvar o evento. Tente novamente." };
  }

  revalidateAgenda();
  // redirect() lança NEXT_REDIRECT — precisa ficar FORA do try/catch.
  redirect("/admin/agenda");
}

/** Atualiza um evento existente (id via campo oculto do formulário). */
export async function updateEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Evento não identificado." };

  const [data, error] = parseEventForm(formData);
  if (!data) return { error };

  try {
    await prisma.event.update({ where: { id }, data });
  } catch {
    console.error("Falha ao atualizar evento.");
    return { error: "Não foi possível salvar as alterações. Tente novamente." };
  }

  revalidateAgenda();
  redirect("/admin/agenda");
}

/** Exclui um evento (id via campo oculto do formulário de exclusão). */
export async function deleteEvent(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  try {
    await prisma.event.delete({ where: { id } });
  } catch {
    console.error("Falha ao excluir evento.");
  }

  revalidateAgenda();
}
