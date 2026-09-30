# swiftbets-dashboard

[![ci](https://github.com/remonenaidoo/swiftbets-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/remonenaidoo/swiftbets-dashboard/actions/workflows/ci.yml)

The SwiftBets operations UI: live bet feed, anomaly timeline, Steward incident reports with approve/reject, and the fault-injection panel.

## Stack

React 19, TypeScript, Vite, React Router 7, TanStack Query for server state, Jotai for small client-owned UI state, Tailwind v4 with a tokens file (`src/shared/ui/tokens.css`), clsx. Vitest and Testing Library for components.

## Structure

```
src/app/{routes,providers}                         composition only
src/features/<feature>/{components,hooks,api,state,types}
src/shared/{ui,lib,hooks}                          tokens, primitives, the API client
```

Components are presentational; data and effects live in hooks. All requests go through `shared/lib/apiClient.ts`: one error path (the platform error envelope becomes a typed `ApiError`), the CSRF header on every mutation, and a single `onUnauthorized` hook for the re-auth prompt instead of per-call 401 handling.

## Security

Served by unprivileged nginx. Every HTML response gets a fresh CSP nonce: Vite writes a placeholder nonce onto its script tags, nginx replaces it with `$request_id` and sends `script-src 'nonce-…' 'strict-dynamic'`. No inline styles (ESLint enforces it), frame denial, no-referrer, HSTS.

## Develop

```bash
npm ci
npm run dev        # http://localhost:7110, /api proxied to the gateway on :7100
npm test
npm run lint && npm run typecheck && npm run build
```

## License

MIT
