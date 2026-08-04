"use server";

import { prisma } from "@/lib/prisma";

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
  const origin = String(formData.get("origin") ?? "contato").slice(0, 30);
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

  await prisma.contact.create({
    data: {
      name: name.slice(0, 120),
      email: email.slice(0, 160),
      phone: phone.slice(0, 40),
      city: city.slice(0, 80),
      message: message ? `[${origin}] ${message.slice(0, 2000)}` : `[${origin}]`,
    },
  });

  return { status: "success" };
}
