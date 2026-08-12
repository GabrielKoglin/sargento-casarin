// ============================================================================
// admin/(app)/mensagens/page.tsx — caixa de mensagens (/admin/mensagens)
// ============================================================================
// Server Component, SOMENTE LEITURA. Herda o shell + guarda de sessão de
// (app)/layout.tsx. Lista os contatos recebidos (mais recentes primeiro). A
// única mutação é excluir (limpeza de spam) via a action deleteContact.
//
// PAGINAÇÃO (crítica aqui: o formulário público pode gerar spam em volume):
// nunca carregamos a tabela inteira — só as PAGE_SIZE mensagens da página atual.
//   ?page = 1..N  (default: 1; sempre "clampado" ao intervalo válido)
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  deleteContact,
  markAllContactsRead,
  markContactRead,
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

export default async function AdminMensagensPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;

  // Contamos primeiro para "clampar" a página ao intervalo válido — assim um
  // ?page absurdo nunca vira um skip gigante contra o banco.
  const total = await prisma.contact.count();
  const unread = await prisma.contact.count({ where: { read: false } });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, parsePage(sp.page)), totalPages);

  const mensagens = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Contato</span>
        <h1 className="admin-page-header__title">
          Mensagens
          {unread > 0 ? (
            <span className="admin-title-badge">{unread} nova{unread > 1 ? "s" : ""}</span>
          ) : null}
        </h1>
        <p className="admin-page-header__subtitle">
          Mensagens de contato e cadastros de apoiadores recebidos pelo site.
        </p>
      </header>

      {unread > 0 ? (
        <div className="admin-toolbar">
          <form action={markAllContactsRead}>
            <button type="submit" className="admin-btn admin-btn--ghost admin-btn--sm">
              Marcar todas como lidas
            </button>
          </form>
        </div>
      ) : null}

      {total === 0 ? (
        <p className="admin-note">
          <strong>Nenhuma mensagem recebida ainda.</strong> Assim que alguém
          enviar o formulário de contato, ela aparecerá aqui.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {mensagens.map((msg) => {
            const parsed = parseOrigin(msg.message);
            return (
            <article
              key={msg.id}
              className={`admin-card${msg.read ? "" : " admin-card--unread"}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div
                    className="text-base font-bold"
                    style={{ color: "var(--a-text)" }}
                  >
                    {msg.name}
                    {!msg.read ? (
                      <span className="admin-new-pill">Nova</span>
                    ) : null}
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
                    <OriginBadge origin={parsed.origin} />
                    <span>{msg.city}</span>
                  </div>
                </div>
                <time
                  className="whitespace-nowrap text-xs"
                  style={{ color: "var(--a-muted)" }}
                  dateTime={msg.createdAt.toISOString()}
                >
                  {dateFormatter.format(msg.createdAt)}
                </time>
              </div>

              <div className="admin-msg__contacts">
                {msg.cpf ? <span style={{ marginRight: '1rem' }}>CPF: {msg.cpf}</span> : null}
                <a href={`mailto:${msg.email}`}>{msg.email}</a>
                <a href={`tel:${msg.phone}`}>{msg.phone}</a>
              </div>

              {parsed.body ? (
                <p className="admin-msg__body">{parsed.body}</p>
              ) : (
                <p
                  className="admin-msg__body"
                  style={{ color: "var(--a-faint)", fontStyle: "italic" }}
                >
                  Cadastro de apoiador — sem mensagem.
                </p>
              )}

              <div className="admin-msg__footer">
                {!msg.read ? (
                  <form action={markContactRead}>
                    <input type="hidden" name="id" value={msg.id} />
                    <button type="submit" className="admin-linkbtn">
                      Marcar como lida
                    </button>
                  </form>
                ) : null}
                <form action={deleteContact}>
                  <input type="hidden" name="id" value={msg.id} />
                  <button
                    type="submit"
                    className="admin-linkbtn admin-linkbtn--danger"
                  >
                    Excluir
                  </button>
                </form>
              </div>
            </article>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------ paginação */}
      {total > 0 && (
        <div className="admin-pager">
          <span className="admin-pager__info">
            Página {page} de {totalPages} · {total}{" "}
            {total === 1 ? "mensagem" : "mensagens"}
          </span>
          <div className="admin-pager__nav">
            <PagerLink
              href={prevPage ? `/admin/mensagens?page=${prevPage}` : null}
              label="← Anterior"
            />
            <PagerLink
              href={nextPage ? `/admin/mensagens?page=${nextPage}` : null}
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

// A origem do envio ("tropa" = cadastro de apoiador; "contato" = mensagem de
// contato) é gravada como prefixo [origem] no início da mensagem pela saveContact.
// Aqui separamos o selo do corpo real (que pode ser vazio nos cadastros de apoiador).
function parseOrigin(message: string): {
  origin: "tropa" | "contato" | null;
  body: string;
} {
  const m = message.match(/^\[(tropa|contato)\]\s*([\s\S]*)$/);
  if (m) return { origin: m[1] as "tropa" | "contato", body: m[2].trim() };
  return { origin: null, body: message };
}

function OriginBadge({ origin }: { origin: "tropa" | "contato" | null }) {
  if (origin === "tropa") {
    return <span className="admin-role-pill is-owner">Apoiador</span>;
  }
  if (origin === "contato") {
    return <span className="admin-role-pill is-editor">Contato</span>;
  }
  return null;
}
