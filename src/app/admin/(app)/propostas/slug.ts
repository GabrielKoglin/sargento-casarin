// ============================================================================
// slug.ts — utilitário puro de slugify
// ============================================================================
// Módulo SEM "use server"/"use client": é importado tanto pelas Server Actions
// (actions.ts) quanto pelo formulário client (proposal-form.tsx). Por isso não
// pode ter nenhum import server-only. Mantê-lo puro é o que permite gerar o
// slug no cliente (preview ao digitar) E normalizá-lo de novo no servidor.

/**
 * Converte um texto em slug: minúsculas, sem acentos, apenas [a-z0-9-],
 * espaços/símbolos viram hífen e hífens das pontas são removidos.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove os diacríticos (acentos)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // qualquer não-alfanumérico -> hífen
    .replace(/^-+|-+$/g, ""); // tira hífens do começo/fim
}
