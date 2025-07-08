# Copilot Instructions for `queue-chat`

These curated notes help future AI agents navigate, build, and extend this repository. Keep entries factual and concise.

## Core NPM / CLI Commands

* `npm run dev` – Start Next.js dev server (Turbopack).
* `npm run build` – Production build.
* `npm run start` – Run compiled app.
* `npm run lint` – ESLint (extends `next/core-web-vitals`, `next/typescript`).
* Database (Prisma)
  * `npm run db:generate` – Generate typed Prisma client.
  * `npm run db:push` – Push schema to database (non-migrating).
  * `npm run db:migrate` – Create / run dev migration.
  * `npm run db:reset` – Drop & re-migrate; seeds via `prisma migrate reset`.
  * `npm run db:studio` – Prisma Studio at `http://localhost:5555`.
* No project-level `test` script exists yet. Add one before writing tests.

## High-Level Architecture

* Framework: **Next.js 15** (App Router) in **TypeScript** with **React 19**.
* Directory layout (top-level under `src/`):
  * `app/` – route handlers & server actions.
  * `components/` – UI components (chat, queue, markdown, etc.).
  * `hooks/` – React hooks, incl. `useChat` queue manager.
  * `integrations/` – Wrappers for external services (Mermaid, calendar, etc.).
  * `services/` – Server-side domain logic (OpenAI chat, transcription, conversation CRUD).
  * `lib/, utils/, types/` – shared helpers, typed contracts.
* Persistence: **PostgreSQL** accessed via **Prisma ORM** (`prisma/schema.prisma` defines `User`, `Conversation`, `Message`, `UserOAuthToken`).
* Auth / session: **Supabase** SSR helpers (`@supabase/ssr`, `/supabase/` client) + OAuth token table above.
* External APIs:
  * **OpenAI** (`openai` npm) for prompt optimisation and completion.
  * Optional calendar & diagram generation services found in `src/integrations`.

## Style & Code Quality Rules

* TypeScript `strict: true`; no implicit `any`.
* Path alias `@/*` resolves to `src/*` (configured in `tsconfig.json`).
* ESLint config only; no Prettier. Follow `next` ESLint rules; fix all lints before commit.
* Prefer functional React components with hooks; components live under `src/components`.
* Naming
  * React components: `PascalCase.tsx`.
  * Hooks: `useX.ts`.
  * Services / utils: `camelCase` functions, `PascalCase` classes if any.
* Imports: absolute (`@/hooks/useChat`) then relative; group by library → project modules → local siblings.
* Error handling: bubble unexpected errors to Next.js error boundary; attach `try/catch` only where recovery or logging is meaningful.
* Styles: **Tailwind CSS 4**; keep class lists ordered by layer (layout → box model → typography → visuals → state).
* Tests: none yet; when adding, prefer **Vitest** or **Jest** + `@testing-library/react`.

## Agent / Automation Conventions

No `.cursor/**`, `.cursorrules`, `AGENTS.md`, `.windsurfrules`, or existing `copilot-instructions.md` were present at time of writing. This file therefore acts as the canonical agent guide—patch rather than overwrite on future updates.

## Environment & Secrets

Required env vars (see `.env.local`):

* `DATABASE_URL` – PostgreSQL connection string.
* `OPENAI_API_KEY` – OpenAI secret.
* Supabase variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.

## README Highlights

* Purpose: async chat with reorderable queue and two-stage AI prompt optimisation.
* Key features: drag-and-drop queue, Mermaid diagram generation, breadth-first query workflow.
* Tech stack: Next.js, Prisma, PostgreSQL, Tailwind, OpenAI.

---
Add additional sections only when new tech or rules are introduced.
