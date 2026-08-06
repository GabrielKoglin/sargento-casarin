# Deploy em produção

## Pré-requisitos e variáveis de ambiente

O arquivo `.env` é ignorado pelo Git. Cadastre estas variáveis no ambiente de produção (por exemplo, em **Vercel > Project > Settings > Environment Variables**) e mantenha seus valores fora do repositório:

| Variável | Finalidade |
| --- | --- |
| `AUTH_SECRET` | Segredo usado para assinar os JWTs da sessão administrativa. Gere um valor forte, por exemplo: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. |
| `CRON_SECRET` | Segredo da rota de ingestão agendada de notícias. Gere outro valor aleatório e independente do `AUTH_SECRET`. |
| `DATABASE_URL` | URL de conexão do banco usada pelo Prisma. No desenvolvimento atual é SQLite (`file:./dev.db`). |
| `ADMIN_EMAIL` | E-mail do administrador inicial. |
| `ADMIN_PASSWORD` | Senha forte do administrador inicial; nunca use o padrão de desenvolvimento. |
| `ADMIN_NAME` | Nome exibido para o administrador inicial. |
| `ANTHROPIC_API_KEY` | **Opcional.** Ativa o assistente de IA (Claude) em `/api/chat`. SEM a chave, o assistente funciona em modo curado (respostas seguras pré-aprovadas, sem custo). COM a chave, usa o Claude Haiku com guarda-corpos. Obtenha em console.anthropic.com. Atenção: tem custo por mensagem — considere isso num site público. |

## Cron de notícias

O [`vercel.json`](./vercel.json) agenda `GET /api/cron/ingest-news` em `0 */6 * * *` (a cada seis horas, em UTC). Cron Jobs da Vercel executam somente em deployments de produção.

Defina `CRON_SECRET` no ambiente **Production** do projeto Vercel. A Vercel envia `Authorization: Bearer $CRON_SECRET` para Cron Jobs quando essa variável está configurada, que é a forma preferida e compatível com a validação da rota. Para teste manual, envie esse mesmo header; a rota também aceita `?secret=<CRON_SECRET>` apenas como fallback, mas não use a query string em produção porque segredos podem aparecer em URLs e logs. A rota atual não confia em `x-vercel-cron` isoladamente.

## Passos de publicação

1. Instale dependências: `npm ci`.
2. Configure as variáveis acima no ambiente que acessa o banco de produção.
3. Aplique o schema: `npx prisma db push` (ou `npm run db:push`).
4. Se quiser carregar as propostas iniciais, execute `npm run db:seed`.
5. Crie/atualize o usuário administrativo: `npm run create-admin`.
6. Valide o artefato com `npm run build` e faça o deploy de produção (`vercel --prod` ou integração Git da Vercel).

## Atenção: banco de dados na Vercel

O projeto usa SQLite local com `better-sqlite3`. Um arquivo SQLite não é persistente em funções serverless da Vercel; portanto, esse modo não é adequado para produção real na Vercel. Antes de publicar de verdade, migre o banco para PostgreSQL (por exemplo, Prisma Postgres, Neon ou Supabase) ou adote Turso/libSQL e ajuste Prisma/adapter; esta documentação não executa essa migração.

Pelo mesmo motivo, os **uploads de mídia** (a guia Mídia grava arquivos em `public/uploads` via `sharp`/`writeFile`) **também não persistem** em ambiente serverless: o filesystem é efêmero e read-only fora de `/tmp`, então as imagens somem entre deploys/instâncias. Para produção real, use um storage externo (por exemplo, **Vercel Blob** ou **S3**) e grave a URL pública no banco, em vez do disco local.

## Placeholders para trocar antes de publicar

- Domínio: substitua `https://sargentocasarin.com.br` pelo domínio definitivo em `src/app/layout.tsx` (`metadataBase` e Open Graph URL), `src/app/sitemap.ts` e `src/app/robots.ts`.
- Redes sociais: troque os links genéricos de Instagram, Facebook, X e YouTube em `src/components/layout/footer.tsx` e `src/app/midias/page.tsx` pelos canais oficiais.
- E-mail de contato: substitua `contato@sargentocasarin.com.br` em `src/app/contato/page.tsx` e `src/app/privacidade/page.tsx` pelo e-mail oficial.
- Grupos de WhatsApp: substitua os links de convite de exemplo em `src/app/tropa/page.tsx` pelos links oficiais por região.

## Configuração Next.js

`next.config.ts` não precisou de alteração. As imagens de notícias vêm de hosts arbitrários e a página usa `<img>` de propósito; adicionar `images.remotePatterns` seria incompleto e não traz benefício sem uma lista fixa de hosts confiáveis.
