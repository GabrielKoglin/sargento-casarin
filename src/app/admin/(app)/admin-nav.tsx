// Tipo compartilhado dos itens de navegação do painel. A navegação em si (com o
// link ativo, drawer no mobile e sidebar no desktop) vive em ./admin-sidebar.
export type AdminNavItem = {
  href: string;
  label: string;
  icon?: string;
  /** Contador de notificação (ex.: mensagens não lidas). Só exibe se > 0. */
  badge?: number;
};
