import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// Conteúdo inicial dos eixos de atuação — editável pelo painel futuramente.
// goals e benefits são listas serializadas com um item por linha.
const propostas = [
  {
    slug: "seguranca-publica",
    title: "Segurança Pública em primeiro lugar",
    category: "Segurança",
    description:
      "Mais estrutura, tecnologia e efetivo para a segurança de Mato Grosso, com quem conhece a linha de frente.",
    problem:
      "A população de Mato Grosso convive com a sensação de insegurança, enquanto as forças policiais enfrentam falta de estrutura, equipamentos defasados e efetivo reduzido.",
    objective:
      "Garantir que a segurança pública seja prioridade real no orçamento e nas leis estaduais, com investimento contínuo em estrutura, tecnologia e inteligência.",
    solution:
      "Atuar na Assembleia Legislativa por mais recursos para as forças de segurança, fiscalizar a aplicação do orçamento e propor leis que deem agilidade ao trabalho policial.",
    goals:
      "Ampliar o investimento em equipamentos e viaturas\nFortalecer a integração entre as forças de segurança\nLevar videomonitoramento e inteligência às regiões mais críticas",
    benefits:
      "Resposta policial mais rápida\nMais presença da polícia nas ruas\nRedução da criminalidade nas cidades do interior e na capital",
  },
  {
    slug: "valorizacao-dos-profissionais",
    title: "Valorização dos profissionais de segurança",
    category: "Segurança",
    description:
      "Quem protege a sociedade precisa de respeito, boas condições de trabalho e amparo à família.",
    problem:
      "Policiais e demais profissionais da segurança enfrentam sobrecarga, defasagem salarial e falta de amparo à saúde física e mental.",
    objective:
      "Defender a valorização da carreira, condições dignas de trabalho e atenção à saúde dos profissionais de segurança e de suas famílias.",
    solution:
      "Propor e apoiar projetos de valorização da carreira, programas de saúde mental para os profissionais da linha de frente e amparo às famílias.",
    goals:
      "Defender a recomposição salarial das carreiras de segurança\nCriar programa estadual de saúde mental para a tropa\nGarantir amparo às famílias de profissionais feridos em serviço",
    benefits:
      "Profissionais mais motivados e preparados\nMenos afastamentos por adoecimento\nMelhor atendimento à população",
  },
  {
    slug: "educacao-e-valores",
    title: "Educação com disciplina e valores",
    category: "Educação",
    description:
      "Escola que forma cidadãos de caráter, com disciplina, civismo e respeito à família.",
    problem:
      "A escola pública sofre com indisciplina, evasão e falta de perspectiva para os jovens, que ficam mais vulneráveis à criminalidade.",
    objective:
      "Fortalecer um modelo de educação que una qualidade de ensino, disciplina e valores, afastando os jovens do crime.",
    solution:
      "Apoiar a expansão das escolas cívico-militares no estado, programas de contraturno escolar e projetos de esporte e formação profissional para a juventude.",
    goals:
      "Ampliar o modelo cívico-militar nas escolas estaduais\nApoiar programas de esporte e contraturno\nAproximar escola, família e comunidade",
    benefits:
      "Jovens longe da criminalidade\nMelhores resultados de aprendizagem\nFamílias mais participativas na vida escolar",
  },
  {
    slug: "mato-grosso-forte",
    title: "Mato Grosso forte e desenvolvido",
    category: "Desenvolvimento",
    description:
      "Defender quem vive, trabalha e produz no estado que mais cresce no Brasil.",
    problem:
      "Mato Grosso é gigante na produção, mas ainda sofre com infraestrutura precária, burocracia e falta de apoio a quem produz e trabalha.",
    objective:
      "Apoiar o desenvolvimento econômico do estado, com infraestrutura, menos burocracia e respeito a quem produz.",
    solution:
      "Trabalhar por melhorias na infraestrutura e logística, pela simplificação de processos para quem empreende e pela defesa do produtor rural e do trabalhador mato-grossense.",
    goals:
      "Apoiar obras de infraestrutura e logística\nReduzir a burocracia para quem produz e empreende\nDefender o agronegócio e o pequeno produtor",
    benefits:
      "Mais empregos e renda\nEstradas e logística melhores\nEstado mais competitivo e justo com quem trabalha",
  },
];

async function main() {
  for (const p of propostas) {
    await prisma.proposal.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  const total = await prisma.proposal.count();
  console.log(`Seed concluído — ${total} propostas no banco.`);
}

main().finally(() => prisma.$disconnect());
