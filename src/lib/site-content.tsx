// ============================================================================
// site-content.tsx — conteúdo editável do site (seção "Por que", bio, trajetória,
// comenda e listas de formação/reconhecimentos).
// ============================================================================
// Fonte única: a linha SiteContent(id="main") no banco, editada pela aba
// /admin/conteudo. As páginas (home e /sobre) leem via getSiteContent(), que
// cai em DEFAULT_CONTENT (o texto atual) quando a linha não existe ou está
// incompleta. Negrito nos textos: markdown simples `**assim**` → <strong>.
import { Fragment, type ReactNode } from "react";
import { prisma } from "@/lib/prisma";

export type TrajetoriaStep = { label: string; title: string; text: string };
export type ManifestoStat = { value: string; label: string };
export type CredItem = { num: string; title: string; text: string };
export type IconCard = { icon: string; title: string; text: string };
export type SocialChannel = { icon: string; name: string; handle: string; href: string };
export type LegalPage = { eyebrow: string; title: string; lead: string; body: string };

export type SiteContentData = {
  why: {
    caption: string;
    eyebrow: string;
    paragraphs: string[];
    targets: string[];
  };
  bio: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    quote: string;
    closing: string;
  };
  trajetoria: { steps: TrajetoriaStep[] };
  comenda: { eyebrow: string; title: string; desc: string; meta: string };
  creds: {
    formacao: string[];
    profissional: string[];
    honrarias: string[];
  };
  manifesto: {
    eyebrow: string;
    titleLine1: string;
    titleEm: string;
    titleLine2: string;
    paragraphs: string[];
    stats: ManifestoStat[];
  };
  home: {
    heroEyebrow: string;
    heroName: string;
    heroSubtitle: string;
    heroLead: string;
    ribbon1: string;
    ribbon2: string;
    creds: CredItem[];
    comendaEyebrow: string;
    comendaTitle: string;
    comendaMeta: string;
    propostasEyebrow: string;
    propostasTitle1: string;
    propostasTitle2: string;
    marquee: string[];
    ctaEyebrow: string;
    ctaTitle1: string;
    ctaTitle2: string;
    ctaLead: string;
  };
  tropa: {
    heroTitle: string;
    heroLead: string;
    formTitle: string;
    formText: string;
  };
  ajudar: {
    heroEyebrow: string;
    heroTitle: string;
    heroLead: string;
    legalAlert: string;
    cards: IconCard[];
    supportEyebrow: string;
    supportTitle: string;
    supportLead: string;
    supportTrust: string;
    comeceTitle: string;
    comeceText: string;
  };
  midias: {
    heroEyebrow: string;
    heroTitle: string;
    heroLead: string;
    canais: SocialChannel[];
    ctaTitle: string;
    ctaText: string;
  };
  contato: {
    heroEyebrow: string;
    heroTitle: string;
    heroLead: string;
    baseLabel: string;
    baseValue: string;
    emailLabel: string;
    emailValue: string;
    whatsLabel: string;
    whatsValue: string;
    formTitle: string;
    formText: string;
  };
  legal: {
    privacidade: LegalPage;
    termos: LegalPage;
    cookies: LegalPage;
    lgpd: LegalPage;
    regras: LegalPage;
  };
};

