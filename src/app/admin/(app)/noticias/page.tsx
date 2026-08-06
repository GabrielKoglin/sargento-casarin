// ============================================================================
// noticias/page.tsx — FILA DE MODERAÇÃO de notícias (/admin/noticias)
// ============================================================================
// Herda o shell + guarda de sessão de (app)/layout.tsx. Além do CRUD manual,
// esta lista é a fila de moderação das notícias INGERIDAS dos feeds: cada item
// nasce "pending" e o admin aprova (vai ao ar em /noticias) ou rejeita.
//
// searchParams (Next 16, assíncrono):
//   ?status = pending | approved | rejected | all   (default: pending)
//   ?page   = 1..N                                   (default: 1)
// Nunca renderizamos milhares de linhas: só as 40 da página atual.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { approveNews, rejectNews, deleteNews, ingestNow } from "./actions";
import { DeleteButton } from "./news-form";
import { BulkBar, SelectAllCheckbox } from "./bulk-bar";
import { IngestButton } from "./ingest-button";

// Lista sempre "ao vivo" — nunca pré-renderizar em build.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

const STATUS_FILTERS = ["pending", "approved", "rejected", "all"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

function normalizeStatus(raw: string | undefined): StatusFilter {
  return (STATUS_FILTERS as readonly string[]).includes(raw ?? "")
    ? (raw as StatusFilter)
    : "pending";
}

function normalizePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// Aviso do disparo manual de ingestão (ingestNow redireciona com
// ?ingest=ok&n=<inseridas> | ?ingest=fail). null = sem aviso.
type IngestNotice = { tone: "ok" | "fail"; message: string };

function ingestNotice(
  ingest: string | undefined,
  n: string | undefined,
): IngestNotice | null {
  if (ingest === "fail") {
    return {
      tone: "fail",
      message:
        "Falha ao buscar notícias — nada foi ingerido. Verifique os logs do servidor.",
    };
  }
  if (ingest === "ok") {
    const inserted = Math.max(0, Number.parseInt(n ?? "0", 10) || 0);
    return {
      tone: "ok",
      message:
        inserted === 0
          ? "Busca concluída: nenhuma manchete nova (tudo já estava na fila)."
          : `Busca concluída: ${inserted} ${inserted === 1 ? "notícia nova" : "notícias novas"} na fila.`,
    };
  }
  return null;
}

// ---------------------------------------------------------------- badges -----
type StatusStyle = { label: string; color: string; bg: string; border: string };

const STATUS_STYLES: Record<string, StatusStyle> = {
  pending: {
    label: "Pendente",
    color: "#f5c518",
    bg: "rgba(245,197,24,0.12)",
    border: "rgba(245,197,24,0.4)",
  },
  approved: {
    label: "Aprovada",
    color: "var(--a-green-bright)",
    bg: "rgba(0,184,75,0.12)",
    border: "rgba(0,184,75,0.4)",
  },
  rejected: {
    label: "Rejeitada",
    color: "#ff9a9a",
    bg: "rgba(255,90,90,0.1)",
    border: "rgba(255,90,90,0.4)",
  },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? {
    label: status,
    color: "var(--a-muted)",
    bg: "transparent",
    border: "var(--a-line)",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.15rem 0.55rem",
        borderRadius: "999px",
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

const emptyMessages: Record<StatusFilter, string> = {
  pending:
    "Nenhuma notícia pendente. Use “Buscar notícias agora” para ingerir novas manchetes dos portais. Itens já revisados e descartados ficam na aba Rejeitadas.",
  approved: "Nenhuma notícia aprovada ainda.",
  rejected: "Nenhuma notícia rejeitada.",
  all: "Nenhuma notícia cadastrada ainda.",
};

export default async function AdminNoticiasPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    page?: string;
    ingest?: string;
    n?: string;
  }>;
}) {
  const sp = await searchParams;
  const status = normalizeStatus(sp.status);
  let page = normalizePage(sp.page);
  const notice = ingestNotice(sp.ingest, sp.n);

  const where = status === "all" ? {} : { status };

  // Contadores por status (para as abas) em paralelo. A página em si só é
  // buscada DEPOIS de conhecer o total — para poder CLAMPAR `page` ao intervalo
  // válido antes de calcular `skip`. Sem isso, ?page=<número gigante> gera um
  // `skip` que estoura o int64 do SQLite e derruba a rota com 500.
  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.news.count({ where: { status: "pending" } }),
    prisma.news.count({ where: { status: "approved" } }),
    prisma.news.count({ where: { status: "rejected" } }),
  ]);

  const totalAll = pendingCount + approvedCount + rejectedCount;
  const total =
    status === "all"
      ? totalAll
      : status === "pending"
        ? pendingCount
        : status === "approved"
          ? approvedCount
          : rejectedCount;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // CLAMP: prende `page` em [1, totalPages]. page=0/-1/abc já viraram 1 no
  // normalizePage; aqui fechamos o buraco do page ACIMA do máximo (ou gigante),
  // garantindo que `skip` nunca fique absurdamente grande.
  page = Math.min(Math.max(1, page), Math.max(1, totalPages));

  const noticias = await prisma.news.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "pending", label: "Pendentes", count: pendingCount },
    { key: "approved", label: "Aprovadas", count: approvedCount },
    { key: "rejected", label: "Rejeitadas", count: rejectedCount },
    { key: "all", label: "Todas", count: totalAll },
  ];

  return (
    <>
      <header className="admin-page-header admin-page-header--row">
        <div>
          <span className="admin-page-header__eyebrow">Conteúdo</span>
          <h1 className="admin-page-header__title">Notícias</h1>
          <p className="admin-page-header__subtitle">
            Fila de moderação: aprove as manchetes ingeridas dos portais antes de
            irem ao ar.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <form action={ingestNow}>
            <IngestButton />
          </form>
          <Link href="/admin/noticias/new" className="admin-btn admin-btn--ghost">
            Nova notícia
          </Link>
        </div>
      </header>

      {notice && (
        <div role="status" className={"admin-notice admin-notice--" + notice.tone}>
          {notice.message}
        </div>
      )}

      <p className="admin-help">
        A busca consulta ~25 portais de Mato Grosso e pode levar alguns segundos.
        As manchetes novas entram como <strong>Pendentes</strong> para revisão.
      </p>

      {/* ------------------------------------------------------------ abas */}
      <nav aria-label="Filtrar por status" className="admin-tabs">
        {tabs.map((tab) => {
          const active = tab.key === status;
          return (
            <Link
              key={tab.key}
              href={`/admin/noticias?status=${tab.key}`}
              aria-current={active ? "page" : undefined}
              className="admin-tab"
            >
              {tab.label}
              <span className="admin-tab__count">{tab.count}</span>
            </Link>
          );
        })}
      </nav>

      {total === 0 ? (
        <div className="admin-note">{emptyMessages[status]}</div>
      ) : noticias.length === 0 ? (
        <div className="admin-note">
          Nenhum item nesta página.{" "}
          <Link
            href={`/admin/noticias?status=${status}`}
            style={{ color: "var(--a-green-bright)", fontWeight: 600 }}
          >
            Voltar à primeira página
          </Link>
          .
        </div>
      ) : (
        <>
          <BulkBar
            pendingCount={pendingCount}
            rejectedCount={rejectedCount}
            status={status}
          />
          <div
            className="overflow-x-auto rounded"
            style={{ border: "1px solid var(--a-line)", background: "var(--a-panel)" }}
          >
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--a-line)" }}>
                  <th className="admin-cell--check">
                    <SelectAllCheckbox />
                  </th>
                  {["Título", "Fonte", "Publicação", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--a-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                  <th
                    className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--a-muted)" }}
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {noticias.map((noticia) => (
                  <tr key={noticia.id}>
                    <td className="admin-cell--check">
                      <input
                        type="checkbox"
                        name="ids"
                        value={noticia.id}
                        form="bulk-form"
                        aria-label={`Selecionar: ${noticia.title}`}
                        style={{
                          width: "1rem",
                          height: "1rem",
                          accentColor: "var(--a-green)",
                          cursor: "pointer",
                        }}
                      />
                    </td>
                    <td
                      className="px-4 py-3 font-medium"
                      style={{ color: "var(--a-text)", maxWidth: "28rem" }}
                    >
                      {noticia.url ? (
                        <a
                          href={noticia.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--a-text)" }}
                          className="underline-offset-2 hover:underline"
                        >
                          {noticia.title}
                        </a>
                      ) : (
                        noticia.title
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--a-muted)" }}>
                      {noticia.source}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3"
                      style={{ color: "var(--a-muted)" }}
                    >
                      {dateFormat.format(noticia.publishedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={noticia.status} />
                    </td>
                    <td className="admin-cell--actions">
                      <div className="admin-actions">
                        {noticia.status !== "approved" && (
                          <form action={approveNews}>
                            <input type="hidden" name="id" value={noticia.id} />
                            <button
                              type="submit"
                              className="admin-btn admin-btn--ok admin-btn--sm"
                            >
                              Aprovar
                            </button>
                          </form>
                        )}
                        {noticia.status !== "rejected" && (
                          <form action={rejectNews}>
                            <input type="hidden" name="id" value={noticia.id} />
                            <button
                              type="submit"
                              className="admin-btn admin-btn--warn admin-btn--sm"
                            >
                              Rejeitar
                            </button>
                          </form>
                        )}
                        <Link
                          href={`/admin/noticias/${noticia.id}/edit`}
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                        >
                          Editar
                        </Link>
                        <form action={deleteNews.bind(null, noticia.id)}>
                          <DeleteButton label={noticia.title} />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ------------------------------------------------------ paginação */}
      {total > 0 && (
        <div className="admin-pager">
          <span className="admin-pager__info">
            Página {page} de {totalPages} · {total}{" "}
            {total === 1 ? "notícia" : "notícias"}
          </span>
          <div className="admin-pager__nav">
            <PagerLink
              href={
                prevPage
                  ? `/admin/noticias?status=${status}&page=${prevPage}`
                  : null
              }
              label="← Anterior"
            />
            <PagerLink
              href={
                nextPage
                  ? `/admin/noticias?status=${status}&page=${nextPage}`
                  : null
              }
              label="Próxima →"
            />
          </div>
        </div>
      )}
    </>
  );
}

// Link de paginação; quando `href` é null vira um botão "apagado" (sem navegar).
function PagerLink({ href, label }: { href: string | null; label: string }) {
  if (!href) {
    return (
      <span aria-disabled="true" className="admin-pager__btn">
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className="admin-pager__btn">
      {label}
    </Link>
  );
}
