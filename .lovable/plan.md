## Overview

Enable Lovable Cloud, add email/password + Google sign-in, per-user data isolation, and an admin role with a user-management page and Responsible AI controls.

## 1. Enable Lovable Cloud + configure auth

- Enable Lovable Cloud (Supabase under the hood).
- Configure email/password auth and Google OAuth via managed social auth.

## 2. Database schema (migration)

- `public.profiles` — `id (uuid PK → auth.users)`, `name`, `role_title`, `company`, `email`, timestamps. RLS: users read/update own row.
- `public.app_role` enum: `admin`, `user`.
- `public.user_roles` — `(user_id, role)` unique. RLS + `has_role(uuid, app_role)` SECURITY DEFINER function (per user-roles best practice — never store roles on profiles).
- `public.responsible_ai_settings` — single-row org policy (disclaimer text, bias notice, allow_export). RLS: all authenticated can SELECT, only admins can UPDATE.
- Per-user data tables to replace localStorage-only storage:
  - `metrics` (per user counters)
  - `prompts` (user's saved prompts library)
  - `actions` (kanban items)
  - `learning_progress`
  - `ai_history` (optional: last AI outputs per feature)
  - Each has `user_id uuid` default `auth.uid()`, RLS scoped to `auth.uid() = user_id`; admins can SELECT all via `has_role`.
- Trigger `on_auth_user_created` → insert profile row + assign default `user` role. First signup optionally seeded as `admin` via a follow-up manual insert (documented in chat).
- GRANTs on every new table per public-schema rules.

## 3. Routes

- `src/routes/auth.tsx` (public) — tabs for Sign in / Sign up (email+password) and "Continue with Google" via `lovable.auth.signInWithOAuth('google', …)`. Redirects to `/` on success; preserves `?redirect=` param.
- Move all existing feature routes under `src/routes/_authenticated/` so the integration-managed gate protects them. Keep `/auth` and a minimal public landing (or redirect `/` → `/auth` when signed out via the managed gate).
- `src/routes/_authenticated/admin/users.tsx` — admin-only: list profiles, assign/revoke `admin` role. Gated with a child `beforeLoad` calling a `requireSupabaseAuth` + `has_role` server fn.
- `src/routes/_authenticated/responsible-ai.tsx` — everyone sees the current policy; admins get an "Edit policy" form.

## 4. Server functions (`src/lib/*.functions.ts`)

- `getProfile`, `updateProfile` — self-scoped via `requireSupabaseAuth`.
- `getMyRoles`, `isAdmin` — reads `user_roles` for current user.
- `listUsers`, `setUserRole` — admin-only (verify `has_role(auth.uid(),'admin')` inside handler).
- `getResponsibleAISettings`, `updateResponsibleAISettings` (admin-only).
- Data fns for metrics/prompts/actions/learning — replace `useLocalStorage` calls with server-fn + TanStack Query reads.
- `generateAI` gets `.middleware([requireSupabaseAuth])` so anonymous callers can't burn credits.

## 5. Client wiring

- Root: register `onAuthStateChange` once, filtered to `SIGNED_IN`/`SIGNED_OUT`/`USER_UPDATED`, calling `router.invalidate()` + `queryClient.invalidateQueries()` (skip invalidate on sign-out).
- Top bar: show avatar/email + Sign out when signed in; Sign in link when out.
- Sidebar: conditionally render "Admin › Users" link when `isAdmin`.
- `src/start.ts`: append generated `attachSupabaseAuth` to `functionMiddleware`.
- Sign-out handler follows canonical 4-step teardown (cancelQueries → clear → signOut → navigate replace to `/auth`).

## 6. Migration of existing localStorage state

- On first sign-in, one-time migration hook copies existing localStorage (`metrics`, `prompts`, `actions`, `learning-progress`, `profile`) into the user's DB rows if the DB rows are empty, then flags done in localStorage. Keeps demo continuity.

## 7. First admin

- After enabling Cloud, I'll tell you how to grant yourself `admin` (one SQL insert into `user_roles`) so `/admin/users` becomes reachable.

## Out of scope

- Manager role, team/org multi-tenancy, SSO/SAML, password reset UI beyond Supabase default flow (can add `/reset-password` if wanted later).