// Valores padrão = exatamente o que está publicado hoje. Negrito marcado com **.
export const DEFAULT_CONTENT: SiteContentData = {
  why: {
    caption:
      "Casarin não quer ser mais um político — ele representa quem enfrenta a realidade das ruas todos os dias",
    eyebrow: "Por que entrar para a política?",
    paragraphs: [
      "São mais de **15 anos na linha de frente da segurança pública de Mato Grosso**. Nesse período, o Sargento Casarin aprendeu uma lição dura: a coragem e o trabalho policial podem colocar o criminoso atrás das grades, mas a falta de investimentos nas forças de segurança, a baixa remuneração dos profissionais e as brechas e aberrações jurídicas podem comprometer todo o trabalho realizado e devolver o criminoso às ruas.",
      "Muitas das decisões que impactam diretamente a segurança das famílias mato-grossenses são tomadas longe da realidade das ruas e, muitas vezes, por pessoas que nunca vestiram uma farda nem enfrentaram de perto os desafios cotidianos da segurança pública.",
      "Por isso, o Sargento Casarin decidiu avançar: levar a experiência adquirida na linha de frente e o conhecimento de quem vivencia os problemas da segurança pública para os espaços onde essas decisões são tomadas.",
    ],
    targets: [
      "Quem conhece a rua, não só o gabinete",
      "15 anos de farda na linha de frente",
      "Defesa das famílias mato-grossenses",
      "Respeito a quem veste a farda",
      "Disciplina de tropa especializada na Assembleia",
    ],
  },
  bio: {
    eyebrow: "Sargento Dickson Casarin",
    title: "Uma vida dedicada a proteger Mato Grosso",
    paragraphs: [
      "Dickson Casarin é Sargento da Polícia Militar de Mato Grosso, com 15 anos de serviço dedicados à segurança da população. Da ronda nas ruas às operações da ROTAM, construiu sua trajetória onde o problema acontece: na linha de frente.",
      "Filho de Sinop, fez da rua o seu posto no 26º Batalhão de Polícia Militar, em Nova Mutum: enfrentou o crime de frente, desarticulou quadrilhas, tirou armas de circulação e combateu o tráfico. Convicto de que protege melhor quem mais se prepara, uniu a experiência das ruas ao estudo.",
    ],
    quote:
      "Quem passou a vida enfrentando o crime de perto sabe exatamente o que precisa mudar nas leis e no orçamento para proteger as famílias.",
    closing:
      "Depois de anos vendo boas operações esbarrarem em falta de estrutura, leis frouxas e decisões tomadas longe da realidade, o Sargento Casarin decidiu dar o próximo passo: representar os mato-grossenses na Assembleia Legislativa, com a firmeza de quem conhece o problema e a responsabilidade de quem sempre serviu.",
  },
  trajetoria: {
    steps: [
      {
        label: "01",
        title: "Ingresso na Polícia Militar de Mato Grosso",
        text: "Escolheu servir. Desde o primeiro dia de farda, o compromisso foi com a proteção das famílias mato-grossenses.",
      },
      {
        label: "02",
        title: "Linha de frente",
        text: "Anos de policiamento ostensivo nas ruas, vivendo de perto a realidade da segurança pública — a que não aparece nos gabinetes.",
      },
      {
        label: "03",
        title: "ROTAM — Batalhão Especializado de Patrulhamento Tático",
        text: "Formado em um dos melhores batalhões de Patrulhamento Tático do Brasil, atuando em ocorrências complexas de alto risco.",
      },
      {
        label: "04",
        title: "Candidatura 2026",
        text: "A nova missão: levar a experiência da linha de frente para onde as decisões são tomadas, como Deputado Estadual por Mato Grosso.",
      },
    ],
  },
  comenda: {
    eyebrow: "Honraria · 2026",
    title: "Comenda Marechal Cândido Rondon",
    desc: "A mais alta honraria da Assembleia Legislativa de Mato Grosso a quem presta relevantes serviços ao Estado. Concedida ao Sargento Casarin pela sua trajetória de dedicação à segurança pública mato-grossense.",
    meta: "Assembleia Legislativa de MT · Projeto de Resolução nº 435/2026",
  },
  creds: {
    formacao: [
      "Curso de Formação de Soldados · PMMT (2011)",
      "Gestão Pública pela Faculdade Anhanguera – 2018",
      "Bacharel em Direito, iniciado pela Universidade do Estado de Mato Grosso UNEMAT, e concluído pela Faculdade de Sinop FASIP – 2020",
      "Pós-graduação em Direito Militar com Ênfase em Política e Sistema de Defesa Nacional, pela Faculdade Única de Ipatinga – 2022",
      "Análise e Desenvolvido de Sistemas Pela Uniasselvi – (cursando)",
      "Pós-graduação em Cibersegurança pela Faculdade Uniasselvi - (cursando)",
    ],
    profissional: [],
    honrarias: [
      "Comenda Marechal Cândido Rondon · ALMT (2026)",
      "Moção de Aplausos · Câmara de Lucas do Rio Verde (2013)",
    ],
  },
  manifesto: {
    eyebrow: "Manifesto",
    titleLine1: "NÃO DÁ",
    titleEm: "MAIS",
    titleLine2: "PARA ACEITAR",
    paragraphs: [
      "O povo mato-grossense não aguenta mais viver com medo.",
      "Medo de sair de casa, medo de deixar os filhos na escola, medo de atender ao telefone e ser ameaçado por um criminoso. Medo de trabalhar uma vida inteira e perder, em poucos minutos, tudo aquilo que foi construído com tanto esforço. Mulheres com medo de viver ao lado de um covarde.",
      "Além de tudo isso, facções criminosas dominam territórios e recrutam nossas crianças e nossos jovens, muitas vezes porque o Estado não conseguiu chegar antes.",
      "Ninguém aguenta mais ligar para o 190, 197 ou 193 em uma situação de emergência e ouvir que todas as viaturas estão ocupadas.",
      "Enquanto isso, muitas das decisões que definem a segurança das nossas famílias são tomadas longe das ruas, por quem nunca sentiu na pele o que significa enfrentar o crime de frente.",
      "Essa causa vai muito além de qualquer discurso político. É sobre segurança, responsabilidade e, acima de tudo, sobre o futuro das nossas famílias. Porque construir um lugar mais seguro para viver é uma responsabilidade de todos nós.",
    ],
    stats: [
      { value: "15", label: "Anos de farda" },
      { value: "142", label: "Municípios em MT" },
      { value: "2027", label: "A missão continua" },
    ],
  },
  home: {
    heroEyebrow: "Sargento",
    heroName: "Casarin",
    heroSubtitle: "Candidato a Deputado Estadual\npor Mato Grosso",
    heroLead:
      "Mais de 15 anos na linha de frente da segurança pública. Agora, a missão é levar essa experiência para onde as decisões são tomadas.",
    ribbon1: "VAMOS",
    ribbon2: "VENCER!",
    creds: [
      { num: "15", title: "Anos na linha de frente", text: "Segurança Pública em MT. Experiência real – não teoria." },
      { num: "ROTAM", title: "Batalhão Especializado de Patrulhamento Tático", text: "Formado em um dos melhores batalhões de Patrulhamento Tático do Brasil, atuando em ocorrências complexas de alto risco." },
      { num: "MT", title: "Mato Grosso primeiro", text: "Defende quem vive, trabalha e produz neste estado." },
    ],
    comendaEyebrow: "Condecorado",
    comendaTitle: "Comenda Marechal Cândido Rondon",
    comendaMeta: "Assembleia Legislativa de Mato Grosso · 2026",
    propostasEyebrow: "Eixos de atuação",
    propostasTitle1: "O QUE CASARIN",
    propostasTitle2: "VAI DEFENDER",
    marquee: [
      "SARGENTO CASARIN",
      "SEGURANÇA PÚBLICA",
      "DEPUTADO ESTADUAL",
      "MATO GROSSO 2026",
      "VAMOS VENCER",
    ],
    ctaEyebrow: "Comunidade",
    ctaTitle1: "FAÇA PARTE",
    ctaTitle2: "DA TROPA",
    ctaLead:
      "Receba conteúdos exclusivos, participe das mobilizações e ajude a levar essa mensagem por todo o Mato Grosso.",
  },
  tropa: {
    heroTitle: "SEJA UM *APOIADOR*",
    heroLead:
      "Cadastre-se na rede de apoiadores do Sargento Casarin e ajude a levar essa mensagem para todo o Mato Grosso.",
    formTitle: "Seja um apoiador do Casarin",
    formText:
      "Preencha seus dados para entrar na rede de apoiadores. Sem spam — só o que importa para a missão.",
  },
  ajudar: {
    heroEyebrow: "Apoie a missão",
    heroTitle: "QUERO *AJUDAR*",
    heroLead:
      "Esta é uma caminhada construída por gente comum, que acredita que Mato Grosso pode ser mais seguro. Todo apoio conta.",
    legalAlert:
      "O apoio financeiro é feito exclusivamente pela plataforma oficial (**apoiar.me/sargentocasarin**), sempre de acordo com as regras da legislação eleitoral. Desconfie de qualquer pedido de dinheiro em nome do Sargento Casarin fora desse canal.",
    cards: [
      { icon: "📣", title: "Divulgue", text: "Compartilhe as propostas com amigos e familiares. Boca a boca é a arma mais poderosa de uma campanha independente." },
      { icon: "🤝", title: "Seja voluntário", text: "Entre nos nossos grupos e participe das mobilizações na sua cidade ou região." },
      { icon: "💡", title: "Envie ideias", text: "Conte os problemas da sua região e ajude a construir propostas que funcionam na vida real." },
    ],
    supportEyebrow: "Apoio à campanha",
    supportTitle: "FORTALEÇA\nESSA *MISSÃO*",
    supportLead:
      "Esta é uma caminhada **independente**, sem máquina política, construída por gente comum que acredita que Mato Grosso pode ser mais seguro. Cada reforço, dentro das regras da legislação eleitoral, ajuda a manter essa missão de pé.",
    supportTrust:
      "Valores meramente ilustrativos · O apoio é feito pela **plataforma oficial apoiar.me/sargentocasarin**, conforme a legislação eleitoral.",
    comeceTitle: "Comece agora",
    comeceText: "O primeiro passo é entrar para a rede de apoiadores.",
  },
  midias: {
    heroEyebrow: "Comunicação",
    heroTitle: "NOSSOS *CANAIS*",
    heroLead:
      "Siga o Sargento Casarin nas redes e acompanhe a missão de perto. Os perfis oficiais serão listados nesta página.",
    canais: [
      { icon: "📷", name: "Instagram", handle: "@sargentocasarin", href: "https://www.instagram.com/sargentocasarin" },
      { icon: "🧵", name: "Threads", handle: "@sargentocasarin", href: "https://www.threads.com/@sargentocasarin" },
      { icon: "📘", name: "Facebook", handle: "/sargentocasarin", href: "https://www.facebook.com/sargentocasarin" },
      { icon: "🎵", name: "TikTok", handle: "@sargentocasarin", href: "https://www.tiktok.com/@sargentocasarin" },
      { icon: "▶️", name: "YouTube", handle: "Canal oficial em breve", href: "https://youtube.com" },
      { icon: "✖️", name: "X (Twitter)", handle: "Perfil oficial em breve", href: "https://twitter.com" },
    ],
    ctaTitle: "Não perca nenhuma novidade",
    ctaText: "Entre nos nossos grupos e receba os conteúdos direto no seu WhatsApp.",
  },
  contato: {
    heroEyebrow: "Canal direto",
    heroTitle: "SEJA UM *APOIADOR*",
    heroLead:
      "Sua participação é fundamental. Preencha o formulário abaixo para se tornar um apoiador, enviar sugestões ou conversar com a nossa equipe.",
    baseLabel: "Base",
    baseValue: "Cuiabá, Mato Grosso — Brasil",
    emailLabel: "E-mail",
    emailValue: "atendimento@sargentocasarinmt.com.br",
    whatsLabel: "WhatsApp",
    whatsValue: "Em breve — os canais oficiais serão divulgados aqui",
    formTitle: "Envie sua mensagem",
    formText: "Responderemos pelo e-mail ou WhatsApp informado.",
  },
  legal: {
    privacidade: {
      eyebrow: "LGPD",
      title: "POLÍTICA DE *PRIVACIDADE*",
      lead: "Transparência total sobre como coletamos, usamos e protegemos os seus dados.",
      body: `## 1. Quem somos

Este site é o canal institucional da campanha do Sargento Dickson Casarin, candidato a Deputado Estadual por Mato Grosso. Ao usar o site, você concorda com os termos desta política, elaborada em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

## 2. Dados que coletamos

- Dados fornecidos por você nos formulários: nome, e-mail, telefone/WhatsApp, cidade e mensagem.
- Dados de navegação coletados automaticamente: endereço IP, tipo de navegador e páginas visitadas, quando aplicável.

## 3. Finalidade do tratamento

- Responder às mensagens enviadas pelos canais de contato.
- Enviar comunicações da campanha (novidades, eventos e mobilizações) a quem se cadastrou voluntariamente.
- Organizar a rede de apoiadores por região.

## 4. Base legal

O tratamento é realizado com base no **consentimento** (art. 7º, I, da LGPD), manifestado no momento do cadastro. Você pode revogar o consentimento a qualquer momento.

## 5. Compartilhamento

Os seus dados não são vendidos nem compartilhados com terceiros para fins comerciais. Eles são acessados apenas pela equipe da campanha e por fornecedores de tecnologia estritamente necessários à operação do site.

## 6. Seus direitos

- Confirmar a existência de tratamento dos seus dados.
- Acessar, corrigir ou atualizar os seus dados.
- Solicitar a exclusão dos dados e a revogação do consentimento.
- Solicitar a portabilidade, nos termos da lei.

Para exercer qualquer um desses direitos, escreva para [atendimento@sargentocasarinmt.com.br](mailto:atendimento@sargentocasarinmt.com.br).

## 7. Cookies

O site pode utilizar cookies essenciais ao seu funcionamento e, mediante consentimento, cookies de medição de audiência. Você pode desativá-los nas configurações do seu navegador.

## 8. Segurança e retenção

Adotamos medidas técnicas e organizacionais para proteger os dados. As informações são mantidas apenas pelo tempo necessário às finalidades desta política ou até a revogação do consentimento.

## 9. Alterações

Esta política pode ser atualizada a qualquer momento. A versão vigente estará sempre disponível nesta página.`,
    },
    termos: {
      eyebrow: "Regras de engajamento",
      title: "TERMOS DE *USO*",
      lead: "",
      body: `## 1. Aceitação

Ao acessar este site, você concorda com estes Termos de Uso e com a [Política de Privacidade](/privacidade). Se não concordar, interrompa o uso do site.

## 2. Finalidade do site

Este é um site institucional de campanha, destinado a divulgar a trajetória, as propostas e os canais de participação do Sargento Dickson Casarin, candidato a Deputado Estadual por Mato Grosso.

## 3. Uso adequado

- Não utilize o site para fins ilícitos ou para enviar conteúdo ofensivo.
- Não tente burlar mecanismos de segurança ou coletar dados de terceiros.
- Forneça apenas informações verdadeiras nos formulários.

## 4. Propriedade intelectual

Textos, marcas, fotos e demais conteúdos deste site pertencem à campanha ou a seus licenciantes. O compartilhamento para fins de divulgação é incentivado, desde que sem alteração de contexto.

## 5. Responsabilidade

Trabalhamos para manter as informações corretas e o site disponível, mas não garantimos operação ininterrupta. Links para sites de terceiros são de responsabilidade dos respectivos titulares.

## 6. Alterações

Estes termos podem ser atualizados a qualquer momento. A versão vigente estará sempre disponível nesta página.`,
    },
    cookies: {
      eyebrow: "Cookies",
      title: "POLÍTICA DE *COOKIES*",
      lead: "Transparência sobre os cookies deste site: o que são, quais utilizamos e como você controla o seu uso.",
      body: `## 1. O que são cookies

Cookies são pequenos arquivos de texto que o site armazena no seu navegador quando você o visita. Eles servem para que as páginas funcionem corretamente, lembrem preferências e, quando autorizado, ajudem a entender como o site é utilizado. Cookies não executam programas e não transmitem vírus.

## 2. Tipos de cookies que utilizamos

- **Essenciais:** necessários ao funcionamento básico do site, como segurança, navegação entre páginas e envio de formulários. Sem eles o site não opera adequadamente e, por isso, não dependem de consentimento.
- **Funcionais:** guardam preferências e escolhas feitas por você para melhorar a experiência de navegação.
- **De medição de audiência:** ajudam a entender de forma agregada como os visitantes usam o site. Estes só são ativados **mediante o seu consentimento**.

## 3. Finalidade

Utilizamos cookies para manter o site seguro e estável, viabilizar o envio de mensagens e cadastros, lembrar preferências e, apenas com a sua autorização, medir a audiência das páginas para aprimorar o conteúdo da campanha.

## 4. Como gerenciar e desativar

Você pode gerenciar, bloquear ou apagar cookies diretamente nas configurações do seu navegador. A maioria dos navegadores (Chrome, Firefox, Safari, Edge) permite recusar cookies ou ser avisado antes de armazená-los, geralmente na seção de privacidade ou segurança das configurações. Ao desativar cookies essenciais, algumas funções do site podem deixar de funcionar.

## 5. Consentimento

Ao acessar o site, um banner informa sobre o uso de cookies e coleta o seu consentimento para as categorias não essenciais, como a medição de audiência. O consentimento é livre e pode ser **revisto ou revogado** a qualquer momento, seja pelo próprio banner, seja limpando os cookies no navegador.

## 6. Base legal

O uso de cookies não essenciais tem como base legal o **consentimento** do titular (art. 7º, I, da Lei nº 13.709/2018 — LGPD). Os cookies essenciais fundamentam-se no legítimo interesse de garantir o funcionamento seguro do site.

## 7. Alterações

Esta Política de Cookies pode ser atualizada a qualquer momento para refletir mudanças no site ou na legislação. A versão vigente estará sempre disponível nesta página. Última atualização: agosto de 2026.

## 8. Contato

Em caso de dúvidas sobre esta política, escreva para [atendimento@sargentocasarinmt.com.br](mailto:atendimento@sargentocasarinmt.com.br).`,
    },
    lgpd: {
      eyebrow: "Proteção de Dados",
      title: "PORTAL *LGPD*",
      lead: "O nosso compromisso com a proteção dos seus dados pessoais e um canal claro para você exercer os seus direitos.",
      body: `## 1. Nosso compromisso

A campanha do Sargento Dickson Casarin, candidato a Deputado Estadual por Mato Grosso, trata os dados pessoais com respeito, transparência e segurança, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). Este portal reúne, de forma objetiva, os seus direitos e a forma de exercê-los.

## 2. Direitos do titular

Nos termos do art. 18 da LGPD, você, como titular dos dados, pode solicitar a qualquer momento:

- Confirmação da existência de tratamento dos seus dados.
- Acesso aos dados que mantemos sobre você.
- Correção de dados incompletos, inexatos ou desatualizados.
- Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei.
- Portabilidade dos dados, nos termos da regulamentação.
- Eliminação dos dados tratados com base no consentimento.
- Informação sobre as entidades com as quais os dados eventualmente foram compartilhados.
- Revogação do consentimento a qualquer momento.

## 3. Como exercer os seus direitos

Para exercer qualquer um desses direitos, envie a sua solicitação para [atendimento@sargentocasarinmt.com.br](mailto:atendimento@sargentocasarinmt.com.br). Poderemos solicitar informações adicionais para confirmar a sua identidade e atenderemos ao pedido nos prazos previstos em lei.

## 4. Encarregado (DPO)

O atendimento às questões relacionadas à proteção de dados e ao encarregado pelo tratamento de dados pessoais (DPO) é realizado pelo mesmo canal: [atendimento@sargentocasarinmt.com.br](mailto:atendimento@sargentocasarinmt.com.br). Por esse endereço você pode encaminhar dúvidas, solicitações e comunicações sobre o tratamento dos seus dados.

## 5. Base legal

O tratamento dos dados fornecidos pelos formulários do site tem como principal base legal o **consentimento** do titular (art. 7º, I, da LGPD), manifestado no momento do cadastro e revogável a qualquer tempo.

## 6. Segurança e retenção

Adotamos medidas técnicas e organizacionais adequadas para proteger os dados contra acessos não autorizados e situações de perda, alteração ou destruição. Os dados são mantidos apenas pelo tempo necessário às finalidades informadas ou até a revogação do consentimento.

## 7. Relação com a Política de Privacidade

Este portal complementa a [Política de Privacidade](/privacidade), que detalha quais dados coletamos, com quais finalidades e como são tratados. Recomendamos a leitura de ambos os documentos.`,
    },
    regras: {
      eyebrow: "Comunidade",
      title: "REGRAS E *NORMAS*",
      lead: "As diretrizes de convivência que mantêm os nossos grupos e canais oficiais respeitosos, seguros e úteis para todos.",
      body: `## 1. Propósito destas regras

Estas Regras e Normas orientam a **conduta** de quem participa dos grupos e canais oficiais da campanha do Sargento Dickson Casarin, candidato a Deputado Estadual por Mato Grosso. Elas complementam os [Termos de Uso](/termos) do site, que tratam das condições jurídicas de uso da plataforma.

## 2. Canais oficiais

São canais oficiais os grupos de WhatsApp e os perfis em redes sociais divulgados neste site. Conteúdos, avisos e mobilizações compartilhados fora desses canais não têm garantia de autenticidade. Na dúvida, confirme sempre pelos canais indicados aqui.

## 3. Conduta esperada

Ao participar dos nossos grupos e canais, você se compromete a:

- Tratar todos com respeito, mesmo diante de opiniões divergentes.
- Não praticar discurso de ódio, racismo, discriminação, ameaças ou qualquer forma de ataque pessoal.
- Não divulgar desinformação (fake news), boatos ou conteúdo comprovadamente falso.
- Não enviar spam, correntes, propaganda de terceiros ou mensagens repetitivas fora de contexto.
- Não compartilhar conteúdo ilícito, ofensivo, obsceno ou que viole direitos de terceiros.
- Respeitar a privacidade dos demais participantes.

## 4. Moderação e remoção de conteúdo

A equipe da campanha pode moderar as interações, remover conteúdos que violem estas regras e, quando necessário, advertir ou remover participantes dos grupos e canais oficiais. A moderação visa proteger a comunidade e manter um ambiente saudável, sem prejuízo do debate legítimo de ideias.

## 5. Uso da marca e da imagem do candidato

O nome, a marca, os símbolos e as imagens do Sargento Dickson Casarin e da campanha não podem ser usados de forma a sugerir apoio, autorização ou representação oficial sem consentimento. O compartilhamento dos materiais oficiais para fins de divulgação é incentivado, desde que sem alteração de contexto ou de sentido.

## 6. Doações e apoio

Toda arrecadação segue rigorosamente a legislação eleitoral e ocorre apenas pela plataforma oficial [apoiar.me/sargentocasarin](https://apoiar.me/sargentocasarin). Desconfie de qualquer pedido de dinheiro feito em nome da campanha fora desse canal oficial.

## 7. Dúvidas e contato

Em caso de dúvidas sobre estas regras ou para relatar condutas inadequadas nos canais oficiais, fale com a nossa equipe pelo e-mail [atendimento@sargentocasarinmt.com.br](mailto:atendimento@sargentocasarinmt.com.br). Estas regras podem ser atualizadas a qualquer momento; a versão vigente estará sempre disponível nesta página. Última atualização: agosto de 2026.`,
    },
  },
};

