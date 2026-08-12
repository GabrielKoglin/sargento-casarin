"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;
// Acima deste tamanho, varremos o Map removendo janelas já vencidas. Sem isso,
// uma entrada só some quando o MESMO IP reenvia — tráfego de IPs distintos
// vazaria memória num servidor de vida longa.
const RATE_LIMIT_PRUNE_THRESHOLD = 1000;
const contactSubmissionAttempts = new Map<string, number[]>();

// Limpeza leve e síncrona: descarta tentativas fora da janela e remove IPs sem
// nenhuma tentativa recente. Chamada só quando o Map cresce, para não pagar a
// varredura em toda requisição.
function pruneExpiredAttempts(windowStart: number) {
  for (const [key, attempts] of contactSubmissionAttempts) {
    const recent = attempts.filter((attempt) => attempt > windowStart);
    if (recent.length === 0) {
      contactSubmissionAttempts.delete(key);
    } else if (recent.length !== attempts.length) {
      contactSubmissionAttempts.set(key, recent);
    }
  }
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  if (contactSubmissionAttempts.size > RATE_LIMIT_PRUNE_THRESHOLD) {
    pruneExpiredAttempts(windowStart);
  }

  const attempts = (contactSubmissionAttempts.get(ip) ?? []).filter(
    (attempt) => attempt > windowStart,
  );

  if (attempts.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
    contactSubmissionAttempts.set(ip, attempts);
    return true;
  }

  attempts.push(now);
  contactSubmissionAttempts.set(ip, attempts);
  return false;
}

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function saveContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot: humanos não veem este campo; bots o preenchem
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const rawOrigin = String(formData.get("origin") ?? "contato").replace(/[\r\n]/g, "");
  const origin = rawOrigin === "tropa" ? "tropa" : "contato";
  const consent = formData.get("consent");

  if (!name || !email || !phone || !city) {
    return { status: "error", message: "Preencha todos os campos obrigatórios." };
  }
  if (!/.+@.+\..+/.test(email)) {
    return { status: "error", message: "Informe um e-mail válido." };
  }
  if (!consent) {
    return {
      status: "error",
      message: "É necessário autorizar o uso dos dados para continuar.",
    };
  }

  // Resolve o IP em cadeia: primeiro salto de x-forwarded-for, senão x-real-ip.
  // NUNCA use uma string literal ("unknown") como chave: ela viraria um balde
  // único compartilhado por TODOS os visitantes (dev local, exposição direta do
  // Node ou proxy que só seta x-real-ip), bloqueando cadastros legítimos após 5
  // envios no site inteiro.
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip")?.trim() ||
    null;

  // Best effort only: sem um IP confiável não aplicamos o rate-limit — preferimos
  // permitir o envio a bloquear todo mundo num único balde. Em produção atrás de
  // um proxy confiável, o ideal é um store compartilhado (ex.: Redis) chaveado
  // pelo IP real do proxy.
  if (ip && isRateLimited(ip)) {
    return {
      status: "error",
      message: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    };
  }

  try {
    await prisma.contact.create({
      data: {
        name: name.slice(0, 120),
        cpf: cpf.slice(0, 20),
        email: email.slice(0, 160),
        phone: phone.slice(0, 40),
        city: city.slice(0, 80),
        message: message ? `[${origin}] ${message.slice(0, 2000)}` : `[${origin}]`,
      },
    });
  } catch (error) {
    console.error("Contact submission could not be saved.", error);
    return {
      status: "error",
      message: "Não foi possível enviar agora. Tente novamente em instantes.",
    };
  }

  return { status: "success" };
}
