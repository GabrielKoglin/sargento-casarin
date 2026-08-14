// ============================================================================
// whatsapp.ts — monta links wa.me a partir de um número digitado à mão
// ============================================================================
// Aceita qualquer formatação ("(65) 99999-8888", "65 9 9999 8888", etc.) e
// devolve só os dígitos com o DDI do Brasil (55). Heurística por tamanho: 10
// (fixo+DDD) ou 11 (celular+DDD) dígitos = falta o 55; 12/13 já têm DDI.

/** Só os dígitos do número, garantindo o DDI 55 do Brasil quando faltar. */
export function waDigits(raw: string): string {
  let d = (raw || "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  return d;
}

/** Link wa.me com mensagem opcional já preenchida. */
export function waLink(raw: string, message?: string): string {
  const url = `https://wa.me/${waDigits(raw)}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}
