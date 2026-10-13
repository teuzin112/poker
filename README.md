# ♠ Home Game

Aplicação web para gerenciar os torneios de poker caseiros: jogadores, buy-ins, rebuys, divisão da premiação e ranking por lucro líquido. Feita para usar no celular durante o jogo.

## Funcionalidades

- **Torneios**: nome, data, local, buy-in, valor do rebuy e limite de rebuys por jogador.
- **Na mesa**: adicionar jogadores (cadastrados ou novos na hora), botões **+/−** de rebuy, pote e prévia da premiação atualizados em tempo real.
- **Premiação configurável por torneio**: cada posição recebe
  - `% do restante` do pote,
  - `N buy-ins` ou um `valor fixo`, pagos **antes** da divisão percentual.

  Padrão: **3º lugar recebe 1 buy-in**, e o restante vai **70% para o 1º e 30% para o 2º**.
  Ex.: pote de R$ 1.000 com buy-in de R$ 50 → 3º R$ 50; 1º R$ 665; 2º R$ 285.
- **Modelos de premiação** reutilizáveis (um deles é o padrão dos novos torneios).
- **Ranking** por lucro líquido (prêmios − buy-ins − rebuys), com filtro por ano, vitórias, ITM e ROI.
- **Histórico** de cada jogador.
- **Acesso**: qualquer pessoa com o link vê ranking e resultados; só quem tem a senha de admin edita.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma 7 + PostgreSQL · Vitest.
Valores em dinheiro são guardados em centavos.

## Rodando localmente

```bash
npm install
cp .env.example .env

# Postgres local (sem Docker): sobe um servidor e mostra a URL TCP
npx prisma dev --name poker --detach
# copie a URL "postgres://postgres:postgres@localhost:XXXXX/template1?sslmode=disable" para DATABASE_URL no .env
# defina ADMIN_PASSWORD e gere AUTH_SECRET com: openssl rand -hex 32

npm run db:migrate   # cria as tabelas
npm run db:seed      # cria o modelo de premiação "Padrão"
npm run dev          # http://localhost:3000
```

Para abrir no celular na mesma rede Wi-Fi: `npm run dev -- -H 0.0.0.0` e acesse `http://IP-DO-PC:3000`.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes da lógica de premiação e ranking |
| `npm run build` | build de produção |
| `npm run db:migrate` | cria/aplica migrations em dev |
| `npm run db:seed` | cria o modelo de premiação padrão |
| `npm run db:studio` | interface para ver/editar o banco |

## Deploy (Vercel + Neon, ambos gratuitos)

1. Importe este repositório na [Vercel](https://vercel.com).
2. Adicione a integração **Neon** (Storage → Neon, plano Free) ao projeto: ela cria o banco e configura `DATABASE_URL` / `DATABASE_URL_UNPOOLED`.
3. Em *Settings → Environment Variables*, defina `ADMIN_PASSWORD` e `AUTH_SECRET`.
4. Faça o deploy. O script `vercel-build` aplica as migrations e cria o modelo de premiação padrão automaticamente.

Cada push na branch `main` gera um novo deploy de produção.

Compartilhe o link com a galera; para editar, use **Entrar** com a senha de admin.

## Estrutura

```
prisma/schema.prisma        modelos: Player, Tournament, Entry, PrizeTemplate
src/lib/prize.ts            cálculo do pote e da premiação (funções puras)
src/lib/ranking.ts          agregação do ranking
src/lib/auth.ts             sessão de admin (cookie assinado)
src/app/actions/            Server Actions (todas exigem admin)
src/app/                    páginas: /, /ranking, /torneios, /jogadores, /configuracoes/premiacoes
src/components/             UI compartilhada (editor de premiação, formulários, tabelas)
```
