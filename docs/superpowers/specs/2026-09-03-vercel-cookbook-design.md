# Vercel Cookbook Design

## Goal

Create a public Vercel-specific working surface for reproducible recipes, canaries, research, field notes, and sanitized receipts.

## Boundary

Vercel-only. Cloudflare, Deno, and Netlify remain separate research surfaces unless explicitly promoted later.

## Public-safety rules

- no `.vercel/`
- no environment files or credentials
- no tokens or secrets
- no raw private webhook payloads
- no unreviewed runtime logs
- sanitized deterministic evidence is allowed

## Initial issue split

1. Vercel CI watcher canary.
2. Vercel field notes / cookbook maintenance.
3. Vercel skills and connector-isomorphism research may be added as a distinct research issue.
