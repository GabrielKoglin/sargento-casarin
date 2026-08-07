// ============================================================================
// admin/(app)/equipe/page.tsx — gestão da EQUIPE (/admin/equipe)
// ============================================================================
// Server Component. Herda o shell + guarda de sessão de (app)/layout.tsx. Lista
// os membros (usuários que podem entrar no painel) e — SÓ para o titular
// ("owner") — permite adicionar, redefinir senha, trocar papel e excluir.
//
// Permissão: o titular gerencia; editores veem a lista em modo leitura. Enquanto
// não existir NENHUM owner (logo após a migração do campo `role`), qualquer
// sessão é tratada como titular (bootstrap) — ver requireOwner em ./actions.
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MemberForm } from "./member-form";
import { MemberActions } from "./member-actions";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  mfaEnabled: boolean;
  createdAt: Date;
};

export default async function AdminEquipePage() {
  const session = await getSession();

  let members: Member[] = [];
  let ownersCount = 0;
  try {
    members = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, email: true, role: true, mfaEnabled: true, createdAt: true },
    });
    ownersCount = members.filter((m) => m.role === "owner").length;
  } catch {
    console.error("Falha ao carregar a equipe.");
  }

  const myId = session?.sub ?? "";
  const myRole = members.find((m) => m.id === myId)?.role;
  // Bootstrap: sem nenhum owner, o usuário atual pode gerenciar (para se promover).
  const canManage = myRole === "owner" || ownersCount === 0;

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Acesso</span>
        <h1 className="admin-page-header__title">Equipe</h1>
        <p className="admin-page-header__subtitle">
          Pessoas com acesso ao painel. O <strong>titular</strong> gerencia a
          equipe; o <strong>editor</strong> cuida do conteúdo (propostas,
          notícias, agenda, mídia e mensagens).
        </p>
      </header>

      {ownersCount === 0 ? (
        <div className="admin-note" style={{ marginBottom: "1.5rem" }}>
          <strong>Defina o titular.</strong> Nenhuma conta é titular ainda.
          Adicione um membro com papel <strong>Titular</strong> (ou promova o seu
          usuário) para travar a gestão da equipe.
        </div>
      ) : null}

      {canManage ? (
        <section style={{ marginBottom: "2.25rem" }}>
          <h2 className="admin-section-title">Adicionar membro</h2>
          <MemberForm />
        </section>
      ) : (
        <div className="admin-note" style={{ marginBottom: "1.5rem" }}>
          Apenas o <strong>titular</strong> da conta pode adicionar ou remover
          membros. Fale com quem administra o painel.
        </div>
      )}

      <section>
        <h2 className="admin-section-title">
          Membros{" "}
          <span style={{ color: "var(--a-muted)", fontWeight: 400 }}>
            ({members.length})
          </span>
        </h2>

        {members.length === 0 ? (
          <p className="admin-note">Nenhum membro cadastrado.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {members.map((m) => {
              const isSelf = m.id === myId;
              // Não dá para excluir a si mesmo nem o último titular.
              const canDelete =
                canManage &&
                !isSelf &&
                !(m.role === "owner" && ownersCount <= 1);
              return (
                <article key={m.id} className="admin-card admin-member">
                  <div className="admin-member__head">
                    <div>
                      <div className="admin-member__name">
                        {m.name}
                        {isSelf ? (
                          <span className="admin-member__you">você</span>
                        ) : null}
                      </div>
                      <div className="admin-member__email">{m.email}</div>
                    </div>
                    <div className="admin-member__meta">
                      <span style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        {m.mfaEnabled ? (
                          <span
                            className="admin-role-pill is-editor"
                            title="Verificação em duas etapas ativa"
                          >
                            2FA
                          </span>
                        ) : null}
                        <RolePill role={m.role} />
                      </span>
                      <time
                        className="admin-member__date"
                        dateTime={m.createdAt.toISOString()}
                      >
                        desde {dateFormatter.format(m.createdAt)}
                      </time>
                    </div>
                  </div>

                  {/* Titular gerencia só EDITORES (e a PRÓPRIA conta). O card de
                      OUTRO titular fica só-leitura — ninguém mexe na conta de um
                      par (o servidor também recusa, ver actions.ts). */}
                  {canManage && (isSelf || m.role !== "owner") ? (
                    <MemberActions
                      id={m.id}
                      role={m.role}
                      isSelf={isSelf}
                      canDelete={canDelete}
                      hasMfa={m.mfaEnabled}
                    />
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function RolePill({ role }: { role: string }) {
  const owner = role === "owner";
  return (
    <span className={`admin-role-pill ${owner ? "is-owner" : "is-editor"}`}>
      {owner ? "Titular" : "Editor"}
    </span>
  );
}
