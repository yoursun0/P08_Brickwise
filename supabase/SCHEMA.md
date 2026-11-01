# Brickwise schema

App Supabase clients set `db.schema` to `brickwise`:

- `src/lib/supabase/client.ts` — `createBrowserClient`
- `src/lib/supabase/server.ts` — `createServerClient`

`.from()` calls keep unqualified table names. PostgREST resolves them in `brickwise`, so this app does not read or write `public.*`.

Live tables, RLS, and the `on_auth_user_created_brickwise` trigger are already applied on helic-stg and helic-prod. Source of truth:

`/workspace/IT/platform/supabase-helic/brickwise_000*.sql`

`supabase/migrations/*.sql` and `supabase/seed.sql` are historical and still name `public`. Never re-apply those public migrations on the shared helic projects. OnlineGame owns `public.*`.
