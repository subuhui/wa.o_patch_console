# State Management Guidelines

> Client state, auth lifecycle, and global application state in Shorebird Console.

---

## Overview

State is partitioned into three clear boundaries:
1. **Server State**: Managed by `@tanstack/vue-query` (cached, auto-refreshed, invalidated via keys).
2. **Global Client State**: Managed by Pinia (`pinia`) stores using the Composition API syntax.
3. **Local Component State**: Managed by standard Vue `ref()` / `computed()`.

---

## Pinia Stores

Pinia stores are located in [`src/stores/`](file:///Users/xxz/shorebird/shorebird-console/src/stores/) and defined using `defineStore('storeName', () => { ... })`.

### 1. Auth Store (`useAuthStore`)
Manages the user token and active application ID with `localStorage` synchronization.

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('shorebird_token'))
  const currentAppId = ref<string | null>(localStorage.getItem('shorebird_current_app_id'))

  const isAuthenticated = computed(() => Boolean(token.value && token.value.trim().length > 0))

  function setToken(newToken: string) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('shorebird_token', newToken)
    } else {
      localStorage.removeItem('shorebird_token')
    }
  }

  function setCurrentAppId(appId: string | null) {
    currentAppId.value = appId
    if (appId) {
      localStorage.setItem('shorebird_current_app_id', appId)
    } else {
      localStorage.removeItem('shorebird_current_app_id')
    }
  }

  function logout() {
    setToken('')
    setCurrentAppId(null)
  }

  return { token, currentAppId, isAuthenticated, setToken, setCurrentAppId, logout }
})
```
*Real Example*: [`src/stores/auth.ts`](file:///Users/xxz/shorebird/shorebird-console/src/stores/auth.ts)

### 2. App Config Store (`useAppConfigStore`)
Manages UI preferences such as sidebar collapse state and Dark Mode toggling using `@vueuse/core`:

```ts
export const useAppConfigStore = defineStore('app-config', () => {
  const isCollapse = ref(false)
  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
  })
  const toggleDark = useToggle(isDark)

  function toggleSidebar() {
    isCollapse.value = !isCollapse.value
  }

  return { isCollapse, isDark, toggleDark, toggleSidebar }
})
```
*Real Example*: [`src/stores/app-config.ts`](file:///Users/xxz/shorebird/shorebird-console/src/stores/app-config.ts)

---

## Auth Navigation Guards & Protection

Route protection is enforced via `router.beforeEach` in [`src/router/index.ts`](file:///Users/xxz/shorebird/shorebird-console/src/router/index.ts):

```ts
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // Unauthenticated user attempting to access protected route
  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    // Authenticated user attempting to visit /login
    next({ name: 'apps' })
  } else {
    next()
  }
})
```

---

## Best Practices

1. **Keep Pinia Lean**: Only store genuinely global state (auth, global layout settings) in Pinia. Do not cache server entities (apps, releases, patches) in Pinia; rely on Vue Query instead.
2. **Synchronize Critical State to localStorage**: Token and current selected App ID must survive page reloads.
