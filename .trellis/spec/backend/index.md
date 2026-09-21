# Backend Development Guidelines

> Note: Shorebird Console is a pure frontend Single Page Application (SPA).

---

## Overview

This repository (`shorebird-console`) contains only the Vue 3 web frontend application.

The backend API server is implemented as an independent Go service in the sibling repository [`shorebird-server`](file:///Users/xxz/shorebird/shorebird-server).

For backend API contracts and schemas used by the console, refer to:
- [`src/api/openapi.yaml`](file:///Users/xxz/shorebird/shorebird-console/src/api/openapi.yaml) (OpenAPI 3.0 specification)
- [`src/api/client.ts`](file:///Users/xxz/shorebird/shorebird-console/src/api/client.ts) (Frontend Axios client & proxy)
