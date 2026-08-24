# DRIFT.md — view-architect Client vs Backend

**Date:** 2026-07-23
**Compared:** `src/types.ts` ↔ no dedicated backend service found in `nexus/typescript/`
**Status:** Type definitions only — no API client to compare

---

## Critical

### C1 — No API Client Found

View-architect contains a `types.ts` file but **no API service or HTTP client code** (no `*api*`, `*service*`, or `*client*` files). No dedicated backend service exists in `nexus/typescript/`.

| Expected Backend | Service | Found? |
|---|---|---|
| Graph visualization / architecture API | `view-architect-srv` or similar | ❌ |

The types defined in `src/types.ts` serve as data models for the UI components but are not connected to any observable backend endpoint.

---

## Summary

| Priority | Area | Notes |
|---|---|---|
| **None** | No drift possible | No backend API client to compare against |
