import type { App } from 'vue'
import type { Router } from 'vue-router'
import * as Sentry from '@sentry/vue'

export function setupSentry(app: App, router: Router): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN

  if (!dsn) {
    // Sentry is disabled if DSN is not provided
    return
  }

  Sentry.init({
    app,
    dsn,
    integrations: [Sentry.browserTracingIntegration({ router }), Sentry.replayIntegration()],
    // Tracing
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  })
}
