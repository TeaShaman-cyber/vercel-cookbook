# Vercel Cookbook

Practical Vercel recipes, bounded canaries, field notes, and sanitized receipts for the Theseus research workflow.

## Boundaries

Public repository. Never commit `.vercel/`, environment files, credentials, tokens, raw private webhook payloads, or unreviewed runtime logs.

## Layout

- `docs/field-notes/` — observed Vercel failure modes and workarounds.
- `docs/research/` — research notes and connector/skill mappings.
- `docs/superpowers/specs/` — approved designs.
- `docs/superpowers/plans/` — implementation plans.
- `canaries/` — reproducible bounded probes.
- `receipts/` — public, sanitized evidence only.

## Current work

First canary: external CI watcher substrate using Vercel Functions + Cron as reconciliation, tracked in issue #1.
