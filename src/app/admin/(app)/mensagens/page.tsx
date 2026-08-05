// ============================================================================
// admin/(app)/mensagens/page.tsx — caixa de mensagens (/admin/mensagens)
// ============================================================================
// Server Component, SOMENTE LEITURA. Herda o shell + guarda de sessão de
// (app)/layout.tsx. Lista os contatos recebidos (mais recentes primeiro). A
// única mutação é excluir (limpeza de spam) via a action deleteContact.
import { prisma } from "@/lib/prisma";
import { deleteContact } from "./actions";

// Lista sempre "ao vivo" — nunca pré-renderizar em build.
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function AdminMensagensPage() {
  const mensagens = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Contato</span>
        <h1 className="admin-page-header__title">Mensagens</h1>
        <p className="admin-page-header__subtitle">
          Mensagens recebidas pelo formulário de contato do site.
        </p>
      </header>

      {mensagens.length === 0 ? (
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
    </>
  );
}
