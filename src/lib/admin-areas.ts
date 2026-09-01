// ============================================================================
// admin-areas.ts — catálogo PURO das áreas de permissão do painel
// ============================================================================
// SEM imports de servidor (prisma/session) de propósito: assim tanto o servidor
// (@/lib/permissions) quanto os componentes "use client" (formulários da Equipe)
// importam as áreas e helpers sem arrastar o prisma para o bundle do navegador.

/**
 * Áreas de conteúdo que o titular pode conceder a um editor. A CHAVE é gravada
 * em `User.permissions`; o LABEL é o rótulo exibido. A ordem aqui é a ordem dos
 * checkboxes na tela Equipe.
 */
export const ADMIN_AREAS = [
  { key: "propostas", label: "Propostas" },
  { key: "noticias", label: "Notícias" },
  { key: "agenda", label: "Agenda" },
  { key: "conteudo", label: "Conteúdo" },
  { key: "mensagens", label: "Mensagens" },
  { key: "adesivos", label: "Adesivos" },
  { key: "apoiadores", label: "Apoiadores" },
] as const;

export type AreaKey = (typeof ADMIN_AREAS)[number]["key"];

/** Todas as chaves de área (útil para conceder "tudo"). */
export const ALL_AREA_KEYS: AreaKey[] = ADMIN_AREAS.map((a) => a.key);

const AREA_KEY_SET = new Set<string>(ALL_AREA_KEYS);

/** true se `value` é uma chave de área válida (filtra input de formulário). */
export function isAreaKey(value: string): value is AreaKey {
  return AREA_KEY_SET.has(value);
}

/** Rótulo legível de uma área (para mensagens/UI). */
export function areaLabel(key: string): string {
  return ADMIN_AREAS.find((a) => a.key === key)?.label ?? key;
}
