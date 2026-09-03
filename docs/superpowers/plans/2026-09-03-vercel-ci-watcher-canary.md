# Vercel CI Watcher Canary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the synthetic Vercel CI watcher canary from issue #1, preserving `INCONCLUSIVE_STORAGE` when durable persistence cannot be provisioned safely.

**Architecture:** A dependency-light Node.js Vercel project exposes synthetic event, receipts, and reconciliation endpoints. Pure core modules own validation, canonical receipt identity, and freshness classification; a storage adapter either uses an explicitly configured durable backend or returns an explicit storage-unavailable result. Vercel cron invokes reconciliation once daily on Hobby.

**Tech Stack:** Node.js 20+, Vercel Functions, Node built-in test runner, Web Crypto / node:crypto, JSON.

**Spec:** `https://github.com/TeaShaman-cyber/theseus-public-observatory/blob/e64e215dab667dbe47eaf21cfd907b7660d164af/docs/superpowers/specs/2026-09-03-vercel-ci-watcher-canary-design.md`

## Global Constraints

- Synthetic GitHub-like events only.
- No GitHub webhook secret or live webhook registration.
- No GitHub write-back and no Needle authority change.
- Ephemeral filesystem is not accepted as durable state.
- Missing durable storage produces `INCONCLUSIVE_STORAGE`.
- No secrets, raw private payloads, `.vercel/`, or runtime logs in Git.
- Vercel Hobby cron cadence is once daily for this canary.
- Deployment submission is not acceptance; deployed readback and logs are required.

---

### Task 1: Deterministic receipt core

**Files:**
- Create: `canaries/ci-watcher/lib/receipt.js`
- Create: `canaries/ci-watcher/test/receipt.test.js`
- Create: `canaries/ci-watcher/package.json`

**Interfaces:**
- Produces: `normalizeWorkflowRun(payload, receivedAt)` -> normalized receipt.
- Produces: deterministic `receipt_id` independent of `received_at`.

- [ ] Write failing tests for required-field validation and deterministic duplicate identity.
- [ ] Run `npm test` and verify RED because implementation is missing.
- [ ] Implement minimal canonicalization + SHA-256 identity.
- [ ] Run `npm test` and verify GREEN.

### Task 2: Reconciliation core

**Files:**
- Create: `canaries/ci-watcher/lib/reconcile.js`
- Create: `canaries/ci-watcher/test/reconcile.test.js`

**Interfaces:**
- Consumes: normalized receipts.
- Produces: `reconcile(receipts, query, now, freshnessMs)` -> `FRESH | STALE | ABSENT` result.

- [ ] Write failing tests distinguishing FRESH, STALE, and ABSENT.
- [ ] Run tests and verify RED.
- [ ] Implement minimal newest-matching-receipt selection and age comparison.
- [ ] Run tests and verify GREEN.

### Task 3: Storage boundary

**Files:**
- Create: `canaries/ci-watcher/lib/store.js`
- Create: `canaries/ci-watcher/test/store.test.js`

**Interfaces:**
- Produces: `createStore(env)`.
- `append(receipt)` and `list(limit)` return explicit structured results.
- Without an approved durable backend configuration, operations return `{ ok:false, code:'INCONCLUSIVE_STORAGE' }`.

- [ ] Write failing tests requiring explicit storage-unavailable behavior when no durable backend is configured.
- [ ] Run tests and verify RED.
- [ ] Implement only the explicit unavailable adapter initially; do not add ephemeral persistence.
- [ ] Run tests and verify GREEN.

### Task 4: HTTP endpoints

**Files:**
- Create: `canaries/ci-watcher/api/github-event.js`
- Create: `canaries/ci-watcher/api/receipts.js`
- Create: `canaries/ci-watcher/api/reconcile.js`
- Create: `canaries/ci-watcher/test/http.test.js`

**Interfaces:**
- POST `/api/github-event`: validate + normalize; returns 400 malformed, 503 storage unavailable, 201 on durable append success.
- GET `/api/receipts`: bounded list or 503 `INCONCLUSIVE_STORAGE`.
- GET `/api/reconcile`: durable read + classification or 503 `INCONCLUSIVE_STORAGE`.

- [ ] Write handler-level tests with injected test stores.
- [ ] Verify RED.
- [ ] Implement small handlers and dependency injection seams.
- [ ] Verify GREEN.

### Task 5: Vercel project configuration

**Files:**
- Create: `canaries/ci-watcher/vercel.json`
- Create: `canaries/ci-watcher/README.md`

**Interfaces:**
- Production cron: `0 0 * * *` -> `/api/reconcile`.
- No secrets committed.

- [ ] Add one daily Hobby-compatible cron.
- [ ] Add README describing expected `INCONCLUSIVE_STORAGE` until durable backend is proven.
- [ ] Run JSON validation and full tests.

### Task 6: Publish implementation branch

- [ ] Run `npm test` from `canaries/ci-watcher`.
- [ ] Run `git diff --check`.
- [ ] Commit implementation on `canary/vercel-ci-watcher`.
- [ ] Push branch and verify exact remote SHA.

### Task 7: First Vercel connector deployment canary

- [ ] Preflight connector state with team/project listing.
- [ ] Invoke connector deployment on the prepared canary project if the connector can resolve the project source.
- [ ] If project/source resolution is unsupported, record `INCONCLUSIVE_CONNECTOR_BOUNDARY` and do not invent a CLI fallback without explicit new approval.
- [ ] If deployment exists, read project/deployment metadata, build logs, and runtime logs through connector actions.
- [ ] Manually invoke deployed endpoints when a URL is available and record status/response hashes without secrets.
- [ ] Determine whether a free durable store is already available/provisionable through the connector. If not, final storage disposition remains `INCONCLUSIVE_STORAGE`.

### Task 8: Evidence and issue update

**Files:**
- Create: `receipts/vercel-ci-watcher-canary-2026-09-03.json` only with sanitized evidence.
- Modify: `docs/field-notes/README.md` only for Vercel-specific reusable failures.

- [ ] Record exact Git commit, Vercel project/deployment IDs when public-safe, endpoint results, runtime/log readback status, cron observation, and storage disposition.
- [ ] Push evidence commit after secret scan and exact remote readback.
- [ ] Update issue #1 with final disposition and evidence links.