// ------------------------------------------------------------ coerção defensiva
const str = (v: unknown, fb: string): string => (typeof v === "string" ? v : fb);
const strArr = (v: unknown, fb: string[]): string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : fb;

function coerce(raw: unknown): SiteContentData {
  const d = DEFAULT_CONTENT;
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sec = (k: string) =>
    (o[k] && typeof o[k] === "object" ? o[k] : {}) as Record<string, unknown>;
  const why = sec("why");
  const bio = sec("bio");
  const traj = sec("trajetoria");
  const com = sec("comenda");
  const creds = sec("creds");
  const steps = Array.isArray(traj.steps)
    ? (traj.steps as unknown[])
        .map((s) => {
          const st = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
          return {
            label: str(st.label, ""),
            title: str(st.title, ""),
            text: str(st.text, ""),
          };
        })
        .filter((s) => s.title || s.text)
    : d.trajetoria.steps;
  const man = sec("manifesto");
  const stats = Array.isArray(man.stats)
    ? (man.stats as unknown[])
        .map((s) => {
          const st = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
          return { value: str(st.value, ""), label: str(st.label, "") };
        })
        .filter((s) => s.value || s.label)
    : d.manifesto.stats;
  const home = sec("home");
  const creds3 = Array.isArray(home.creds)
    ? (home.creds as unknown[])
        .map((c) => {
          const ci = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
          return { num: str(ci.num, ""), title: str(ci.title, ""), text: str(ci.text, "") };
        })
        .filter((c) => c.num || c.title || c.text)
    : d.home.creds;
  const tropa = sec("tropa");
  const ajudar = sec("ajudar");
  const ajCards = Array.isArray(ajudar.cards)
    ? (ajudar.cards as unknown[])
        .map((c) => {
          const ci = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
          return { icon: str(ci.icon, ""), title: str(ci.title, ""), text: str(ci.text, "") };
        })
        .filter((c) => c.title || c.text)
    : d.ajudar.cards;
  const midias = sec("midias");
  const canais = Array.isArray(midias.canais)
    ? (midias.canais as unknown[])
        .map((c) => {
          const ci = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
          return {
            icon: str(ci.icon, ""),
            name: str(ci.name, ""),
            handle: str(ci.handle, ""),
            href: str(ci.href, ""),
          };
        })
        .filter((c) => c.name)
    : d.midias.canais;
  const contato = sec("contato");
  const legalRaw = sec("legal");
  const legalPage = (k: keyof SiteContentData["legal"]): LegalPage => {
    const p = (legalRaw[k] && typeof legalRaw[k] === "object"
      ? legalRaw[k]
      : {}) as Record<string, unknown>;
    const dp = d.legal[k];
    return {
      eyebrow: str(p.eyebrow, dp.eyebrow),
      title: str(p.title, dp.title),
      lead: str(p.lead, dp.lead),
      body: str(p.body, dp.body),
    };
  };
  return {
    why: {
      caption: str(why.caption, d.why.caption),
      eyebrow: str(why.eyebrow, d.why.eyebrow),
      paragraphs: strArr(why.paragraphs, d.why.paragraphs),
      targets: strArr(why.targets, d.why.targets),
    },
    bio: {
      eyebrow: str(bio.eyebrow, d.bio.eyebrow),
      title: str(bio.title, d.bio.title),
      paragraphs: strArr(bio.paragraphs, d.bio.paragraphs),
      quote: str(bio.quote, d.bio.quote),
      closing: str(bio.closing, d.bio.closing),
    },
    trajetoria: { steps: steps.length ? steps : d.trajetoria.steps },
    comenda: {
      eyebrow: str(com.eyebrow, d.comenda.eyebrow),
      title: str(com.title, d.comenda.title),
      desc: str(com.desc, d.comenda.desc),
      meta: str(com.meta, d.comenda.meta),
    },
    creds: {
      formacao: strArr(creds.formacao, d.creds.formacao),
      profissional: strArr(creds.profissional, d.creds.profissional),
      honrarias: strArr(creds.honrarias, d.creds.honrarias),
    },
    manifesto: {
      eyebrow: str(man.eyebrow, d.manifesto.eyebrow),
      titleLine1: str(man.titleLine1, d.manifesto.titleLine1),
      titleEm: str(man.titleEm, d.manifesto.titleEm),
      titleLine2: str(man.titleLine2, d.manifesto.titleLine2),
      paragraphs: strArr(man.paragraphs, d.manifesto.paragraphs),
      stats: stats.length ? stats : d.manifesto.stats,
    },
    home: {
      heroEyebrow: str(home.heroEyebrow, d.home.heroEyebrow),
      heroName: str(home.heroName, d.home.heroName),
      heroSubtitle: str(home.heroSubtitle, d.home.heroSubtitle),
      heroLead: str(home.heroLead, d.home.heroLead),
      ribbon1: str(home.ribbon1, d.home.ribbon1),
      ribbon2: str(home.ribbon2, d.home.ribbon2),
      creds: creds3.length ? creds3 : d.home.creds,
      comendaEyebrow: str(home.comendaEyebrow, d.home.comendaEyebrow),
      comendaTitle: str(home.comendaTitle, d.home.comendaTitle),
      comendaMeta: str(home.comendaMeta, d.home.comendaMeta),
      propostasEyebrow: str(home.propostasEyebrow, d.home.propostasEyebrow),
      propostasTitle1: str(home.propostasTitle1, d.home.propostasTitle1),
      propostasTitle2: str(home.propostasTitle2, d.home.propostasTitle2),
      marquee: strArr(home.marquee, d.home.marquee),
      ctaEyebrow: str(home.ctaEyebrow, d.home.ctaEyebrow),
      ctaTitle1: str(home.ctaTitle1, d.home.ctaTitle1),
      ctaTitle2: str(home.ctaTitle2, d.home.ctaTitle2),
      ctaLead: str(home.ctaLead, d.home.ctaLead),
    },
    tropa: {
      heroTitle: str(tropa.heroTitle, d.tropa.heroTitle),
      heroLead: str(tropa.heroLead, d.tropa.heroLead),
      formTitle: str(tropa.formTitle, d.tropa.formTitle),
      formText: str(tropa.formText, d.tropa.formText),
    },
    ajudar: {
      heroEyebrow: str(ajudar.heroEyebrow, d.ajudar.heroEyebrow),
      heroTitle: str(ajudar.heroTitle, d.ajudar.heroTitle),
      heroLead: str(ajudar.heroLead, d.ajudar.heroLead),
      legalAlert: str(ajudar.legalAlert, d.ajudar.legalAlert),
      cards: ajCards.length ? ajCards : d.ajudar.cards,
      supportEyebrow: str(ajudar.supportEyebrow, d.ajudar.supportEyebrow),
      supportTitle: str(ajudar.supportTitle, d.ajudar.supportTitle),
      supportLead: str(ajudar.supportLead, d.ajudar.supportLead),
      supportTrust: str(ajudar.supportTrust, d.ajudar.supportTrust),
      comeceTitle: str(ajudar.comeceTitle, d.ajudar.comeceTitle),
      comeceText: str(ajudar.comeceText, d.ajudar.comeceText),
    },
    midias: {
      heroEyebrow: str(midias.heroEyebrow, d.midias.heroEyebrow),
      heroTitle: str(midias.heroTitle, d.midias.heroTitle),
      heroLead: str(midias.heroLead, d.midias.heroLead),
      canais: canais.length ? canais : d.midias.canais,
      ctaTitle: str(midias.ctaTitle, d.midias.ctaTitle),
      ctaText: str(midias.ctaText, d.midias.ctaText),
    },
    contato: {
      heroEyebrow: str(contato.heroEyebrow, d.contato.heroEyebrow),
      heroTitle: str(contato.heroTitle, d.contato.heroTitle),
      heroLead: str(contato.heroLead, d.contato.heroLead),
      baseLabel: str(contato.baseLabel, d.contato.baseLabel),
      baseValue: str(contato.baseValue, d.contato.baseValue),
      emailLabel: str(contato.emailLabel, d.contato.emailLabel),
      emailValue: str(contato.emailValue, d.contato.emailValue),
      whatsLabel: str(contato.whatsLabel, d.contato.whatsLabel),
      whatsValue: str(contato.whatsValue, d.contato.whatsValue),
      formTitle: str(contato.formTitle, d.contato.formTitle),
      formText: str(contato.formText, d.contato.formText),
    },
    legal: {
      privacidade: legalPage("privacidade"),
      termos: legalPage("termos"),
      cookies: legalPage("cookies"),
      lgpd: legalPage("lgpd"),
      regras: legalPage("regras"),
    },
  };
}

