# State Management Guidelines

> State management best practices in Shorebird Console.

---

## Architecture: Two-Tier State Separation

1. **Server State (TanStack Vue Query)**
   - All asynchronous data fetched from `shorebird-server` belongs in TanStack Vue Query.
   - Do NOT duplicate API responses into Pinia stores.
   - Use `useQuery` for fetching, caching, and background refetching.
   - Use `useMutation` and `queryClient.invalidateQueries` for mutations (creating apps, promoting patches, rolling back).

2. **Client State (Pinia)**
   - Only UI / session state that does not live on the server belongs in Pinia.
   - `auth`: Stores the user's private access token and active selected app ID.
   - `app-config`: Stores UI preferences (sidebar collapsed state, dark mode via VueUse).
