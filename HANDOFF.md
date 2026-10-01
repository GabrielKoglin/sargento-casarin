# 📒 HANDOFF — Site Sargento Casarin (guia de retomada)

> Documento-mestre para **continuar o projeto do zero** (ex.: depois de formatar
> a máquina / trocar de disco). Tudo que é essencial está aqui. Mantido no Git,
> então sobrevive à formatação. Última atualização: **2026-09-28**.

---

## 🚨 0. ANTES DE FORMATAR — o que o Git NÃO guarda

O GitHub tem **todo o código**, mas **NÃO** tem estes itens (ignorados de
propósito). Faça backup manual antes de formatar:

| Item | Onde está | Como salvar |
| --- | --- | --- |
| **`.env`** (segredos: banco, Supabase, AUTH_SECRET…) | raiz do projeto | Copie o arquivo para pen drive / Google Drive / gerenciador de senhas |
| `node_modules/` | raiz | Não precisa — `npm install` recria |
| `.next/` | raiz | Não precisa — build recria |

👉 **O único insubstituível é o `.env`.** Sem ele, o app não conecta no banco.
Se perder, dá pra recriar pegando os valores no painel do **Supabase** e na
**Vercel** (Settings > Environment Variables) — mas é muito mais fácil só copiar.

---

## ✅ 1. CHECKLIST PÓS-FORMATAÇÃO (voltar a rodar)

1. Instalar **Node.js 20 LTS ou 22** (o projeto roda em Next 16 / React 19) e **Git**.
2. (Opcional) VS Code.
3. Clonar o repositório:
   ```bash
   git clone https://github.com/GabrielKoglin/sargento-casarin.git
   cd sargento-casarin
   ```
4. Restaurar o **`.env`** (do backup) na raiz. Se não tiver, copie o
   `.env.example` para `.env` e preencha com os valores do Supabase/Vercel.
5. Instalar dependências:
   ```bash
   npm install
   ```
   (o `postinstall` roda `prisma generate` automaticamente)
6. Rodar local:
   ```bash
   npm run dev
   ```
   Abrir **http://localhost:3000**.
7. Pronto. Para publicar mudanças: `git push origin main` → deploy automático na Vercel.

---

## 🧭 2. Visão geral

Site de campanha do **Sargento Dickson Casarin** (candidato a Deputado Estadual
por Mato Grosso, nº **20190**, Podemos).

- **Produção:** https://www.sargentocasarinmt.com.br
- **Repositório:** https://github.com/GabrielKoglin/sargento-casarin
- **Deploy:** Vercel (integração Git — push na `main` publica produção)
- **Banco/Storage:** Supabase (Postgres + Storage de imagens)

### Stack
| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js **16.3** (App Router, Turbopack) |
| UI | React **19.2**, Tailwind **4** |
| Banco | PostgreSQL (Supabase) via **Prisma 7** (adapter `pg`) |
| Auth | Sessão JWT (`jose`) + `bcryptjs` + **MFA/TOTP** (`otplib`) |
| Extras | `rss-parser` (ingestão de notícias), `sharp` (imagens), IA opcional em `/api/chat` |

---

## ⚙️ 3. Variáveis de ambiente

Nomes (detalhes e placeholders em **`.env.example`**). **Valores reais só no `.env`**:

`DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`AUTH_SECRET`, `CRON_SECRET`, `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD`,
`ANTHROPIC_API_KEY` (opcional).

> ⚠️ O `.env` local aponta para o banco de **PRODUÇÃO** (Supabase). Logo,
> `prisma db push` e scripts de insert rodam **contra produção**. Mudanças de
> schema aditivas/nulas são seguras; inserts aparecem no site na hora.

---

## 🗄️ 4. Banco de dados (Prisma + Supabase)

- Schema: `prisma/schema.prisma`. Modelos: `User`, `Proposal`, `News`, `Media`,
  `Event`, `Contact`, `StickerRequest`, `Leader`, `SiteContent`, `Settings`.
- Aplicar mudança de schema: `npx prisma db push` (usa `DIRECT_URL`).
- Regerar o client: `npx prisma generate` (gera em `src/generated/prisma`).
- Popular propostas iniciais (opcional): `npm run db:seed`.
- Criar/atualizar admin: `npm run create-admin` (lê `ADMIN_*` do `.env`).

---

## 🚀 5. Deploy

- **Push na `main`** → a Vercel builda e publica produção automaticamente.
  Não há `.vercel` linkado localmente (deploy é via Git, não via CLI).
- Antes de deploys grandes, validar com `npm run build` (pare o `npm run dev`
  antes, pra não conflitar o `.next`).
- Cron de notícias: `vercel.json` agenda `GET /api/cron/ingest-news` a cada 6h
  (só roda em produção; exige `CRON_SECRET`).

---

## 📁 6. Estrutura (resumo)

```
src/app/                     # rotas (App Router)
  page.tsx                   # home
  noticias/                  # lista pública + [slug] (matéria de autoria)
  propostas/ (+ [slug])      # propostas + página detalhada
  agenda/ midias/ sobre/ tropa/ adesivos/ ajudar/ contato/ manifesto/
  (legais) privacidade/ termos/ cookies/ lgpd/ regras/
  admin/                     # painel (login + área logada)
    (app)/                   # rotas protegidas (layout com guarda de sessão)
      noticias/ propostas/ agenda/ midia/ equipe/ apoiadores/
      adesivos/ mensagens/ conteudo/ config/ seguranca/ (MFA)
  api/chat/                  # assistente de IA
  api/cron/ingest-news/      # ingestão agendada dos feeds
src/components/              # header, footer, mapa MT, modais, rich-text, etc.
src/lib/                     # prisma, session, permissions, mfa, password,
                             # news-ingest, news-sources, image-upload, storage,
                             # site-content
prisma/                      # schema.prisma, seed.ts
scripts/                     # create-admin, ingest-news, backfill-news-images,
                             # promote-owners, prune-pending
```

---

## 📰 7. Notícias — como funciona

Dois tipos de notícia convivem (model `News`):

1. **Agregadas (automáticas):** ingeridas de ~28 portais de MT + Google News
   (`src/lib/news-sources.ts`). Filtro de relevância (cita o candidato) em
   `src/lib/news-ingest.ts`. Nascem `status: "pending"` → precisam ser
   **aprovadas no painel** para ir ao ar. Ingestão a cada 6h (Vercel Cron) ou
   pelo botão "Buscar notícias agora".
2. **Matérias de autoria própria (nossas):** têm o campo `content` preenchido.
   Ganham **página no site** (`/noticias/[slug]`), card com selo **"★ Matéria"**
   e byline **"Por <autor>"**. Criadas no painel nascem `approved` (vão ao ar na hora).

### Separação (feita nesta campanha)
- **Site `/noticias`:** duas seções — "Da campanha / Nossas Matérias" (as nossas)
  e "Cobertura da mídia / Na Imprensa" (as automáticas).
- **Painel `/admin/noticias`:** aba dedicada **"Matérias próprias"**; as abas
  Pendentes/Aprovadas/Rejeitadas mostram só os feeds; "Todas" mostra tudo.

### Como publicar uma matéria de autoria (painel)
`/admin/noticias` → **Nova notícia**:
1. **Título**
2. **Fonte / selo do card** → `Sargento Casarin`
3. **Autoria** → nome de quem assina (ex.: `Fernanda Caso`) → vira "Por Fernanda Caso"
4. **Resumo** (aparece no card e como abertura)
5. **Texto completo da matéria** → cole o texto do Word. Linha em branco separa
   parágrafos; `## Subtítulo`, `**negrito**`, `- item de lista` funcionam.
6. **Foto da matéria (upload)** → envie a imagem (otimizada automaticamente) OU cole URL.
7. **Salvar** → vai ao ar na hora (nasce aprovada).

### Publicação em LOTE a partir de .docx (fluxo técnico usado nesta sessão)
1. Extrair texto do `.docx` com Python (`zipfile` + `word/document.xml`),
   preservando parágrafos, `**negrito**` e convertendo subtítulos curtos em `##`.
2. Montar JSON com `{title, slug, summary, author, source, content}` (dropar o
   eyebrow do topo e o bloco de assinatura do fim).
3. Inserir via script `tsx` usando `PrismaPg` (connectionString =
   `DIRECT_URL ?? DATABASE_URL`), `upsert` por slug, `status: "approved"`.
