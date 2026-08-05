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
import { parseDatetimeLocal } from "./date-utils";

/** Estado do formulário (consumido por useActionState no client). */
export type EventFormState = { error: string | null };

// Lê um campo do FormData SÓ como string (espelha propostas/actions.ts). Um
// <input type=file> forjado chega como File — `String(file)` viraria a string
// "[object File]" e persistiria lixo. Aqui, qualquer coisa que não seja string
// vira "" (tratada como campo vazio pela validação de obrigatórios).
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value !== "string" ? "" : value.trim();
}

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
  const title = field(formData, "title");
  const rawDate = field(formData, "date");
  const location = field(formData, "location");
  const description = field(formData, "description");

  if (!title || !rawDate || !location || !description) {
    return [null, "Preencha todos os campos."];
  }

  // datetime-local envia "YYYY-MM-DDTHH:mm" (horário local). parseDatetimeLocal
  // rejeita datas impossíveis (ex.: 30/02) em vez de deixá-las ROLAR para outro
  // dia — ver o porquê em date-utils.ts. Vale tanto no create quanto no edit.
  const date = parseDatetimeLocal(rawDate);
  if (!date) {
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

  const id = field(formData, "id");
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

  const id = field(formData, "id");
  if (!id) return;

  try {
    await prisma.event.delete({ where: { id } });
  } catch {
    console.error("Falha ao excluir evento.");
  }

  revalidateAgenda();
}
