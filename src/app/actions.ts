"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;
const contactSubmissionAttempts = new Map<string, number[]>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
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

  const forwardedFor = (await headers()).get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

  // Best effort only: production must use a durable shared store such as Redis.
  if (isRateLimited(ip)) {
    return {
      status: "error",
      message: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    };
  }

  try {
    await prisma.contact.create({
      data: {
        name: name.slice(0, 120),
        email: email.slice(0, 160),
        phone: phone.slice(0, 40),
        city: city.slice(0, 80),
        message: message ? `[${origin}] ${message.slice(0, 2000)}` : `[${origin}]`,
      },
    });
  } catch {
    console.error("Contact submission could not be saved.");
    return {
      status: "error",
      message: "Não foi possível enviar agora. Tente novamente em instantes.",
    };
  }

  return { status: "success" };
}
