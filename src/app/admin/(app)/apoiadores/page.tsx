// ============================================================================
// admin/(app)/apoiadores/page.tsx — líderes apoiadores (/admin/apoiadores)
// ============================================================================
// Server Component. Herda o shell + guarda de sessão de (app)/layout.tsx.
// - Adicionar líder (entra ATIVO, aparece no mapa da /adesivos).
// - Aprovar cadastros PENDENTES feitos pelo próprio apoiador no site.
// - Excluir. O badge de pendentes vive na sidebar (revalidado no escopo layout).
import { prisma } from "@/lib/prisma";
import { MT_CITIES } from "@/data/mt-cities";
import { createLeader, approveLeader, deleteLeader } from "./actions";

export const dynamic = "force-dynamic";

// Link wa.me: só dígitos; assume DDI 55 (Brasil) quando o número não o traz.
function waLink(whatsapp: string): string {
  let digits = whatsapp.replace(/\D/g, "");
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}`;
}

export default async function ApoiadoresPage() {
  const leaders = await prisma.leader.findMany({
    orderBy: [{ status: "asc" }, { city: "asc" }],
  });
  const pending = leaders.filter((l) => l.status === "pending");
  const active = leaders.filter((l) => l.status === "active");

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Rede de apoio</span>
        <h1 className="admin-page-header__title">
          Apoiadores
          {pending.length > 0 ? (
            <span className="admin-title-badge">
              {pending.length} aguardando
            </span>
          ) : null}
        </h1>
        <p className="admin-page-header__subtitle">
          Líderes que entregam os adesivos por cidade. Aparecem no mapa da página{" "}
          <strong>/adesivos</strong> — ao clicar na cidade, o eleitor fala direto no
          WhatsApp do líder.
        </p>
      </header>

      {/* ---------- adicionar líder ---------- */}
      <div className="admin-form-card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="admin-section-title" style={{ marginBottom: "1rem" }}>
          Adicionar líder
        </h2>
        <form action={createLeader} className="admin-leader-form">
          <div className="admin-field">
            <label htmlFor="l-name" className="admin-field__label">Nome</label>
            <input id="l-name" name="name" className="admin-field__input" required maxLength={120} />
          </div>
          <div className="admin-field">
            <label htmlFor="l-wa" className="admin-field__label">WhatsApp</label>
            <input
              id="l-wa"
              name="whatsapp"
              className="admin-field__input"
              required
              maxLength={40}
              inputMode="tel"
              placeholder="(65) 90000-0000"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="l-city" className="admin-field__label">Cidade</label>
            <input
              id="l-city"
              name="city"
              list="mt-cities"
              className="admin-field__input"
              required
              maxLength={120}
              placeholder="Comece a digitar…"
              autoComplete="off"
            />
            <datalist id="mt-cities">
              {MT_CITIES.map((c) => (
                <option key={c.code} value={c.name} />
              ))}
            </datalist>
          </div>
          <div className="admin-leader-form__submit">
            <button type="submit" className="admin-btn">+ Adicionar</button>
          </div>
        </form>
      </div>

      {/* ---------- pendentes ---------- */}
      {pending.length > 0 && (
        <section style={{ marginBottom: "1.75rem" }}>
          <h2 className="admin-section-title" style={{ marginBottom: ".85rem" }}>
            Aguardando aprovação
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map((l) => (
              <article key={l.id} className="admin-card admin-card--unread">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="text-base font-bold" style={{ color: "var(--a-text)" }}>
                      {l.name}
                      <span className="admin-new-pill">Novo</span>
                    </div>
                    <div className="admin-msg__contacts">
                      <span className="admin-role-pill is-editor">{l.city}</span>
                      <a href={waLink(l.whatsapp)} target="_blank" rel="noopener noreferrer">
                        {l.whatsapp}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="admin-msg__footer">
                  <form action={approveLeader}>
                    <input type="hidden" name="id" value={l.id} />
                    <button type="submit" className="admin-linkbtn">Aprovar</button>
                  </form>
                  <form action={deleteLeader}>
                    <input type="hidden" name="id" value={l.id} />
                    <button type="submit" className="admin-linkbtn admin-linkbtn--danger">Excluir</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ---------- ativos ---------- */}
      <section>
        <h2 className="admin-section-title" style={{ marginBottom: ".85rem" }}>
          Líderes ativos {active.length > 0 ? `(${active.length})` : ""}
        </h2>
        {active.length === 0 ? (
          <p className="admin-note">
            Nenhum líder ativo ainda. Adicione acima ou aprove um cadastro pendente.
          </p>
        ) : (
          <div className="admin-leader-grid">
            {active.map((l) => (
              <article key={l.id} className="admin-card">
                <div className="text-base font-bold" style={{ color: "var(--a-text)" }}>
                  {l.name}
                </div>
                <div className="admin-msg__contacts">
                  <span className="admin-role-pill is-editor">{l.city}</span>
                  <a href={waLink(l.whatsapp)} target="_blank" rel="noopener noreferrer">
                    {l.whatsapp}
                  </a>
                </div>
                <div className="admin-msg__footer">
                  <form action={deleteLeader}>
                    <input type="hidden" name="id" value={l.id} />
                    <button type="submit" className="admin-linkbtn admin-linkbtn--danger">Excluir</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
