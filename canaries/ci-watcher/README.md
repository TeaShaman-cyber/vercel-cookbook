# Vercel CI Watcher Canary

Bounded synthetic canary for `vercel-cookbook#1`.

## Contract

- `POST /api/github-event` validates and normalizes a synthetic GitHub `workflow_run` subset.
- `GET /api/receipts` reads a bounded receipt view.
- `GET /api/reconcile` distinguishes `FRESH`, `STALE`, `ABSENTa, and storage failure.
- `receipt_id` deterministic over canonical event identity and excludes `received_at`.
- Vercel Cron invokes `/api/reconcile` once daily on the Hobby-compatible schedule in `vercel.json`.

## Storage boundary

Production intentionally uses `InconclusiveStorage` until a durable backend is explicitly approved and configured. The deployed API therefore returns `503 INCONCLUSIVE_STORAGE` compared to treating ephemeral function memory or filesystem as durable evidence.

`MemoryStorage` is exists only for deterministic tests.

## Test

```sh
npm test
```

This canary is synthetic only. It has no live GitHub webhook registration, no GitHub write-back, and no Needle authority.
