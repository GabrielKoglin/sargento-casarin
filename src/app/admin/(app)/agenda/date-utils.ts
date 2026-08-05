// ============================================================================
// agenda/date-utils.ts — helpers de data compartilhados pela Agenda.
// ============================================================================
// Usamos o fuso LOCAL do servidor de forma consistente (sem timeZone fixo):
// o input datetime-local é interpretado nesse fuso ao salvar, então exibir e
// pré-preencher no mesmo fuso garante que o admin veja exatamente o que digitou
// (round-trip consistente digitar → salvar → listar → editar).

const listFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Formata uma data para exibição na lista (ex.: "05/08/2026 14:30"). */
export function formatEventDate(date: Date): string {
  return listFormatter.format(date);
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Converte um Date no valor esperado por <input type="datetime-local">:
 * "YYYY-MM-DDTHH:mm", usando os componentes locais do servidor.
 */
export function toDatetimeLocalValue(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * Interpreta o valor de <input type="datetime-local"> ("YYYY-MM-DDTHH:mm", com
 * segundos opcionais) como horário LOCAL do servidor e devolve o Date — ou
 * `null` se a data for inválida.
 *
 * POR QUE POR COMPONENTES, E NÃO `new Date(string)`: o construtor por string
 * aceita datas impossíveis e as ROLA em silêncio — `new Date("2026-02-30T10:00")`
 * vira 02/03. Aqui montamos com `new Date(ano, mês-1, dia, h, min)` e depois
 * CONFERIMOS que cada componente do Date resultante bate com o informado; se
 * qualquer um divergir (30/02, 31/04, hora 25…), a data é rejeitada — nunca
 * corrompida.
 *
 * POLÍTICA DE FUSO (pragmática): datetime-local não carrega fuso. O app assume o
 * horário LOCAL DO SERVIDOR tanto ao gravar (aqui) quanto ao exibir/pré-preencher
 * (toDatetimeLocalValue usa os mesmos getters locais), garantindo round-trip
 * consistente para o admin: o que ele digita é o que reaparece no form de edição.
 * TODO(produção): fixar o fuso America/Cuiaba — num servidor em UTC a hora
 * EXIBIDA fica deslocada da hora de Cuiabá. Não migra dados; só normaliza a
 * política quando houver deploy definido.
 */
export function parseDatetimeLocal(raw: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    raw.trim(),
  );
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] ? Number(match[6]) : 0;

  const date = new Date(year, month - 1, day, hour, minute, second, 0);
  if (Number.isNaN(date.getTime())) return null;

  const consistent =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute &&
    date.getSeconds() === second;

  return consistent ? date : null;
}
