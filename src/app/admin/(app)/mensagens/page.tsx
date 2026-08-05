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
import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { deleteContact } from "./actions";

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
        <h1 className="admin-page-header__title">Mensagens</h1>
        <p className="admin-page-header__subtitle">
          Mensagens recebidas pelo formulário de contato do site.
        </p>
      </header>

      {total === 0 ? (
        <p className="admin-note">
          <strong>Nenhuma mensagem recebida ainda.</strong> Assim que alguém
          enviar o formulário de contato, ela aparecerá aqui.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {mensagens.map((msg) => (
            <article key={msg.id} className="admin-card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div
                    className="text-base font-bold"
                    style={{ color: "var(--a-text)" }}
                  >
                    {msg.name}
                  </div>
                  <div
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--a-muted)" }}
                  >
                    {msg.city}
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

              <div
                className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm"
                style={{ color: "var(--a-muted)" }}
              >
                <a
                  href={`mailto:${msg.email}`}
                  className="underline-offset-2 hover:underline"
                  style={{ color: "var(--a-green-bright)" }}
                >
                  {msg.email}
                </a>
                <a
                  href={`tel:${msg.phone}`}
                  className="underline-offset-2 hover:underline"
                  style={{ color: "var(--a-green-bright)" }}
                >
                  {msg.phone}
                </a>
              </div>

              <p
                className="mt-3 whitespace-pre-wrap text-sm leading-relaxed"
                style={{ color: "var(--a-text)" }}
              >
                {msg.message}
              </p>

              <div className="mt-3 flex justify-end">
                <form action={deleteContact}>
                  <input type="hidden" name="id" value={msg.id} />
                  <button
                    type="submit"
                    className="cursor-pointer bg-transparent text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--a-danger)" }}
                  >
                    Excluir
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------ paginação */}
      {total > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            marginTop: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--a-muted)" }}>
            Página {page} de {totalPages} · {total}{" "}
            {total === 1 ? "mensagem" : "mensagens"}
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
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
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.4rem 0.85rem",
    borderRadius: "3px",
    border: "1px solid var(--a-line)",
    fontSize: "0.8rem",
    fontWeight: 600,
  };
  if (!href) {
    return (
      <span
        aria-disabled="true"
        style={{ ...base, color: "var(--a-muted)", opacity: 0.4 }}
      >
        {label}
      </span>
    );
  }
  return (
    <Link href={href} style={{ ...base, color: "var(--a-text)" }}>
      {label}
    </Link>
  );
}
