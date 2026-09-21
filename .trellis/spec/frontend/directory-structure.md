# Directory Structure

> Frontend directory organization and architecture for Shorebird Console.

---

## Overview

The application follows a **Domain-Driven Feature Layout (Vertical Slice)** architecture built with Vue 3, Vite, TypeScript, and Element Plus.

---

## Directory Layout

```
src/
├── api/                      # API client, OpenAPI specification, and generated hooks
│   ├── client.ts             # Axios client with auth interceptors
│   ├── generated/            # Orval generated endpoints, models, zod schemas
│   └── openapi.yaml          # Shorebird Server OpenAPI 3.0 contract
├── assets/                   # Static assets and global styles
│   └── styles/               # Main styles and variables
├── components/               # Shared / Reusable presentation components
│   ├── common/               # General UI components (e.g. StatusTag)
│   └── layout/               # Header, Sidebar, Nav components
├── features/                 # Domain-driven feature modules
│   ├── apps/                 # App management
│   ├── auth/                 # Authentication & token management
│   ├── channels/             # Patch channels
│   ├── diagnostics/          # Speedtest & network diagnostics
│   ├── patches/              # Patch lifecycle & promote/rollback
│   └── releases/             # Base releases & artifacts
├── layouts/                  # Route layouts (DefaultLayout, BlankLayout)
├── mocks/                    # MSW handlers & browser/node workers
├── plugins/                  # Third-party plugins (Vue Query, Sentry)
├── router/                   # Vue Router definitions & auth guards
├── stores/                   # Pinia stores (auth, app-config)
├── types/                    # Global TypeScript interfaces
├── App.vue                   # Application root
└── main.ts                   # App entrypoint
```

---

## Module Organization

- **Vertical Slice**: Each domain feature lives under `src/features/<feature-name>/`.
- Inside each feature, views are under `views/` and feature-specific components under `components/`.
- **Server State**: Managed using TanStack Vue Query (`@tanstack/vue-query`) and generated Orval hooks.
- **Client State**: Kept lightweight in Pinia stores under `src/stores/`.
