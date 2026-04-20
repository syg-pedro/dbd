# DBD Demandas

PWA em Nuxt 3 para capturar, organizar e executar demandas de design com Supabase e Vercel.

## Stack

- Nuxt 3 / Vue 3 / TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Storage e RLS
- PWA via `@vite-pwa/nuxt`
- Deploy estatico na Vercel

## Rodando localmente

1. Instale dependencias:

```bash
npm install
```

2. Crie `.env` a partir de `.env.example`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-publishable-key
```

3. Execute a migration em `supabase/migrations/20260420000000_initial_schema.sql` no SQL Editor do Supabase ou via Supabase CLI.

4. Para criar usuario sem confirmar e-mail, abra o painel do Supabase e desative a confirmacao em `Authentication > Providers > Email > Confirm email`. Com isso, o cadastro no app entra automaticamente.

5. Suba o app:

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run test
npm run build
npm run generate
```

## Deploy na Vercel

Configure as variaveis `SUPABASE_URL` e `SUPABASE_KEY` no projeto Vercel. O `vercel.json` usa `npm run generate` e publica `.output/public`.

## Atalhos

- `Ctrl+N`: nova demanda
- `Ctrl+K`: busca rapida

## Banco

O schema usa RLS em todas as tabelas do app. Toda linha pertence ao usuario autenticado por `owner_id = auth.uid()`.