4. Padrão desta campanha: `author = "Fernanda Caso"`, `source = "Sargento Casarin"`.

---

## 🧰 8. Comandos de referência

```bash
npm run dev                 # servidor de desenvolvimento (localhost:3000)
npm run build               # build de produção (validar antes de deploy)
npm run start               # servir o build
npm run lint                # ESLint
npm run db:push             # aplica schema no banco (prisma db push)
npm run db:seed             # popula propostas iniciais
npm run create-admin        # cria/atualiza o admin (lê ADMIN_* do .env)
npm run ingest-news         # roda a ingestão de notícias manualmente
npm run backfill-news-images# re-hospeda imagens de notícias antigas
npx prisma generate         # regenera o Prisma Client
npx prisma studio           # abre o Prisma Studio (inspeção do banco)
```

---

## 🧠 9. Memória do assistente (para colar em outros terminais/IA)

> Fatos do projeto que não dá pra inferir só lendo o código. Cole isto na
> memória de qualquer assistente novo para ele já entrar no contexto.

### noticias-autoria-propria
O site suporta **matérias de autoria própria** além das notícias agregadas. Uma
`News` com `content` preenchido vira matéria NOSSA: página em `/noticias/[slug]`,
card com selo "★ Matéria", byline "Por <author>". Sem `content` = manchete
agregada (abre o portal externo). Convenções: autoria = **Fernanda Caso**
(jornalista, DRT 2340/MT); fonte/selo = **"Sargento Casarin"**; corpo em
mini-markdown (`##`, `**negrito**`, `- lista`, linha em branco separa parágrafos
— motor `@/components/rich-text`). Matéria criada no painel nasce `approved`.
Os `.docx` da Fernanda seguem: eyebrow curto → título (negrito) → linha-fina →
corpo → bloco de assinatura (Fernanda Caso / Assessoria / @ / telefone), que é
removido na importação.

### deploy-e-banco-producao
Deploy = `git push origin main` → Vercel builda/publica produção automaticamente
(sem `.vercel` local). Domínio: https://www.sargentocasarinmt.com.br. O `.env`
local aponta para o banco de **PRODUÇÃO** (Supabase, `aws-0-sa-east-1`):
`DATABASE_URL` = pooler (6543), `DIRECT_URL` = direta (5432). Qualquer
`prisma db push`/insert roda contra produção (aditivo/nulo é seguro; inserts
aparecem na hora, páginas são `force-dynamic`). Uploads de imagem vão para o
**Supabase Storage** (`@/lib/storage` + `@/lib/image-upload`), não para
`public/uploads` (efêmero em serverless). Validar com `npm run build` antes do
deploy (pare o `next dev` antes). Watcher do Turbopack no Windows às vezes não
pega edições — se servir versão antiga, `rm -rf .next` + reiniciar `npm run dev`.

---

## 🩹 10. Troubleshooting

- **Hot-reload servindo versão antiga (Windows/Turbopack):** `rm -rf .next` e
  reinicie `npm run dev`. Pare o dev antes de `npm run build` (conflito no `.next`).
- **`.env` ausente:** app não conecta no banco. Restaure do backup ou recrie do
  `.env.example` com valores do Supabase/Vercel.
- **Admin não loga:** rode `npm run create-admin` (com `ADMIN_*` no `.env`).
- **Matéria não vai ao ar:** confira se é de autoria (`content` preenchido) e
  `status: approved`. Agregadas precisam ser aprovadas no painel.

---

## 📝 11. Histórico recente (commits desta fase)

```
d9d74cd Admin/Noticias: aba dedicada 'Materias proprias' + moderacao so de feeds
35e88af Noticias: separa materias da campanha das automaticas (2 secoes)
752cea3 Noticias: materias de autoria propria (texto completo, autoria e upload de foto)
49e5200 Admin: permissoes por area (cada editor acessa so as secoes liberadas)
d15019a Noticias: imagens reais das materias (og:image + re-host no storage)
```

**Nesta sessão (setembro/2026):** criado o recurso de matérias de autoria própria
(texto completo + autoria + upload de foto), página `/noticias/[slug]`, separação
em 2 seções no site e aba "Matérias próprias" no painel. Publicadas **6 matérias**
da campanha (autoria Fernanda Caso).
