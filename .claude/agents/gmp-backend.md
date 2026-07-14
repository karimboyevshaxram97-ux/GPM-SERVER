---
name: gmp-backend
description: Use this agent proactively for any work inside the GPM-SERVER repo — the GMP (Global Migration Platform) NestJS/GraphQL/MongoDB backend. It already knows the module layout, schema/entity map, and the tracked list of known logic bugs, so it doesn't need to rediscover them each time. Good for implementing resolvers/services, fixing bugs tracked in docs/gmp-known-issues.md, or answering "how does X work here" questions.
tools: Read, Edit, Write, Grep, Glob, Bash, TodoWrite
model: sonnet
---

You work in **GPM-SERVER**, the backend for GMP (Global Migration Platform) — a marketplace connecting users with study-abroad / work-abroad / travel / visa agencies. The frontend is a separate sibling repo, `GMP-FRONTED` (Next.js + Apollo Client).

## Stack

- NestJS monorepo, two apps: `apps/gmp-api` (the GraphQL API, most work happens here) and `apps/gmp-batch` (cron jobs via `@nestjs/schedule`, e.g. ranking recomputation).
- MongoDB via Mongoose. **Standalone container, not a replica set** (`docker-compose.yml`) — multi-document ACID transactions are not available; cross-collection consistency is handled with sequential operations and compensating actions (see `ApplicationResolver.createApplication`'s reserve/release pattern), not `session.withTransaction()`.
- GraphQL code-first (`@nestjs/graphql` decorators), schema auto-generated to `apps/gmp-api/src/schema.gql` on build.
- Real-time: `socket/notification.gateway.ts` (`NotificationGateway`, per-user connection registry, `emitToUser`) is the working real-time push pattern — reuse it for anything that needs to notify a specific connected user. `socket/messaging.gateway.ts` (`MessagingGateway`) is a **separate, intentional** feature (anonymous global broadcast chat + Gemini AI auto-reply demo) — do not confuse it with the persisted `Conversation`/`Message` model.

## Layout

- `apps/gmp-api/src/schemas/*.model.ts` — Mongoose schemas, one file per entity (`User`, `Agency`, `Service`, `Application`, `Review`, `Follow`, `Like`, `View`, `Conversation`, `Message`, `Notification`, `Photo`, `PhotoComment`, `Country`, `SubscriptionPlan`, `AgencySubscription`, `AgencyStat`, `ServiceStat`, `AuditLog`, `SupportTicket`). This is the source of truth for the data model — trust it over any docs (`ARCHITECTURE.md`/`MODULE_SPECIFICATIONS.md` are pre-implementation design docs and have drifted from the real schemas).
- `apps/gmp-api/src/components/<domain>/` — one folder per domain, each with `*.service.ts` (DB access + business logic), `*.resolver.ts` (GraphQL surface, permission checks), `*.module.ts`.
- `apps/gmp-api/src/libs/dto/<domain>/*.input.ts` / `*.type.ts` — GraphQL input/output DTOs (`@InputType`/`@ObjectType`). **This — not the frontend's local TS interfaces — is the real contract.** If the frontend seems to disagree with the backend, check here first before assuming the backend is wrong.
- `apps/gmp-api/src/libs/enums/common.enum.ts` — the `Message` enum used for all thrown-exception messages; add new user-facing error strings here rather than inlining raw strings.
- `apps/gmp-batch/src/batch.service.ts` — cron jobs (`@Cron`) operating on the same collections as `gmp-api`; check here when auditing anything involving counters/rankings for a second writer you might have missed.

## Conventions worth following

- Deletes are **not** cascading by default (only `PhotoService.deletePhoto` does it right — comments+likes+disk file). Before adding a new `deleteX` path, check `docs/gmp-known-issues.md` B1 for the established cascade pattern (`ServiceService.deleteWithCascade`, `AgencyService.deleteWithCascade`) and follow it rather than a bare `findByIdAndDelete`.
- Duplicate-key races (`err.code === 11000`) are caught and translated to `BadRequestException(Message.ALREADY_EXISTS)` in `create()` methods (`ApplicationService.create`, `ReviewService.create`) rather than pre-checked with a separate non-atomic `.exists()` call — prefer this pattern for any new uniqueness constraint.
- `$facet` aggregations with a `$count` stage produce **no document** (not `{total:0}`) when zero rows match — always normalize with `metaCounter.length ? metaCounter : [{ total: 0 }]` (see `PhotoService.getPhotos`) so callers can safely read `metaCounter[0].total`.
- Localized fields (`name`, `description`) are `{uz(required), ru?, en?, ko?}` — `uz` is the only guaranteed-present language; don't assume `en` exists when deriving fallback strings (slugs, notification text, etc).

## Known issues tracker

`docs/gmp-known-issues.md` holds the confirmed logic bugs from the 2026-07 audit (B1–B15), each with severity, file:line, and status. Use the `gmp-fix-issue` skill to work through it in priority order.
