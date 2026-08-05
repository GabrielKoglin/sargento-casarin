"use server";

// ============================================================================
// admin/actions.ts — ações compartilhadas do painel (logout)
// ============================================================================
import { redirect } from "next/navigation";
import { clearSessionCookie } from "@/lib/session";

/** Encerra a sessão: apaga o cookie e volta para a tela de login. */
export async function logout() {
  await clearSessionCookie();
  // redirect() lança NEXT_REDIRECT — deixe fora de try/catch.
  redirect("/admin/login");
}
