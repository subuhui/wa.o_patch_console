# Quality & Testing Guidelines

> Unit tests, E2E browser tests, error logging, and code review standards.

---

## Overview

Code quality in Shorebird Console is maintained through automated tests, linting hooks, and error monitoring.

---

## Testing Standards

### 1. Unit Testing with Vitest (`vitest`)
Unit tests live in `tests/` and cover isolated components and Pinia stores:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('updates token and persists to localStorage', () => {
    const auth = useAuthStore()
    auth.setToken('test_secret_token')

    expect(auth.token).toBe('test_secret_token')
    expect(auth.isAuthenticated).toBe(true)
    expect(localStorage.getItem('shorebird_token')).toBe('test_secret_token')
  })
})
```
*Real Examples*:
- [`tests/stores/auth.spec.ts`](file:///Users/xxz/shorebird/shorebird-console/tests/stores/auth.spec.ts)
- [`tests/components/StatusTag.spec.ts`](file:///Users/xxz/shorebird/shorebird-console/tests/components/StatusTag.spec.ts)

Execute via:
```sh
pnpm test:unit
```

### 2. End-to-End Browser Testing with Playwright (`@playwright/test`)
E2E tests live in `e2e/` and execute full user workflows in a real browser:

```ts
import { test, expect } from '@playwright/test'

test('allows entering private token and logging in', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="password"]', 'sb_api_private_shorebird_token')
  await page.click('button.submit-btn')
  await expect(page).toHaveURL(/.*apps/)
  await expect(page.locator('.page-title')).toContainText('应用列表')
})
```
*Real Examples*:
- [`e2e/auth.spec.ts`](file:///Users/xxz/shorebird/shorebird-console/e2e/auth.spec.ts)
- [`e2e/console.spec.ts`](file:///Users/xxz/shorebird/shorebird-console/e2e/console.spec.ts)

Execute via:
```sh
pnpm test:e2e
```

---

## Logging & Monitoring

### 1. Sentry Error Tracking
Configured in [`src/plugins/sentry.ts`](file:///Users/xxz/shorebird/shorebird-console/src/plugins/sentry.ts) with `@sentry/vue`:
- Initialized if `VITE_SENTRY_DSN` is present.
- Integrates browser tracing with Vue Router navigation.
- Replays on error at 100% rate.

### 2. UI User Feedback
- **Informational / Warnings**: `ElMessage.warning('...')`
- **Success Confirmations**: `ElMessage.success('...')`
- **Error Alerts**: Handled centrally by `apiClient` response interceptor or explicit `ElMessage.error(...)`.

---

## Pre-commit Quality Gates

The repository enforces Git hooks using **Husky**:
1. `pre-commit`: Runs `lint-staged` with `eslint --fix` and `prettier --write`.
2. `commit-msg`: Enforces Conventional Commits via `commitlint`.
