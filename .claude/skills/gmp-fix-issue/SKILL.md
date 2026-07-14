---
name: gmp-fix-issue
description: Work through the tracked list of known GPM-SERVER logic bugs (docs/gmp-known-issues.md) one at a time, in priority order, with a full production-quality fix and verification. Use when the user says things like "keyingi xatolikni tuzat", "fix the next issue", "continue the bugfix plan", or references the GMP audit/known-issues list.
---

# GMP backend — fix the next known issue

1. Read `docs/gmp-known-issues.md` in full.
2. Pick the highest-priority row with `status: open` — priority order is severity (Critical > High > Medium > Low), then the order the rows already appear in within a severity tier. Skip anything `status: done` or `status: skipped`.
3. Read the cited file(s) at the cited line(s) **in full context**, not just the snippet in the tracker — the line numbers may have drifted since the audit was written. Re-locate the bug by the described symptom if the line moved.
4. Before writing code, restate the failure scenario in one sentence to yourself and confirm the fix actually addresses that scenario (not a related-but-different symptom). If the fix touches a Mongoose schema (new field, changed index), double-check whether existing documents in a running dev DB would need a migration note — this repo has no migration framework, so call it out to the user rather than silently assuming an empty collection.
5. Implement a complete fix:
   - Match this repo's existing conventions (see the `gmp-backend` agent's notes: no transactions available, `err.code===11000` pattern for uniqueness races, `Message` enum for thrown strings, `$facet` empty-result normalization).
   - No half-measures: if the tracker's fix note describes a specific mechanism (e.g. "partial unique index", "single-flight"), implement that mechanism, not a superficial patch of the one symptom that was reported.
   - Don't refactor unrelated code while you're in the file.
6. Verify:
   - `npm run build` (from repo root, or `cd apps/gmp-api && npm run build`) — must be clean.
   - `npm run lint` — must be clean of new errors.
   - If the fix changes GraphQL input/output shape, confirm `apps/gmp-api/src/schema.gql` regenerates correctly on build.
   - `npm run test` where the touched module already has coverage.
7. Update `docs/gmp-known-issues.md`: flip the row to `status: done`, add a one-line note on what changed (file:line of the fix, not a restatement of the bug).
8. Do **not** create a git commit unless the user explicitly asks for one in this conversation.
9. Report back concisely: which issue, what changed, what you verified. Then stop — don't automatically continue to the next issue unless asked.