// Lê o conteúdo do banco (registro único). Falha de I/O ou linha inexistente →
// DEFAULT_CONTENT (o site nunca quebra por causa disso).
export async function getSiteContent(): Promise<SiteContentData> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { id: "main" } });
    if (!row) return DEFAULT_CONTENT;
    return coerce(row.data);
  } catch {
    return DEFAULT_CONTENT;
  }
}

// Renderiza um texto com **negrito** em markdown simples como ReactNode.
export function renderRich(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    return m ? <strong key={i}>{m[1]}</strong> : <Fragment key={i}>{part}</Fragment>;
  });
}

// Renderiza um TÍTULO: quebra de linha por \n (→ <br>) e *destaque* (→ <em>, a
// palavra colorida do design). Usado nos headings editáveis das páginas.
export function renderHeading(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, li) => (
    <Fragment key={li}>
      {line.split(/(\*[^*]+\*)/g).map((part, pi) => {
        const m = part.match(/^\*([^*]+)\*$/);
        return m ? <em key={pi}>{m[1]}</em> : <Fragment key={pi}>{part}</Fragment>;
      })}
      {li < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

// Inline de markdown simples: **negrito** e [texto](url). Links http(s) abrem em
// nova aba; mailto/internos (/rota) abrem normalmente.
function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    const b = tok.match(/^\*\*([^*]+)\*\*$/);
    if (b) {
      parts.push(<strong key={k++}>{b[1]}</strong>);
    } else {
      const l = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (l) {
        const ext = /^https?:\/\//.test(l[2]);
        parts.push(
          <a key={k++} href={l[2]} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {l[1]}
          </a>,
        );
      } else {
        parts.push(<Fragment key={k++}>{tok}</Fragment>);
      }
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return parts;
}

// Renderiza um corpo em markdown simples (páginas legais): `## título` → h2,
// linhas `- item` → <ul>, blocos separados por linha em branco → <p>. Inline via
// renderInline (**negrito** e [links](url)).
export function renderLegalBody(md: string): ReactNode {
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={blocks.length}>{renderInline(para.join(" "))}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      const items = list;
      blocks.push(
        <ul key={blocks.length}>
          {items.map((it, k) => (
            <li key={k}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (line === "") {
      flushPara();
      flushList();
    } else if (line.startsWith("## ")) {
      flushPara();
      flushList();
      blocks.push(<h2 key={blocks.length}>{line.slice(3)}</h2>);
    } else if (line.startsWith("- ")) {
      flushPara();
      list.push(line.slice(2));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}
