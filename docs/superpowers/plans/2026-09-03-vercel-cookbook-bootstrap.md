# Vercel Cookbook Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and publish the public `TeaShaman-cyber/vercel-cookbook` repository with safe boundaries and initial issue structure.

**Architecture:** A Vercel-only public repository stores documentation, bounded canaries, and sanitized receipts. Runtime state and secrets remain outside Git.

**Tech Stack:** Git, GitHub, Markdown, Vercel connector.

**Spec:** `docs/superpowers/specs/2026-09-03-vercel-cookbook-design.md`

## Global Constraints

- Repository is public from creation.
- Never commit `.vercel/`, environment files, credentials, raw private webhook payloads, or unreviewed runtime logs.
- Initial issues keep canary implementation and field-note maintenance separate.

---

### Task 1: Bootstrap repository
- [ ] Create curated repository tree and safety files.
- [ ] Initialize Git on `main` and commit exact staged set.
- [ ] Create public GitHub repository and push.
- [ ] Independently read back repository metadata and files.

### Task 2: Create initial issues
- [ ] Create CI watcher canary issue.
- [ ] Create field-notes maintenance issue.
- [ ] Read both issues back independently.
