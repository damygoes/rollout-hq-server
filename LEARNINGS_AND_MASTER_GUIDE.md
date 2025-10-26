# 🧩 Feature Flag Dashboard — Master Learning & Implementation Guide

> This guide teaches you **what to do**, **how to do it**, and **why it matters**.  
> It’s both a **learning path** and a **production-ready reference** for building a real-world full-stack app that can later be ported to **Next.js** (frontend) and **Java/Spring Boot** (backend).

---

## 🗂 Table of Contents

1. [Why Feature Flags?](#1-why-feature-flags)
2. [Requirements First](#2-requirements-first)
3. [Tech Choices & Trade-offs](#3-tech-choices--trade-offs)
4. [Backend Setup & Project Bootstrap](#4-backend-setup--project-bootstrap)
5. [Folder Structure Explained](#5-folder-structure-explained)
6. [App Bootstrap (Environment, Middleware, Server)](#6-app-bootstrap-environment-middleware-server)
7. [Database Modeling with Prisma](#7-database-modeling-with-prisma)
8. [Migrations & Seeding](#8-migrations--seeding)
9. [Core Modules & API Endpoints](#9-core-modules--api-endpoints)
10. [Feature Evaluation Logic (Deterministic Rollouts)](#10-feature-evaluation-logic-deterministic-rollouts)
11. [Validation, Errors & Observability](#11-validation-errors--observability)
12. [Linting, Formatting & Git Hooks](#12-linting-formatting--git-hooks)
13. [Testing Strategy](#13-testing-strategy)
14. [Realtime Updates (SSE & WebSockets)](#14-realtime-updates-sse--websockets)
15. [Porting to Java/Spring Boot](#15-porting-to-javaspring-boot)
16. [Frontend Plan (React → Next.js)](#16-frontend-plan-react--nextjs)
17. [Deployment Notes](#17-deployment-notes)
18. [How to Use This as a Template](#18-how-to-use-this-as-a-template)
19. [Next Steps](#19-next-steps)
20. [Appendix — Minimal API Reference](#appendix--minimal-api-reference)

---

## 1️⃣ Why Feature Flags?

**Feature flags** allow you to:
- Release code gradually or to specific users.
- Turn off risky features without redeploying.
- Run A/B tests or phased rollouts safely.

**Core concepts you’ll build:**
- Feature toggles per environment.
- Percentage-based rollouts.
- User-specific overrides.
- Real-time updates for dashboards.

---

## 2️⃣ Requirements First

Always begin with a **requirements document** — `/docs/requirements.md`.

**Why:**  
- Defines project scope early.  
- Prevents feature creep.  
- Serves as a blueprint for rebuilding in other stacks.

---

## 3️⃣ Tech Choices & Trade-offs

| Layer | Choice | Why | Alternatives |
|-------|--------|-----|--------------|
| **Backend** | Node.js + Express + TypeScript | Simple, unopinionated, fast iteration | NestJS, Fastify |
| **ORM** | Prisma + PostgreSQL | Type-safe, declarative schema | TypeORM, Drizzle |
| **Validation** | Zod | Runtime + compile-time validation | Yup, class-validator |
| **Auth** | bcrypt + JWT | Secure and stateless | OAuth, sessions |
| **DevX** | ESLint, Prettier, Husky, Commitlint | Consistency + code hygiene | Rome, Biome |
| **Infra** | Docker (Postgres) | Reproducible local setup | Local DB |

---

## 4️⃣ Backend Setup & Project Bootstrap

**Commands**
```bash
pnpm init -y
pnpm add express zod bcrypt jsonwebtoken cors morgan @prisma/client
pnpm add -D typescript ts-node-dev prisma @types/express @types/jsonwebtoken @types/cors @types/morgan
npx tsc --init
npx prisma init
```

---

## 5️⃣ Folder Structure Explained

```
backend/
  src/
    app.ts
    server.ts
    config/env.ts
    db/prisma.ts
    utils/response.ts
    middleware/
      error.ts
      authz.ts
    modules/
      auth/
      users/
      environments/
      features/
      overrides/
      flags/
  prisma/
    schema.prisma
    seed.ts
```

**Why this structure:**
- Clear boundaries: Routes → Controllers → Services.
- Easier testing and scaling.
- Portable to other frameworks.

---

## 6️⃣ App Bootstrap (Environment, Middleware, Server)

- `config/env.ts` → loads & validates env variables.  
- `db/prisma.ts` → single `PrismaClient` instance (avoid connection floods).  
- `middleware/error.ts` → centralized error formatting.  
- `middleware/authz.ts` → `requireAuth`, `requireAdmin` guards.  
- `app.ts` → sets up routes, middleware, logging, error handler.  
- `server.ts` → starts Express app on configured port.

**Why:** Keeps concerns modular, improves clarity, testability, and maintainability.

---

## 7️⃣ Database Modeling with Prisma

**Entities**
- `User`: email, passwordHash, role.
- `Environment`: key, name.
- `Feature`: key, name, description, archived.
- `FlagAssignment`: links Feature+Env, defines state/rollout%.
- `UserOverride`: user-specific ON/OFF override.
- `AuditLog`: records who toggled what (for later).

**Design Principles**
- Use **string keys** (`feature.key`, `env.key`) instead of IDs → portable APIs.
- Composite unique constraints for upserts.
- Validation (e.g., rollout 0–100) handled in code with Zod.

---

## 8️⃣ Migrations & Seeding

### Migrate
```bash
pnpm prisma migrate dev --name init
```

### Seed
- Upserts Environments (`dev`, `staging`, `prod`).
- Creates Users (`admin@example.com`, `viewer@example.com`).
- Seeds Features (`new-ui`, `fast-checkout`).
- Applies FlagAssignments:
  - new-ui: dev=ON, staging=PERCENTAGE(25), prod=OFF
  - fast-checkout: dev=ON, staging=OFF, prod=OFF

**Why Upserts:** Safe to rerun; reflects real-world idempotent seeding.

**package.json**
```json
"scripts": {
  "db:seed": "prisma db seed",
  "prisma:migrate": "prisma migrate dev --name init"
}
```

---

## 9️⃣ Core Modules & API Endpoints

| Module | Key Endpoints | Purpose |
|--------|----------------|----------|
| **Auth** | `/auth/login`, `/auth/register` | JWT issuance & user creation |
| **Users** | `/users`, `/users/:id/role` | Manage users & roles |
| **Environments** | `/environments` | CRUD for environments |
| **Features** | `/features` | Manage feature toggles |
| **Overrides** | `/overrides` | Per-user ON/OFF |
| **Flags** | `/flags/evaluate`, `/flags/:featureKey/state` | Evaluate or toggle features |

**Evaluation Order:**  
`UserOverride → PercentageRollout → Default State`

---

## 🔟 Feature Evaluation Logic (Deterministic Rollouts)

**Logic**
1. Check if user has explicit override → return that.
2. If flag state = ON/OFF → return it.
3. If `PERCENTAGE`, hash userId → bucket < rollout%.
4. No userId → default OFF.

**Why Deterministic Hashing?**
- Guarantees user consistency across sessions.

**Tip:** Replace simple char-code hash with MurmurHash or xxHash in production.

---

## 11️⃣ Validation, Errors & Observability

- **Zod** → route-level validation.
- **Error middleware** → unified error responses.
- **Logging:** `morgan` (dev), upgrade to `pino` (prod).

**Why:** Reliable debugging and clean contracts between frontend/backend.

---

## 12️⃣ Linting, Formatting & Git Hooks

**Tools**
- ESLint → code quality.
- Prettier → formatting.
- Husky + lint-staged → enforce quality on commit.
- Commitlint → Conventional Commits.

**Install**
```bash
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-import prettier eslint-config-prettier husky lint-staged @commitlint/cli @commitlint/config-conventional
```

**Scripts**
```json
{
  "lint": "eslint . --ext .ts,.tsx",
  "lint:fix": "eslint . --ext .ts,.tsx --fix",
  "format": "prettier --write .",
  "prepare": "husky"
}
```

**Hooks**
```bash
pnpm exec husky init
echo 'pnpm exec lint-staged' > .husky/pre-commit
echo 'pnpm exec commitlint --edit "$1"' > .husky/commit-msg
```

---

## 13️⃣ Testing Strategy

- **Unit Tests** → pure logic (e.g., flag evaluator).  
- **Integration Tests** → endpoints with SQLite or test Postgres.  
- **Contract Tests** → verify API shapes using Zod.

**Why:** Ensures behavior consistency across future stack migrations.

---

## 14️⃣ Realtime Updates (SSE & WebSockets)

| Method | When to Use | Notes |
|--------|--------------|-------|
| **SSE** | Dashboard live updates | Simple, one-way |
| **WebSockets** | Bi-directional communication | More setup, flexible |

Start with SSE for broadcasting flag updates in the dashboard.

---

## 15️⃣ Porting to Java/Spring Boot

**Mapping**
| Node/Express | Java/Spring |
|---------------|-------------|
| Routes | `@RestController` |
| Prisma | JPA/Hibernate |
| JWT | Spring Security |
| Validation | Bean Validation (`@Valid`) |
| Migration | Flyway/Liquibase |

**Tip:** Keep API contracts identical; port tests first, then code.

---

## 16️⃣ Frontend Plan (React → Next.js)

**React version**
- Stack: Vite + Tailwind + React Query.
- Pages: Feature list, detail, envs, users.

**Next.js port**
- Use `app/` router & Server Actions.
- Implement SSR for dashboards.
- Share the same API contracts.

---

## 17️⃣ Deployment Notes

- Deploy via **Docker Compose** for backend + DB.  
- Use **.env** for secrets.  
- Reverse proxy (Caddy/Nginx) handles HTTPS.  
- Stateless scaling with JWT; Postgres via managed service.

---

## 18️⃣ How to Use This as a Template

1. Start every project with **requirements.md**.  
2. Define entities and relationships early.  
3. Implement modules → validate with Zod.  
4. Add seeding logic (idempotent).  
5. Configure linting/hooks early.  
6. Document APIs clearly → portable contracts.  
7. Add tests → lock down business rules.

---

## 19️⃣ Next Steps

- Add **Audit Logs** (who toggled what, when).  
- Implement **Realtime Updates** (SSE).  
- Add **CI/CD** via GitHub Actions.  
- Extend with **metrics dashboards** or **multi-tenant support**.

---

## Appendix — Minimal API Reference

| Type | Endpoint | Description |
|------|-----------|-------------|
| **Auth** | `POST /auth/login` | `{ token }` |
| **Features** | `GET /features`, `POST /features`, `PATCH /features/:id`, `DELETE /features/:id` | CRUD |
| **Environments** | `GET /environments`, `POST /environments` | Manage environments |
| **Flags** | `GET /flags/evaluate`, `PUT /flags/:featureKey/state` | Evaluate or toggle flag |
| **Overrides** | `PUT /overrides` | Set per-user override |
| **Users** | `GET /users`, `PATCH /users/:id/role` | Manage roles |

---
