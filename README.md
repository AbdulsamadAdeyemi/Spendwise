# SpendWise

SpendWise is a personal finance tracker with a React/Vite frontend, an Express API, JWT authentication, and Neon PostgreSQL storage.

## Project structure

- `src/` — React frontend
- `api/index.js` — Vercel serverless entry point
- `backend/src/` — Express API, authentication, database access and migrations
- `backend/test/` — backend tests
- `neon.ts` — Neon project configuration

## Local development

1. Install dependencies: `npm ci`
2. Copy `backend/.env.example` to `backend/.env` and configure `DATABASE_URL` and `JWT_SECRET`.
3. Apply schema: `npm run migrate`
4. Run the API: `npm start`
5. In another terminal run `npm run dev`.

## Vercel deployment

The repository root is the Vercel project root. Vercel builds the frontend to `dist/` and routes `/api/*` to `api/index.js`.

Set these server-side environment variables in Vercel for Production (and Preview if needed):

- `DATABASE_URL` — Neon pooled PostgreSQL connection string
- `JWT_SECRET` — a strong random secret (at least 32 characters)
- `NODE_ENV` — `production`
- `CLIENT_URL` — the deployed SpendWise origin

Never commit `.env` files or paste secrets into source code.

## Verification

- `npm run build`
- `npm run lint`
- `npm run test:backend`
