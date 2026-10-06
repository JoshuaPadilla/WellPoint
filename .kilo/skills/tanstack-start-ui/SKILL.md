---
name: tanstack-start-ui
description: Use when writing or editing any frontend code in the WellPoint repo — adding routes, components, pages, styling, data loading, server functions, or API routes. Trigger when building UI, fixing build/lint errors, or working in frontend/src. Encodes this repo's exact stack and conventions.
---

# TanStack Start UI — Build in This Repo

The app lives in `frontend/`. Match the existing conventions exactly; do not introduce a different router, CSS framework, or state library.

## Stack (already installed)

- **Framework**: TanStack Start + React 19
- **Router**: TanStack Router, file-based routes in `frontend/src/routes/`
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` and `@import "tailwindcss"` in `frontend/src/styles.css`
- **Build**: Vite 8, TypeScript 6
- **Lint/format**: ESLint (`@tanstack/eslint-config`) + Prettier

## Commands

Run from `frontend/` (or use the `workdir` parameter):

```bash
npm run dev              # Vite dev server on http://localhost:3000
npm run build            # production build
npm run lint             # ESLint
npm run format           # prettier --write . && eslint --fix
npm run check            # prettier --check .
npm run generate-routes  # regenerate routeTree.gen.ts (tsr generate)
```

After adding or renaming a route file, the router plugin regenerates `src/routeTree.gen.ts` automatically in dev; if it does not, run `npm run generate-routes`.

## Conventions

- **No semicolons, single quotes** (match existing files).
- Components are function declarations named after the route/feature.
- Import via the `#/*` alias (maps to `./src/*`) or relative paths, matching nearby files.
- Keep route components thin; extract reusable UI into `frontend/src/components/` and domain logic into `frontend/src/lib/` or `frontend/src/data/` as needed.
- Never hand-edit `src/routeTree.gen.ts` — it is generated.

## Adding a route

Create `frontend/src/routes/<name>.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/<name>')({ component: <Name> })

function <Name>() {
  return <div className="p-8">...</div>
}
```

Nested/layout routes use a directory with `route.tsx`; the root layout is `frontend/src/routes/__root.tsx`. Navigate with `<Link to="/<name>">` from `@tanstack/react-router`.

## Loading data

Prefer route `loader`s for page data and `Route.useLoaderData()` in the component. Keep a bundled fallback so the page never breaks when the network is unavailable:

```tsx
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    try {
      return await fetchStatus()
    } catch {
      return seedStatus()
    }
  },
  component: Dashboard,
})
```

## Server functions and API routes

Server functions (`createServerFn` from `@tanstack/react-start`) are for internal server-side logic. API routes use the `server.handlers` property on a route definition:

```tsx
export const Route = createFileRoute('/api/status')({
  server: {
    handlers: {
      GET: () => json({ ok: true }),
    },
  },
})
```

Use API routes when the endpoint should be callable outside the app (e.g., a judge or integration hitting a URL). Otherwise prefer server functions.

## Styling

- Tailwind utility classes inline. Add design tokens/theme in `frontend/src/styles.css` using Tailwind v4 `@theme` if needed.
- Do not add a component library unless the team agrees; keep the bundle small and the demo fast.
- Ensure mobile-first layouts — judges may view on a phone.

## Before finishing any frontend change

Run and fix all of:

```bash
npm run lint
npm run build
```

Do not leave `build` failing. A broken build is a broken demo. For deployment and smoke testing, use the `hackathon-qa-deploy` skill.

## Gotchas

- Dev server port is **3000**; check for port conflicts if the page will not load.
- TanStack Devtools render in the root route — leave them in dev, but they are not part of the judged UI.
- `frontend/src/routes/login.tsx` and `register.tsx` are currently empty placeholders; fill them only if auth is a judged feature.
