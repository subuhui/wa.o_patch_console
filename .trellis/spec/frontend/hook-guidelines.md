# Hook & Data Fetching Guidelines

> Custom composables, Axios API client, and TanStack Vue Query patterns.

---

## Overview

Shorebird Console separates **server state** (managed via `@tanstack/vue-query` + Axios) from **client UI state**. All HTTP communications flow through a centralized Axios client.

---

## API Client Architecture

All network calls go through `apiClient` defined in [`src/api/client.ts`](file:///Users/xxz/shorebird/shorebird-console/src/api/client.ts).

### 1. Central Axios Instance
- `baseURL`: Configured with `import.meta.env.VITE_API_BASE_URL || '/api/v1'`.
- `timeout`: 30,000ms.
- Vite development proxy handles `/api` -> `http://127.0.0.1:8080`.

### 2. Request Interceptor (Auth Token)
```ts
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('shorebird_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error),
)
```

### 3. Response Interceptor (Error Routing & Auto-Logout)
- **401 Unauthorized**: Clears `shorebird_token`, shows `ElMessage.error`, and redirects to `/login`.
- **403 Forbidden**: Shows `ElMessage.error('权限不足，禁止访问')`.
- **404 Not Found**: Shows `ElMessage.warning('请求的资源不存在')`.
- **500+ Server Error**: Shows `ElMessage.error('服务端异常 (status): message')`.

---

## Data Fetching with Vue Query

### 1. Queries (`useQuery`)
Used for fetching and caching server data:

```ts
import { useQuery } from '@tanstack/vue-query'
import apiClient from '@/api/client'

const { data, isLoading } = useQuery<{ apps: AppMetadata[] }>({
  queryKey: ['apps'],
  queryFn: async () => {
    const res = await apiClient.get('/apps')
    return res.data
  },
})
```
*Real Examples*:
- [`src/features/apps/views/AppsListView.vue`](file:///Users/xxz/shorebird/shorebird-console/src/features/apps/views/AppsListView.vue#L26-L32)
- [`src/features/releases/views/ReleasesView.vue`](file:///Users/xxz/shorebird/shorebird-console/src/features/releases/views/ReleasesView.vue#L43-L49)

### 2. Mutations (`useMutation`)
Used for creating, updating, or deleting resources. Always invalidate relevant query keys upon success:

```ts
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ElMessage } from 'element-plus'

const queryClient = useQueryClient()

const createMutation = useMutation({
  mutationFn: (payload: { display_name: string }) => apiClient.post('/apps', payload),
  onSuccess: () => {
    ElMessage.success('应用创建成功')
    queryClient.invalidateQueries({ queryKey: ['apps'] })
  },
})
```
*Real Example*: [`src/features/apps/views/AppsListView.vue`](file:///Users/xxz/shorebird/shorebird-console/src/features/apps/views/AppsListView.vue#L45-L53)

---

## Composable Conventions

1. **Naming**: Composables must start with `use` (e.g. `useAuthStore`, `useAppConfigStore`).
2. **Third-party Composables**:
   - `useRouter()`, `useRoute()` from `vue-router`.
   - `useDark()`, `useToggle()` from `@vueuse/core` for dark mode persistence.
3. **Internal API Routing**:
   - When consuming backend URLs containing hostnames (such as speedtest / download URLs), normalize URLs to relative `/api/` paths if they match the internal API to prevent browser CORS issues.
   *Real Example*: [`src/features/diagnostics/views/DiagnosticsView.vue`](file:///Users/xxz/shorebird/shorebird-console/src/features/diagnostics/views/DiagnosticsView.vue#L19-L26)

---

## Common Mistakes

1. ❌ **Do not create ad-hoc axios instances**: Always use `apiClient` from `@/api/client` so request/response interceptors apply.
2. ❌ **Do not forget query invalidation**: Mutating data without calling `queryClient.invalidateQueries` leads to stale UI.
