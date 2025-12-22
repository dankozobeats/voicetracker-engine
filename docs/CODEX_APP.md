# CODEX_APP — Application Auth Layer

This file codifies the assumptions that the Next.js application layer makes about Supabase authentication. Changes to the auth stack must preserve this contract.

## 1. Environment variables
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: drive the browser-only Supabase client and must never be coupled with server secrets.
- `NEXT_PUBLIC_APP_URL`: defines public callbacks (`/auth/confirm`, `/auth/reset-password`) and is required on the client for every email flow.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: used only on the server (API routes, middleware, protected pages) via `lib/supabase/server.ts`. These values must remain confidential and must not leak to client code.

## 2. Supabase client boundary
- `lib/supabase/client.ts` exposes a browser-only client using the anon key. Forms import this helper explicitly so that service role credentials never reach the bundle.
- `lib/supabase/server.ts` provides:
  1. A lightweight `supabase` instance for API routes that only needs the service role key.
  2. `createSupabaseServerClient()` that wires `@supabase/ssr`'s cookie-aware helpers into page and middleware contexts.
- `lib/supabase/index.ts` re-exports the pieces so existing modules continue to import from `@/lib/supabase` without revealing secrets to the client.

## 3. Auth routes under `/app/auth/*`
Each route is a server component that delegates only the interactive bits to client components:
- `/auth/login`: collects credentials, reads an optional `redirect` param, and signs in with `signInWithPassword`. Successful logins use the `redirect` parameter (only internal paths) or default to `/dashboard`.
- `/auth/register`: signs up with `signUp`, requests a confirm email via `emailRedirectTo`, and notifies the user to check their inbox.
- `/auth/confirm`: runs `supabase.auth.getSessionFromUrl({ storeSession: true })` client-side, sets the session, then redirects to `/dashboard`. Errors render an inline message.
- `/auth/forgot-password`: calls `resetPasswordForEmail` with `NEXT_PUBLIC_APP_URL/auth/reset-password` so Supabase can bring the user back to the app. Success and error states are surfaced immediately.
- `/auth/reset-password`: validates the recovery token via `getSessionFromUrl`, prompts for a new password, and calls `updateUser`. Invalid tokens show guidance instead of auto-redirecting.
- `/auth/change-password`: fetches the current session on the server (via `createSupabaseServerClient`) before rendering a client form that updates the password. If no session exists, the page prompts the user to log back in.

## 4. Middleware rules (`middleware.ts`)
- Runs only on `/dashboard/:path*`, `/auth/:path*`, and `/api/:path*` to avoid interfering with public assets.
- Uses the same service role credentials to read Supabase cookies through `createServerClient()`.
- Redirects unauthenticated page requests to `/auth/login?redirect=<original>` while preserving the original path and query string.
- Rejects unauthenticated API requests with `{ error: 'Unauthorized' }` and a `401` status to keep machine consumers predictable.
- Sends authenticated users away from `/auth/*` by redirecting them to `/dashboard`.

## 5. Security posture
- Server-only secrets remain in `lib/supabase/server.ts` and `middleware.ts`; client bundles import exclusively from `lib/supabase/client.ts` and never from the service role helper.
- Every redirect landing page reads Supabase session state (via helpers or Supabase JS) and does not trust raw query strings beyond validating that redirects begin with `/`.
- Authentication state always derives from Supabase sessions rather than client-side `userId` payloads.
