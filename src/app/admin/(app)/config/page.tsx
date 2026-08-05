// ============================================================================
// admin/(app)/config/page.tsx — configurações do site (/admin/config)
// ============================================================================
// Server Component. Herda o shell + guarda de sessão de (app)/layout.tsx.
// Settings é um armazém genérico chave-valor: um formulário adiciona/atualiza
// (upsert pela chave) e cada linha permite editar o valor ou excluir.
import { prisma } from "@/lib/prisma";
import { upsertSetting, deleteSetting } from "./actions";

// Lista sempre "ao vivo" — nunca pré-renderizar em build.
export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const settings = await prisma.settings.findMany({ orderBy: { key: "asc" } });

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Sistema</span>
        <h1 className="admin-page-header__title">Configurações</h1>
        <p className="admin-page-header__subtitle">
          Parâmetros chave-valor do site. Salvar uma chave existente sobrescreve
          o valor (upsert).
        </p>
      </header>

      {/* Adicionar / atualizar por chave */}
      <form
        action={upsertSetting}
        className="mb-8 flex flex-col gap-4 rounded border p-4 sm:flex-row sm:items-end"
        style={{ borderColor: "var(--a-line)", background: "var(--a-panel)" }}
      >
        <div className="admin-field sm:flex-1">
          <label htmlFor="key" className="admin-field__label">
            Chave
          </label>
          <input
            id="key"
            name="key"
            type="text"
            required
            className="admin-field__input"
            placeholder="ex.: whatsapp_numero"
          />
        </div>
        <div className="admin-field sm:flex-[2]">
          <label htmlFor="value" className="admin-field__label">
            Valor
          </label>
          <input
            id="value"
            name="value"
            type="text"
            className="admin-field__input"
            placeholder="ex.: +55 65 99999-0000"
          />
        </div>
        <button type="submit" className="admin-btn">
          Salvar
        </button>
      </form>

      {settings.length === 0 ? (
        <p className="admin-note">
          <strong>Nenhum parâmetro configurado.</strong> Use o formulário acima
          para adicionar o primeiro par chave-valor.
        </p>
      ) : (
        <div
          className="overflow-x-auto rounded border"
          style={{ borderColor: "var(--a-line)" }}
        >
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--a-muted)" }}
              >
                <th className="px-4 py-3 font-semibold">Chave</th>
                <th className="px-4 py-3 font-semibold">Valor</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr
                  key={setting.id}
                  className="border-t align-middle"
                  style={{ borderColor: "var(--a-line)" }}
                >
                  <td
                    className="whitespace-nowrap px-4 py-3 font-mono font-semibold"
                    style={{ color: "var(--a-text)" }}
                  >
                    {setting.key}
                  </td>
                  <td className="px-4 py-3">
                    {/* Edição inline: reusa upsertSetting com a chave da linha. */}
                    <form
                      action={upsertSetting}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="key" value={setting.key} />
                      <input
                        name="value"
                        type="text"
                        defaultValue={setting.value}
                        className="admin-field__input"
                        style={{ minWidth: "12rem" }}
                        aria-label={`Valor de ${setting.key}`}
                      />
                      <button
                        type="submit"
                        className="cursor-pointer whitespace-nowrap text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "var(--a-green-bright)" }}
                      >
                        Salvar
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <form action={deleteSetting}>
                        <input type="hidden" name="id" value={setting.id} />
                        <button
                          type="submit"
                          className="cursor-pointer bg-transparent text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "var(--a-danger)" }}
                        >
                          Excluir
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
