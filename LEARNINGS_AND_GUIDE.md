# 🧩 Feature Flag Dashboard — Master Learning & Implementation Guide (Updated)

> This guide teaches you **what to do**, **how to do it**, and **why it matters**.  
> It’s both a **learning path** and a **production-ready reference** for building a real-world full-stack app that can later be ported to **Next.js** (frontend) and **Java/Spring Boot** (backend).

---

## 🗂 Table of Contents

1. [Why Feature Flags?](#1-why-feature-flags)
2. [Requirements First](#2-requirements-first)
3. [Tech Choices & Trade-offs](#3-tech-choices--trade-offs)
4. [Backend Setup & Project Bootstrap](#4-backend-setup--project-bootstrap)
5. [Folder Structure Explained](#5-folder-structure-explained)
6. [App Bootstrap](#6-app-bootstrap)
7. [Database Modeling with Prisma](#7-database-modeling-with-prisma)
8. [Migrations & Seeding](#8-migrations--seeding)
9. [Core Modules & API Endpoints](#9-core-modules--api-endpoints)
10. [Feature Evaluation Logic](#10-feature-evaluation-logic)
11. [Validation, Errors & Observability](#11-validation-errors--observability)
12. [Linting, Formatting & Git Hooks](#12-linting-formatting--git-hooks)
13. [Testing Strategy](#13-testing-strategy)
14. [Realtime Updates (SSE & Webhooks)](#14-realtime-updates-sse--webhooks)
15. [Audit Logs & Outgoing Webhooks](#15-audit-logs--outgoing-webhooks)
16. [Fixing TypeScript Augmentation for req.user](#16-fixing-typescript-augmentation-for-requser)
17. [Porting to Java/Spring Boot](#17-porting-to-javaspring-boot)
18. [Frontend Plan (React → Next.js)](#18-frontend-plan-react--nextjs)
19. [Deployment Notes](#19-deployment-notes)
20. [Next Steps](#20-next-steps)
21. [Appendix — Minimal API Reference](#appendix--minimal-api-reference)

---

## 1️⃣ Why Feature Flags?

Feature flags let you:

- Ship features gradually to users.
- Roll out safely across environments.
- Disable problematic features instantly.
- Enable A/B testing and experimentation.

---

## 2️⃣ Requirements First

Keep `/docs/requirements.md` as the **source of truth**.

**Why:**

- Prevents scope creep.
- Simplifies future stack migration.
- Defines your app's domain boundaries early.

---

## 3️⃣ Tech Choices & Trade-offs

| Layer          | Choice                         | Why                                        | Alternatives           |
| -------------- | ------------------------------ | ------------------------------------------ | ---------------------- |
| **Backend**    | Node.js + Express + TypeScript | Simple, portable, teaches fundamentals     | NestJS, Fastify        |
| **ORM**        | Prisma + PostgreSQL            | Type-safe schema, migrations, easy seeding | TypeORM, Drizzle       |
| **Validation** | Zod                            | Runtime + static validation                | Yup, class-validator   |
| **Auth**       | bcrypt + JWT                   | Stateless, secure                          | OAuth, session cookies |
| **Infra**      | Docker                         | Consistent local DB                        | Local install          |
| **DX Tools**   | ESLint + Prettier + Husky      | Enforced code hygiene                      | Biome, Rome            |

---

## 4️⃣ Backend Setup & Project Bootstrap

### Commands

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
      assertUser.ts
    types/
      express.d.ts
    modules/
      auth/
      users/
      environments/
      features/
      overrides/
      flags/
      audit/
      webhooks/
  prisma/
    schema.prisma
    seed.ts
```

**Why:**

- Clear structure: **routes → controllers → services**
- Modular for testing & portability
- Audit + Webhooks added as new modules

---

## 6️⃣ App Bootstrap

- `config/env.ts` — loads env vars.
- `db/prisma.ts` — single Prisma client.
- `middleware/error.ts` — unified error handler.
- `middleware/authz.ts` — guards (auth + admin).
- `middleware/assertUser.ts` — ensures `req.user` is typed and non-optional.
- `app.ts` — sets up middleware, routes, and error handling.

---

## 7️⃣ Database Modeling with Prisma

### Core Models

- `User`, `Environment`, `Feature`, `FlagAssignment`, `UserOverride`
- `AuditLog` — stores all important actions.
- `WebhookEndpoint` & `WebhookDelivery` — manage and track outgoing webhooks.

### Why AuditLog & Webhooks?

- Traceability: who changed what and when.
- Event-driven integrations: trigger Slack notifications, analytics, etc.

---

## 8️⃣ Migrations & Seeding

```bash
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

- Seeds environments (`dev`, `staging`, `prod`)
- Adds admin + viewer users
- Populates features + assignments
- Uses **upserts** → re-runnable safely

---

## 9️⃣ Core Modules & API Endpoints

| Module       | Endpoints                                     | Purpose                        |
| ------------ | --------------------------------------------- | ------------------------------ |
| Auth         | `/auth/login`, `/auth/register`               | JWT login & registration       |
| Users        | `/users`, `/users/:id/role`                   | Manage users and roles         |
| Environments | `/environments`                               | CRUD for environments          |
| Features     | `/features`                                   | Manage toggles                 |
| Overrides    | `/overrides`                                  | User-specific overrides        |
| Flags        | `/flags/evaluate`, `/flags/:featureKey/state` | Evaluate or update flag states |

---

## 🔟 Feature Evaluation Logic

**Order of resolution:**

1. `UserOverride` (explicit ON/OFF)
2. `PercentageRollout` (deterministic hash)
3. Default flag state (ON/OFF)

**Why deterministic hashing?**

- Keeps user experience consistent across sessions.

---

## 11️⃣ Validation, Errors & Observability

- **Zod** validates requests.
- **morgan** logs traffic in dev.
- Centralized **error middleware** ensures consistent `{ data, error }` responses.

---

## 12️⃣ Linting, Formatting & Git Hooks

- **ESLint + Prettier**: enforce consistent style.
- **Husky + lint-staged**: run checks pre-commit.
- **Commitlint**: enforce semantic commit messages.

---

## 13️⃣ Testing Strategy

- Unit test evaluator logic.
- Integration test routes.
- Contract test schemas with Zod.

---

## 14️⃣ Realtime Updates (SSE & Webhooks)

Before implementing webhooks, we considered **Server-Sent Events (SSE)** for dashboards.  
Now the backend supports **outgoing webhooks** for more flexible event integrations.

---

## 15️⃣ Audit Logs & Outgoing Webhooks

### 📘 Concept

Audit logs track _who_ did _what_, _where_, and _when_.  
Webhooks allow external systems to react to those events in real-time.

### ⚙️ Flow

1. When an admin toggles a flag or updates overrides:
   - Write an entry to `AuditLog`.
   - Dispatch a **signed webhook** (HMAC SHA256).
2. Each delivery is recorded in `WebhookDelivery`.

**Why:** durable audit trail + real-time integrations.

---

### 🔐 HMAC Signature Security

Headers include:

```
X-Webhook-Signature: sha256=<hex>
X-Webhook-Event: FLAG_SET_STATE
X-Webhook-Timestamp: 1698259300
```

Receiver verification:

```js
const crypto = require('crypto');
const expected = crypto.createHmac('sha256', SECRET).update(JSON.stringify(body)).digest('hex');
if (signature !== expected) return res.status(401).end();
```

---

### 🧾 Example Webhook Payload

```json
{
  "id": "clz9x0...",
  "type": "FLAG_SET_STATE",
  "createdAt": "2025-10-26T10:20:30Z",
  "actor": {
    "id": "user123",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "data": {
    "featureKey": "new-ui",
    "environmentKey": "staging",
    "state": "PERCENTAGE",
    "rolloutPct": 25
  }
}
```

---

### 🧪 Testing

1. Register a webhook (e.g. on webhook.site).
2. Toggle a feature flag.
3. Check incoming signed payload.
4. Inspect `WebhookDelivery` for status.

---

### 🧠 Why Webhooks?

| Approach | Pros                       | Cons                            |
| -------- | -------------------------- | ------------------------------- |
| Polling  | Simple                     | Inefficient                     |
| SSE      | Real-time dashboard        | Not ideal for external services |
| Webhooks | Integrates with any system | Requires receiver setup         |

---

## 16️⃣ Fixing TypeScript Augmentation for req.user

Without augmentation, you get:

```
Property 'user' does not exist on type 'Request'.
```

### ✅ Correct Fix

**1. Create `src/types/express.d.ts`**

```ts
export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'ADMIN' | 'VIEWER';
      };
    }
  }
}
```

**2. Add to `tsconfig.json`**

```json
{
  "include": ["src/**/*.ts", "src/types/**/*.d.ts", "prisma/**/*.ts"]
}
```

**3. Restart TS server**  
**4. Remove any `declare module 'express-serve-static-core'`** statements.

**Why:**

- Global augmentation is the official Express pattern.
- Works across your entire codebase safely.

---

## 17️⃣ Porting to Java/Spring Boot

| Node/Express | Java/Spring Boot  |
| ------------ | ----------------- |
| Routes       | `@RestController` |
| Prisma ORM   | JPA/Hibernate     |
| JWT Auth     | Spring Security   |
| Validation   | Bean Validation   |
| Migrations   | Flyway/Liquibase  |

Keep the same API contracts for easy migration.

---

## 18️⃣ Frontend Plan (React → Next.js)

**React (MVP):**

- Vite + Tailwind + React Query
- Pages: Feature list, detail, overrides

**Next.js (future):**

- `app/` router
- SSR dashboard
- Shared API contracts

---

## 19️⃣ Deployment Notes

- Use **Docker Compose** for API + DB.
- Store secrets in `.env`.
- Nginx/Caddy for HTTPS.
- Stateless scaling with JWT.

---

## 20️⃣ Next Steps

- Add **Audit Log UI** to dashboard.
- Implement **SSE** for live updates.
- Add **Replay failed webhook** feature.
- Add **GitHub Actions CI/CD**.
- Write **unit + integration tests** for audit/webhooks.

---

## Appendix — Minimal API Reference

| Type             | Endpoint                                                 | Description       |
| ---------------- | -------------------------------------------------------- | ----------------- |
| **Auth**         | `POST /auth/login`                                       | Login with JWT    |
| **Features**     | `GET /features`, `PUT /flags/:key/state`                 | Manage toggles    |
| **Overrides**    | `PUT /overrides`, `DELETE /overrides`                    | User overrides    |
| **Environments** | `GET /environments`, `POST /environments`                | CRUD environments |
| **Users**        | `GET /users`, `PATCH /users/:id/role`                    | Manage roles      |
| **Audit Logs**   | (auto)                                                   | Logs user actions |
| **Webhooks**     | `GET /webhooks`, `POST /webhooks`, `POST /webhooks/test` | Outgoing webhooks |

---
