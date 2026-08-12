// ============================================================================
// admin/(app)/adesivos/page.tsx — fila de pedidos de adesivo (/admin/adesivos)
// ============================================================================
// Server Component, SOMENTE LEITURA. Herda o shell + guarda de sessão de
// (app)/layout.tsx. Lista os pedidos (mais recentes primeiro); as mutações são
// marcar como entregue e excluir. Paginado como as mensagens (o formulário
// público pode gerar volume).
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  deleteStickerRequest,
  markAllStickersDelivered,
  markStickerDelivered,
} from "./actions";

// Lista sempre "ao vivo" — nunca pré-renderizar em build.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// Link wa.me: só dígitos; assume DDI 55 (Brasil) quando o número não o traz.
function waLink(whatsapp: string): string {
  let digits = whatsapp.replace(/\D/g, "");
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}`;
}

export default async function AdminAdesivosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;

  const total = await prisma.stickerRequest.count();
  const pending = await prisma.stickerRequest.count({ where: { delivered: false } });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, parsePage(sp.page)), totalPages);

  const pedidos = await prisma.stickerRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Campanha de rua</span>
        <h1 className="admin-page-header__title">
          Adesivos
          {pending > 0 ? (
            <span className="admin-title-badge">{pending} pendente{pending > 1 ? "s" : ""}</span>
          ) : null}
        </h1>
        <p className="admin-page-header__subtitle">
          Pedidos de adesivo feitos pela página <strong>/adesivos</strong>. Entregue na
          cidade ou repasse ao apoiador responsável e marque como entregue.
        </p>
      </header>

      {pending > 0 ? (
        <div className="admin-toolbar">
          <form action={markAllStickersDelivered}>
            <button type="submit" className="admin-btn admin-btn--ghost admin-btn--sm">
              Marcar todos como entregues
            </button>
          </form>
        </div>
      ) : null}

      {total === 0 ? (
        <p className="admin-note">
          <strong>Nenhum pedido ainda.</strong> Assim que alguém pedir um adesivo na
          página <strong>/adesivos</strong>, ele aparecerá aqui.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((p) => (
            <article
              key={p.id}
              className={`admin-card${p.delivered ? "" : " admin-card--unread"}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div className="text-base font-bold" style={{ color: "var(--a-text)" }}>
                    {p.name}
                    {!p.delivered ? <span className="admin-new-pill">Novo</span> : null}
                  </div>
                  <div
                    className="text-xs uppercase tracking-wider"
                    style={{
                      color: "var(--a-muted)",
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span className="admin-role-pill is-editor">{p.city}</span>
                    <span>
                      {p.quantity} adesivo{p.quantity > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <time
                  className="whitespace-nowrap text-xs"
                  style={{ color: "var(--a-muted)" }}
                  dateTime={p.createdAt.toISOString()}
                >
                  {dateFormatter.format(p.createdAt)}
                </time>
              </div>

              <div className="admin-msg__contacts">
                <a href={waLink(p.whatsapp)} target="_blank" rel="noopener noreferrer">
                  WhatsApp: {p.whatsapp}
                </a>
              </div>

              <p className="admin-msg__body">
                <strong>Endereço:</strong> {p.address}
              </p>

              <div className="admin-msg__footer">
                {!p.delivered ? (
                  <form action={markStickerDelivered}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="admin-linkbtn">
                      Marcar como entregue
                    </button>
                  </form>
                ) : null}
                <form action={deleteStickerRequest}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="admin-linkbtn admin-linkbtn--danger">
                    Excluir
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="admin-pager">
          <span className="admin-pager__info">
            Página {page} de {totalPages} · {total} {total === 1 ? "pedido" : "pedidos"}
          </span>
          <div className="admin-pager__nav">
            <PagerLink
              href={prevPage ? `/admin/adesivos?page=${prevPage}` : null}
              label="← Anterior"
            />
            <PagerLink
              href={nextPage ? `/admin/adesivos?page=${nextPage}` : null}
              label="Próxima →"
            />
          </div>
        </div>
      )}
    </>
  );
}

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
