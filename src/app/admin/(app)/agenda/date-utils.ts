// ============================================================================
// agenda/date-utils.ts — helpers de data compartilhados pela Agenda.
// ============================================================================
// FUSO FIXO America/Cuiaba (Mato Grosso). O admin edita a data-hora como horário
// de Cuiabá e a página pública (src/app/agenda/page.tsx) também EXIBE em Cuiabá,
// então "o que o admin digita é o que o público vê" — independentemente do fuso
// do SERVIDOR (num servidor em UTC, o horário local ficaria 4h deslocado).
//
// Guardamos sempre o INSTANTE correto (UTC) no banco; a conversão de/para o
// relógio de parede de Cuiabá acontece só nas bordas (parse do input e formatação
// para exibição/preenchimento). MT não observa horário de verão hoje (offset fixo
// UTC-4), mas o offset é obtido via Intl para não depender de um valor fixo.

const TIME_ZONE = "America/Cuiaba";

const pad = (n: number) => String(n).padStart(2, "0");

// Formatação da lista já no fuso de Cuiabá (igual à página pública).
const listFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

// Extrai os componentes de um instante JÁ projetados no fuso de Cuiabá.
const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

interface WallTime {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
}

// Componentes de "relógio de parede" de um Date visto em America/Cuiaba.
function zonedParts(date: Date): WallTime {
  const map: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  // Alguns motores emitem "24" para a meia-noite; normalizamos para 0.
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

// Offset (ms) de Cuiabá NO INSTANTE dado: (horário local) - (UTC).
function zoneOffsetMs(utcMs: number): number {
  const p = zonedParts(new Date(utcMs));
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asIfUtc - utcMs;
}

// Converte um relógio de parede de Cuiabá no instante UTC correspondente.
function cuiabaWallTimeToUtcMs(w: WallTime): number {
  const asIfUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  // 1ª aproximação: desconta o offset no instante-palpite; refina uma vez para
  // eventuais bordas de DST (inócuo em Cuiabá, correto em geral).
  const offset = zoneOffsetMs(asIfUtc);
  let utc = asIfUtc - offset;
  const offset2 = zoneOffsetMs(utc);
  if (offset2 !== offset) utc = asIfUtc - offset2;
  return utc;
}

/** Formata uma data para exibição na lista, em Cuiabá (ex.: "05/08/2026 14:30"). */
export function formatEventDate(date: Date): string {
  return listFormatter.format(date);
}

/**
 * Converte um Date no valor esperado por <input type="datetime-local">
 * ("YYYY-MM-DDTHH:mm"), usando o relógio de parede de America/Cuiaba — assim o
 * form de edição reabre com o mesmo horário que o admin gravou e o público vê.
 */
export function toDatetimeLocalValue(date: Date): string {
  const p = zonedParts(date);
  return (
    `${p.year}-${pad(p.month)}-${pad(p.day)}` + `T${pad(p.hour)}:${pad(p.minute)}`
  );
}

/**
 * Interpreta o valor de <input type="datetime-local"> ("YYYY-MM-DDTHH:mm", com
 * segundos opcionais) como horário de America/Cuiaba e devolve o Date (instante
 * UTC) — ou `null` se a data for inválida.
 *
 * VALIDAÇÃO POR COMPONENTES (não `new Date(string)`): o construtor por string
 * aceita datas impossíveis e as ROLA em silêncio (30/02 vira 02/03). Aqui
 * conferimos o round-trip via Date.UTC — se qualquer componente divergir (30/02,
 * 31/04, hora 25…), a data é rejeitada em vez de corrompida. Só depois de válida
 * convertemos o relógio de parede de Cuiabá no instante UTC correto.
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

  // Rejeita componentes impossíveis conferindo o round-trip em UTC.
  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const consistent =
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day &&
    probe.getUTCHours() === hour &&
    probe.getUTCMinutes() === minute &&
    probe.getUTCSeconds() === second;
  if (!consistent) return null;

  return new Date(
    cuiabaWallTimeToUtcMs({ year, month, day, hour, minute, second }),
  );
}
