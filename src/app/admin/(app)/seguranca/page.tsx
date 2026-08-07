// ============================================================================
// admin/(app)/seguranca/page.tsx — Segurança da conta (/admin/seguranca)
// ============================================================================
// Server Component. Herda shell + guarda de sessão de (app)/layout.tsx. NUNCA
// seleciona totpSecret — a página só precisa saber SE o MFA está ativo.
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MfaSetup } from "./mfa-setup";

export const dynamic = "force-dynamic";

export default async function AdminSegurancaPage() {
  const session = await getSession();
  let mfaEnabled = false;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session?.sub ?? "" },
      select: { mfaEnabled: true }, // sem totpSecret, de propósito
    });
    mfaEnabled = user?.mfaEnabled ?? false;
  } catch (error) {
    console.error("Falha ao carregar o estado do MFA.", error);
  }

  return (
    <>
      <header className="admin-page-header">
        <span className="admin-page-header__eyebrow">Conta</span>
        <h1 className="admin-page-header__title">Segurança</h1>
        <p className="admin-page-header__subtitle">
          Verificação em duas etapas (MFA) da <strong>sua</strong> conta. Perdeu
          o acesso ao app? O titular pode resetar o MFA de um membro em{" "}
          <code>/admin/equipe</code>.
        </p>
      </header>
      <MfaSetup enabled={mfaEnabled} />
    </>
  );
}
