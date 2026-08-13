// ============================================================================
// proposal-icon.tsx — ícone (Feather/react-icons) de cada proposta
// ============================================================================
// Substitui os emojis por ícones de linha, limpos e profissionais. Escolhe o
// ícone a partir de palavras-chave no slug/categoria; cai num padrão neutro
// quando nada casa. Server-safe (react-icons são só SVG). Retorna o elemento
// direto (sem atribuir o componente a uma variável no render).
import {
  FiShield,
  FiAward,
  FiBookOpen,
  FiHeart,
  FiTrendingUp,
  FiFileText,
} from "react-icons/fi";

export function ProposalIcon({
  slug,
  category,
}: {
  slug: string;
  category: string;
}) {
  const s = `${slug} ${category}`.toLowerCase();
  if (/segur|crime|fac[çc]|polic|arma|viatur/.test(s))
    return <FiShield aria-hidden="true" />;
  if (/valoriz|profiss|carreir|sal[áa]ri|remuner|tropa/.test(s))
    return <FiAward aria-hidden="true" />;
  if (/educ|escol|ensino|valores/.test(s))
    return <FiBookOpen aria-hidden="true" />;
  if (/femin|mulher|viol[êe]nc|dom[ée]st/.test(s))
    return <FiHeart aria-hidden="true" />;
  if (/forte|econom|desenvolv|agro|emprego|renda/.test(s))
    return <FiTrendingUp aria-hidden="true" />;
  return <FiFileText aria-hidden="true" />;
}
