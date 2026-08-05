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
