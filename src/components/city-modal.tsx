"use client";

// ============================================================================
// city-modal.tsx — popup ao clicar numa cidade do mapa de adesivos
// ============================================================================
// Fluxo pedido pelo usuário:
//  - Cidade COM líder  → botão que leva ao WhatsApp do líder cadastrado.
//  - Cidade SEM líder  → pergunta "sua cidade não tem líder apoiador, quer se
//    cadastrar?"; se SIM, abre o formulário de cadastro (o mesmo da aba Quero
//    Apoiar) já com a cidade preenchida; se NÃO, fecha.
// Acessível: role=dialog, foco no fechar, Esc/backdrop fecham, trava o scroll.
import { useEffect, useRef, useState } from "react";
import { ContactForm } from "@/components/contact-form";
import { waLink } from "@/lib/whatsapp";
import type { LeaderPin } from "@/components/mt-map";

export function CityModal({
  cityName,
  leaders,
  onClose,
}: {
  cityName: string;
  leaders: LeaderPin[];
  onClose: () => void;
}) {
  const [register, setRegister] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const hasLeader = leaders.length > 0;

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="lead-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="lead-modal"
        role="dialog"
        aria-modal="true"
        aria-label={cityName}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          className="lead-modal__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>

        {hasLeader ? (
          // ---------- cidade COM líder → WhatsApp ----------
          <>
            <span className="lead-modal__eyebrow">Líder apoiador</span>
            <h3 className="lead-modal__title">{cityName}</h3>
            <p className="lead-modal__lead">
              {leaders.length === 1
                ? "Esta cidade tem um líder apoiador! Fale no WhatsApp para pegar o seu adesivo:"
                : "Esta cidade tem líderes apoiadores! Fale no WhatsApp para pegar o seu adesivo:"}
            </p>
            <div className="citymodal__wa-list">
              {leaders.map((l) => (
                <a
                  key={l.id}
                  className="mtmap__wa"
                  href={waLink(
                    l.whatsapp,
                    `Olá, ${l.name}! Vi no site do Sargento Casarin que você é líder apoiador em ${cityName}. Gostaria de pegar meu adesivo. Pode me ajudar?`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span aria-hidden="true">💬</span> Falar com {l.name}
                </a>
              ))}
            </div>
          </>
        ) : register ? (
          // ---------- sem líder + clicou "Sim" → formulário ----------
          <>
            <span className="lead-modal__eyebrow">Cadastro</span>
            <h3 className="lead-modal__title">Faça seu cadastro</h3>
            <p className="lead-modal__lead">
              Deixe seus dados que a equipe da campanha entra em contato com você.
            </p>
            <ContactForm
              origin="adesivos"
              defaultCity={cityName}
              submitLabel="Enviar cadastro"
              successTitle="Cadastro recebido!"
              successText="Obrigado! Nossa equipe vai falar com você em breve."
            />
          </>
        ) : (
          // ---------- sem líder → pergunta ----------
          <>
            <span className="lead-modal__eyebrow">Sua cidade</span>
            <h3 className="lead-modal__title">{cityName}</h3>
            <p className="lead-modal__lead">
              Sua cidade ainda <strong>não tem um líder apoiador</strong>. Quer se
              cadastrar para ajudar a levar os adesivos do Casarin para aí?
            </p>
            <div className="citymodal__actions">
              <button
                type="button"
                className="mtmap__cta"
                onClick={() => setRegister(true)}
              >
                Sim, quero me cadastrar <span aria-hidden="true">➔</span>
              </button>
              <button type="button" className="citymodal__no" onClick={onClose}>
                Agora não
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
