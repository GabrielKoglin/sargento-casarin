# Sargento Casarin — Site de Campanha

Site institucional do Sargento Dickson Casarin, candidato a Deputado Estadual por Mato Grosso (Eleições 2026).

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + design system tático próprio (`src/app/globals.css`)
- Prisma 7 + SQLite (driver adapter `better-sqlite3`)

## Como rodar

```bash
npm install
npm run db:push   # cria/sincroniza o banco local (dev.db)
npm run db:seed   # popula as propostas iniciais
npm run dev       # http://localhost:3000
```

O arquivo `.env` precisa conter:

```
DATABASE_URL="file:./dev.db"
```

## Estrutura

- `src/app/` — páginas (App Router): home, sobre, propostas, manifesto, notícias, agenda, galeria, tropa, contato, ajudar, mídias, privacidade, termos
- `src/app/actions.ts` — Server Action que grava os formulários (Tropa/Contato) no modelo `Contact`
- `src/components/` — Header/Footer, formulário, galeria e efeitos visuais (`tactical-fx.tsx`)
- `prisma/schema.prisma` — modelos de conteúdo (`Proposal`, `News`, `Event`, `Contact`, `Settings`, `User`)
- `src/generated/prisma/` — Prisma Client gerado (`npx prisma generate`)

## Conteúdo

Propostas, notícias e eventos vêm do banco (páginas dinâmicas). Ainda não há painel administrativo — para editar conteúdo use `npx prisma studio` ou ajuste o seed em `prisma/seed.ts`.

Itens marcados com `TODO`/`Placeholder` no código (redes sociais, e-mail, domínio) devem ser trocados pelos canais oficiais quando definidos.
