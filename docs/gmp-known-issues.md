# GPM-SERVER — known logic issues

Tracked from the 2026-07-13 full-codebase audit (paired with the same audit on `GMP-FRONTED`, see that repo's own `docs/gmp-known-issues.md` for frontend items F1–F14). Each row: severity, status, file:line, one-line defect + failure scenario. Use the `gmp-fix-issue` skill to work through these in order.

Severity order for picking the next item: **Critical > High > Medium > Low**.

## Critical

### B1 — `status: done`
Was: `admin.service.ts` (`deleteAgency`, `deleteUser`), `agency.service.ts` (`delete`), `service.service.ts` (`delete`) all did a plain `findByIdAndDelete` with no cascade — orphaned Service/Application/Review/Follow/Photo/AgencySubscription rows on agency delete, and a dangling `Agency.owner` (permanently breaking that agency's admin checks) on user delete.

Fixed 2026-07-13: `ServiceService.delete` now cascades Application/Review/Like(SERVICE)/View(SERVICE) before removing the Service. `AgencyService.delete` finds the agency's services and calls `ServiceService.delete` on each, then cascades Photo+PhotoComment+Like/View(PHOTO), Follow, Like/View(AGENCY), AgencySubscription, and any remaining agency-level Review, then removes the Agency. `AdminService.deleteAgency` now calls `AgencyService.delete` instead of a bare `findByIdAndDelete`. `AdminService.deleteUser` does **not** cascade-delete the agency — it throws `Message.USER_OWNS_AGENCY` if the user owns one (transfer/delete the agency first), and only cleans up the user's own Follow/Like/View rows. Sequential (non-transactional) deletes throughout — `docker-compose.yml`'s Mongo is a standalone container, and even though the actual dev DB (`.env.local`, MongoDB Atlas) is a replica set that could support transactions, this repo has never used them anywhere, so sequential deletes matching the existing `PhotoService.deletePhoto` pattern were kept for portability.

New constructor deps wired through `agency.module.ts`/`service.module.ts`/`admin.module.ts` (added `MongooseModule.forFeature` entries + `AdminModule` now imports `AgencyModule`). `npm run build` clean; `npm run lint --fix` reformatted the touched files but added no new errors (the 672 reported problems are pre-existing, in files this change didn't touch). **Not** boot-tested against a live server/DB in this session (would have required connecting to the shared Atlas dev database) — recommend a manual smoke test of "delete agency" and "delete user who owns an agency" in a dev environment before relying on this in production.

## High

### B2 — `status: done`
Fixed 2026-07-13: `Application.model.ts` now exports `ACTIVE_APPLICATION_STATUSES` (SUBMITTED/UNDER_REVIEW/APPROVED/ACCEPTED/COMPLETED) and the `(user,service)` unique index is now `partialFilterExpression`-scoped to only those statuses. `existsForUserAndService` checks the same set. REJECTED/WITHDRAWN no longer block reapplication.


**`schemas/Application.model.ts:59`, `application.service.ts:32-38` (`existsForUserAndService`), `application.resolver.ts:86-90`** — unique index on `(user,service)` ignores status; once REJECTED/WITHDRAWN, that (user,service) pair can never apply again.
**Fix:** partial unique index scoped to "active" statuses (`SUBMITTED,UNDER_REVIEW,APPROVED,ACCEPTED,COMPLETED`); `existsForUserAndService` checks the same status set.

### B3 — `status: done`
Fixed 2026-07-13: same pattern as B2 — `Review.model.ts` exports `BLOCKING_REVIEW_STATUSES` (PENDING/APPROVED), unique `(agency,user,service)` index is now partial on those statuses, `existsByUserAndTarget` checks the same set. REJECTED/HIDDEN no longer block resubmission.


**`schemas/Review.model.ts:32`, `review.service.ts:35-44` (`existsByUserAndTarget`), `review.resolver.ts:53-58`** — same pattern: unique `(agency,user,service)` ignores status; REJECTED/HIDDEN blocks resubmission forever.
**Fix:** partial unique index scoped to `{status: {$in: ['PENDING','APPROVED']}}`; `existsByUserAndTarget` checks the same set.

### B4 — `status: done`
Fixed 2026-07-13: `AgencyService.create` now pre-generates the Agency's `_id` and falls back to `agency-<last8ofId>` when the name-derived slug comes out empty (no Latin characters in the name), so it can never produce an empty, colliding slug.


**`agency.service.ts:218-223`** — `primaryName = input.name.en || input.name.uz`; if only non-Latin `name.uz` is given, the lotin-only slug filter strips everything, yielding `slug:""`, which collides on the second such agency (`slug` is `unique+sparse`, and sparse doesn't exempt empty strings).
**Fix:** fall back to a slug derived from `_id` when the name-derived slug comes out empty.

### B5 — `status: done`
Fixed 2026-07-13: `SubscriptionService.subscribeToPlan` now writes `Agency.activeSubscription`/`subscriptionStatus:ACTIVE`; `cancelSubscription` writes `Agency.subscriptionStatus:CANCELLED`. `expireOverdueSubscriptions()` is now called by a new daily (`0 0 * * *`) `BatchService.batchExpireSubscriptions` cron in `apps/gmp-batch` (which got its own minimal `AgencySubscription` schema copy + a `subscriptionStatus` field added to its existing minimal `Agency` schema copy, matching that app's established pattern), syncing `Agency.subscriptionStatus:EXPIRED` for overdue agencies too.


**`subscription.service.ts:48-80` (`subscribeToPlan`), `:106-113` (`expireOverdueSubscriptions`)** — `Agency.activeSubscription`/`subscriptionStatus` are never written by `subscribeToPlan`/`cancelSubscription`; `expireOverdueSubscriptions()` exists but is never called by any resolver or `@Cron`.
**Fix:** write `Agency.activeSubscription`/`subscriptionStatus` on subscribe/cancel; wire `expireOverdueSubscriptions()` into a daily `@Cron` in `apps/gmp-batch`, also syncing `Agency.subscriptionStatus` for expired ones.

### B10 — `status: done`
Fixed 2026-07-13: found during implementation that `SocketModule` (`socket/socket.module.ts`) was itself dead code — never imported by `app.module.ts`; the real, running `NotificationGateway` instance is bootstrapped privately inside `NotificationModule`. Generalized `NotificationGateway.emitToUser(userId, notification)` to `emitToUser(userId, event, data)`; `NotificationModule` now also exports `NotificationGateway`; `MessagingModule` imports `NotificationModule` (not `SocketModule`) to get the *same* gateway instance; `MessagingService.sendMessage`/`editMessage`/`markConversationAsRead` now push `message:new`/`message:edited`/`conversation:read` to the other conversation participant(s). `MessagingGateway` (the separate anonymous-broadcast + Gemini-bot chat) was left untouched.


**`socket/messaging.gateway.ts`, `messaging.service.ts:110-147`** — the persisted `Conversation`/`Message` model has no real-time push at all; `MessagingGateway` is a separate anonymous-broadcast+Gemini-bot feature, unrelated to it.
**Fix:** generalize `NotificationGateway.emitToUser(userId, notification)` to `emitToUser(userId, event, data)`; have `MessagingModule` import `SocketModule` and inject `NotificationGateway` into `MessagingService` to push `message:new`/`message:edited`/`conversation:read` to the other participant(s). Do not touch `MessagingGateway` (the anonymous chat demo) — it's intentionally separate.

## Medium

### B6 — `status: done`
Fixed 2026-07-13: `getPlatformStats()` now counts `AgencySubscription.countDocuments({status:ACTIVE})` instead of hardcoding 0.


**`admin.service.ts:92`** — `getPlatformStats()` hardcodes `activeSubscriptions: 0`.
**Fix:** `AgencySubscription.countDocuments({status: SubscriptionStatus.ACTIVE})`.

### B7 — `status: done`
Fixed 2026-07-13: added a `viewDate` (YYYY-MM-DD) field; the index is now `unique:true` with `partialFilterExpression:{viewer:{$exists:true}}` (excludes anonymous views by design, so they're still never deduplicated). `recordView` no longer pre-checks with `.exists()` — it attempts an atomic `create()` and catches `err.code===11000` to detect "already viewed today", matching the existing Application/Review pattern.


**`schemas/View.model.ts:22`, `view.service.ts:19-51`** — comment claims a unique view per user per target, but the index is `sparse` only (not `unique`), and the check-then-create-then-increment is non-atomic (day-scoped dedup, not ever-scoped, so a plain unique index on the 3 fields would be wrong).
**Fix:** add a `viewDate` field (calendar-day bucket), unique index `{viewer,targetId,targetType,viewDate}` with `partialFilterExpression:{viewer:{$exists:true}}` (excludes anonymous views by design), and switch `recordView` to atomic `create()` + `catch(err.code===11000)` instead of pre-checking with `.exists()`.

### B8 — `status: done`
Fixed 2026-07-13: deleted `batchRollback` entirely — the `:20`/`:40` recompute crons already do a pure `$set` from current stat fields, so the reset step served no purpose beyond a ~20-40s window of unordered "top" sorts every minute.


**`apps/gmp-batch/src/batch.service.ts:22-35`** (`batchRollback`, `@Cron('0 * * * * *')`) — resets `agencyRank`/`serviceRank` to 0 every minute before the recompute crons run 20-40s later; "top" sorts are unordered during that window. The reset is also unnecessary since the recompute is a pure `$set`, not incremental.
**Fix:** delete `batchRollback` entirely.

### B9 — `status: done`
Fixed 2026-07-13: resolves `service.name.en || service.name.uz` to a plain string before interpolating into the notification message — no more literal "[object Object]".


**`application.resolver.ts:113`** — `` `New application received for "${service.name}"` `` interpolates the `{uz,ru,en,ko}` object directly, producing literal `"[object Object]"` in the notification text.
**Fix:** use `service.name.en || service.name.uz` (or existing i18n helper if one exists) to get a string first.

### B11 — `status: done`
Fixed 2026-07-13: `sendMessage` now updates `lastMessage`/`lastMessageAt`/`unreadCountByUser.<id>` via a single atomic `findByIdAndUpdate` with `$set`/`$inc` (one `$inc` key per other participant) instead of load→mutate→save. `markConversationAsRead` similarly does an atomic `$set` on the one map key instead of loading the whole document.


**`messaging.service.ts:110-147` (`sendMessage`), `:160-176` (`markConversationAsRead`)** — `unreadCountByUser` Map is read → mutated in memory → `save()`d; concurrent sends/reads on the same conversation can clobber each other.
**Fix:** use an atomic Mongo update (`$inc`/positional operator on the map path) instead of load-mutate-save.

### B12 — `status: done`
Fixed 2026-07-13: the lookup query now always includes an explicit `agency` condition — `agency: new Types.ObjectId(agencyId)` when provided, `agency: { $exists: false }` when not — so agency-scoped and direct personal conversations between the same two users can never be confused for each other.


**`messaging.service.ts:53-66`** (`getOrCreateConversation`) — when `agencyId` is omitted, the lookup query has no `agency` filter at all, so a prior agency-scoped conversation between the same two users can be returned for what should be a distinct direct conversation.
**Fix:** always include an explicit `agency` condition in the query — `agency: new Types.ObjectId(agencyId)` when provided, `agency: { $exists: false }` when not.

## Low

### B13 — `status: done`
Fixed 2026-07-13: `getServices`/`getAgencies` now normalize `metaCounter` to `[{total:0}]` when the `$facet`'s `$count` stage emitted nothing, matching the existing `PhotoService.getPhotos` pattern.


**`service.service.ts:120-124` (`getServices`), `agency.service.ts:134-140`* (`getAgencies`)* — `$facet`'s `metaCounter` is `[]` (not `[{total:0}]`) when zero rows match, unlike `photo.service.ts:65-68` which normalizes correctly.
**Fix:** apply the same `metaCounter.length ? metaCounter : [{ total: 0 }]` normalization.

### B14 — `status: done`
Fixed 2026-07-13: `ServiceResolver.createService` now notifies each agency follower with `notificationsEnabled` via `NEW_SERVICE` after a service is created (using the existing `FollowService.getAgencyFollowers`). `AdminService.updateReviewStatus` now notifies the agency owner with `NEW_REVIEW` when a review transitions to `APPROVED`.


**No call site exists** for `NotificationType.NEW_SERVICE` or `NotificationType.NEW_REVIEW` anywhere in `apps/gmp-api/src` (grep-verified) — followers are never notified of new services or reviews.
**Fix:** add a `NEW_SERVICE` notify call in `service.resolver.ts` `createService` (to the agency's followers), and a `NEW_REVIEW` notify call when a review is approved.

### B15 — `status: done`
Fixed 2026-07-13: `ViewService` now injects `AnalyticsService` and calls `recordAgencyProfileView`/`recordServiceView` from inside `updateViewCount` (alongside the existing `View` document write and `viewCount` `$inc`), so `AgencyStat`/`ServiceStat` finally get populated using the already-correct write methods that existed but were never called.


**`schemas/AgencyStat.model.ts`, `ServiceStat.model.ts`** — `AnalyticsService` (`components/analytics/analytics.service.ts`) has working `recordAgencyProfileView`/`recordServiceView`/`updateAgencyDailyStats` methods, but nothing calls them (only the read-side `agencyStats`/`serviceStats` queries are wired to a resolver) — the collections stay empty forever.
**Fix:** inject `AnalyticsService` into `ViewService` and call `recordAgencyProfileView`/`recordServiceView` from `recordView()` alongside the existing `View` document write.
