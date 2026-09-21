# Type Safety & Schema Validation Guidelines

> TypeScript standards, data contracts, and runtime validation in Shorebird Console.

---

## Overview

The project runs on **TypeScript 5** with strict mode enabled (`tsconfig.app.json`). Runtime data validation is performed using **Zod** (`zod`).

---

## Type Patterns

### 1. Data Contract Interfaces
Define domain entities with explicit interfaces:

```ts
export interface AppMetadata {
  app_id: string
  display_name: string
  latest_release_version?: string | null
  latest_patch_number?: number | null
  created_at: string
  updated_at: string
  platforms: string[]
}

export interface ReleaseArtifact {
  id: number
  release_id: number
  arch: string
  platform: string
  url: string
  size: number
  hash: string
}
```
*Real Examples*:
- [`src/features/apps/views/AppsListView.vue`](file:///Users/xxz/shorebird/shorebird-console/src/features/apps/views/AppsListView.vue#L11-L19)
- [`src/features/releases/views/ReleasesView.vue`](file:///Users/xxz/shorebird/shorebird-console/src/features/releases/views/ReleasesView.vue#L12-L29)

### 2. Runtime Validation with Zod
When accepting user inputs from forms or dialogs, validate with Zod before mutation:

```ts
import { z } from 'zod'

export const appSchema = z.object({
  displayName: z.string().min(2, '应用名称至少包含 2 个字符'),
})

// Safe parsing
const result = appSchema.safeParse(appForm.value)
if (!result.success) {
  ElMessage.warning(result.error.issues[0].message)
  return
}
```

### 3. OpenAPI & Orval Code Generation
- The backend OpenAPI schema is tracked under [`src/api/openapi.yaml`](file:///Users/xxz/shorebird/shorebird-console/src/api/openapi.yaml).
- Generated endpoints, TypeScript models, and Zod schemas live in [`src/api/generated/`](file:///Users/xxz/shorebird/shorebird-console/src/api/generated/) via `pnpm generate:api`.

---

## Forbidden Practices

1. ❌ **No `any`**: Do not use `any`. Use `unknown`, generic parameters, or explicit interfaces.
2. ❌ **Do not disable strict checking**: Maintain `vue-tsc --noEmit` compliance for all new code.
