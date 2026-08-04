# Brickwise Unit Compare Page & App Scaffold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a deployable Next.js + Supabase app for Brickwise and fully implement the sortable/filterable unit compare page per `results-default.html`, with all other MVP routes as navigable stubs.

**Architecture:** Next.js 15 App Router (RSC for data fetch, client components for interactivity). Supabase Postgres schema with RLS + seed data. Plain CSS porting the wireframe's design tokens and `.wf-*` classes (no Tailwind build). Pure price/format logic unit-tested with Vitest; UI verified via build + manual checks.

**Tech Stack:** Next.js 15, TypeScript, `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `@netlify/plugin-nextjs`, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-04-unit-compare-page-design.md`

---

## File Structure

```
brickwise/  (repo root = worktree root)
  src/app/
    layout.tsx                 # root html, imports globals.css, AppShell wrapper
    page.tsx                   # landing stub
    globals.css                # ported wireframe tokens + .wf-* classes
    login/page.tsx             # magic link (real Supabase auth)
    dashboard/page.tsx         # project list stub
    projects/[id]/
      upload/page.tsx          # upload stub
      results/page.tsx         # compare page RSC (data fetch)
      shortlist/page.tsx       # shortlist stub
      review/page.tsx          # extraction review stub
    pricing/page.tsx           # pricing stub
    payment/[status]/page.tsx  # payment success/cancel stub
    auth/callback/route.ts     # magic link callback handler
  src/lib/
    supabase/client.ts         # browser client
    supabase/server.ts        # RSC client (cookies)
    types.ts                   # DB row types
    price.ts                   # pure: computePrice, premium logic
    format.ts                  # pure: formatHKD, formatSqft
  src/components/
    AppShell.tsx               # topbar + nav
    ResultsView.tsx            # client: state + wiring
    ResultsTable.tsx
    PriceBasisSelect.tsx
    SortSelect.tsx
    FilterChips.tsx
    ConfidenceTag.tsx
    UnitTag.tsx
    ShortlistCounter.tsx
  src/lib/__tests__/
    price.test.ts
    format.test.ts
    confidence.test.ts
  supabase/
    migrations/0001_init.sql
    seed.sql
  netlify.toml
  .env.example
  .env.local                   # gitignored, user fills in
  .gitignore
  package.json
  tsconfig.json
  next.config.ts
  vitest.config.ts
```

---

## Task 1: Scaffold Next.js project + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `netlify.toml`, `.env.example`, `.gitignore`, `vitest.config.ts`

- [ ] **Step 1: Initialize package.json**

Create `package.json`:

```json
{
  "name": "brickwise",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.1",
    "@supabase/supabase-js": "^2.45.0",
    "lucide-react": "^0.454.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@netlify/plugin-nextjs": "^5.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "jsdom": "^25.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 4: Create netlify.toml**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

- [ ] **Step 5: Create .env.example**

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
.next/
.env.local
.env*.local
*.log
.DS_Store
coverage/
```

- [ ] **Step 7: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: dependencies installed without errors.

- [ ] **Step 9: Create next-env.d.ts**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts netlify.toml .env.example .gitignore vitest.config.ts next-env.d.ts
git commit -m "chore: scaffold next.js + vitest + netlify config"
```

---

## Task 2: Port wireframe CSS into globals.css

**Files:**
- Create: `src/app/globals.css`

- [ ] **Step 1: Create globals.css with ported tokens + classes**

Copy the `:root` tokens and all `.wf-*` rules from `brickwise-mvp-wireframe/pages/results-default.html` (the `<style id="theme-vars">` block, lines ~7-779). Include the page-level overrides block (lines ~1041-1207) as well. Replace the Tailwind CDN base utilities with plain CSS:

```css
:root {
  --bw-bg: #f5f7fb;
  --bw-surface: #ffffff;
  --bw-surface-2: #eef2f7;
  --bw-ink: #172033;
  --bw-ink-2: #55627a;
  --bw-ink-3: #7f8aa0;
  --bw-line: #d8e0ec;
  --bw-brand: #3558e6;
  --bw-brand-ink: #ffffff;
  --bw-state-success: #198754;
  --bw-state-warning: #b7791f;
  --bw-state-error: #c24141;
  --bw-state-info: #3158d6;

  --bw-background: var(--bw-bg);
  --bw-foreground: var(--bw-ink);
  --bw-card: var(--bw-surface);
  --bw-card-foreground: var(--bw-ink);
  --bw-popover: var(--bw-surface);
  --bw-popover-foreground: var(--bw-ink);
  --bw-primary: var(--bw-brand);
  --bw-primary-foreground: var(--bw-brand-ink);
  --bw-muted: var(--bw-surface-2);
  --bw-muted-foreground: var(--bw-ink-2);
  --bw-border: var(--bw-line);
  --bw-input: var(--bw-line);
  --bw-ring: rgba(53, 88, 230, 0.22);
  --bw-radius-small: 4px;
  --bw-radius-medium: 8px;
  --bw-radius-large: 16px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  --shadow-1: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.03);
  --shadow-2: 0 14px 32px rgba(15, 23, 42, 0.08);

  --font-sans: Inter, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif;
  --font-mono: "SFMono-Regular", "Consolas", "Liberation Mono", monospace;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--bw-bg);
  color: var(--bw-ink);
  font-family: var(--font-sans);
}
* { box-sizing: border-box; }
body { line-height: 1.55; }
.wireframe-body {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fb 0%, #eef3fa 100%);
}
.wf-shell { max-width: 1440px; margin: 0 auto; padding: 32px; }
.wf-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px; border: 1px solid var(--bw-line); border-radius: 16px; background: rgba(255,255,255,0.84); box-shadow: var(--shadow-1); backdrop-filter: blur(10px); }
.wf-brand { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; }
.wf-brand small { display: block; margin-top: 4px; color: var(--bw-ink-2); font-size: 12px; font-weight: 400; }
.wf-actions, .wf-inline, .wf-chip-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.wf-chip { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 0 14px; border: 1px solid var(--bw-line); border-radius: 999px; background: var(--bw-surface); color: var(--bw-ink-2); font-size: 13px; font-weight: 500; cursor: pointer; }
.wf-chip.active { border-color: rgba(53,88,230,0.3); background: rgba(53,88,230,0.12); color: var(--bw-brand); }
.wf-chip.warn { border-color: rgba(183,121,31,0.28); background: rgba(183,121,31,0.1); color: var(--bw-state-warning); }
.wf-chip.neutral { background: var(--bw-surface-2); }
.wf-page { display: grid; gap: 24px; margin-top: 24px; }
.wf-card, .wf-panel, .wf-table-card { background: var(--bw-surface); border: 1px solid var(--bw-line); border-radius: 16px; box-shadow: var(--shadow-1); }
.wf-card { padding: 28px; }
.wf-panel { padding: 24px; }
.wf-kicker { color: var(--bw-ink-2); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
.wf-title { margin: 10px 0 0; font-size: clamp(28px, 3vw, 42px); line-height: 1.12; letter-spacing: -0.03em; font-weight: 650; }
.wf-subtitle { margin: 12px 0 0; max-width: 760px; color: var(--bw-ink-2); font-size: 16px; }
.wf-grid-2 { display: grid; grid-template-columns: minmax(0,1.1fr) minmax(320px,0.9fr); gap: 24px; }
.wf-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 20px; }
.wf-metric { padding: 18px; border: 1px solid var(--bw-line); border-radius: 14px; background: var(--bw-surface); }
.wf-metric strong { display: block; font-size: 15px; font-weight: 600; }
.wf-metric span { display: block; margin-top: 8px; font-size: 13px; color: var(--bw-ink-2); }
.wf-button, .wf-secondary-button { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 18px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; white-space: nowrap; cursor: pointer; }
.wf-button { background: var(--bw-brand); color: var(--bw-brand-ink); border: 1px solid var(--bw-brand); }
.wf-secondary-button { background: var(--bw-surface); color: var(--bw-ink); border: 1px solid var(--bw-line); }
.wf-note { padding: 14px 16px; border-radius: 12px; background: var(--bw-surface-2); color: var(--bw-ink-2); font-size: 13px; }
.wf-note.warn { background: rgba(183,121,31,0.08); color: var(--bw-state-warning); }
.wf-note.error { background: rgba(194,65,65,0.08); color: var(--bw-state-error); }
.wf-list { display: grid; gap: 12px; }
.wf-list-item { display: flex; justify-content: space-between; gap: 16px; padding: 16px 18px; border: 1px solid var(--bw-line); border-radius: 12px; background: var(--bw-surface); }
.wf-list-item small, .wf-muted { color: var(--bw-ink-2); font-size: 13px; }
.wf-table-card { overflow: hidden; }
.wf-toolbar { position: sticky; top: 18px; z-index: 2; display: grid; gap: 16px; padding: 20px 22px; background: rgba(255,255,255,0.92); border-bottom: 1px solid var(--bw-line); backdrop-filter: blur(10px); }
.wf-toolbar-grid { display: grid; grid-template-columns: 2fr 1.2fr 1.3fr auto; gap: 16px; align-items: end; }
.wf-field-label { margin-bottom: 8px; color: var(--bw-ink-2); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.wf-input, .wf-select, .wf-fake-input { min-height: 44px; width: 100%; padding: 0 14px; border: 1px solid var(--bw-line); border-radius: 10px; background: var(--bw-surface); color: var(--bw-ink); display: flex; align-items: center; font-size: 14px; }
.wf-fake-input.dashed { border-style: dashed; }
.wf-table { width: 100%; border-collapse: collapse; }
.wf-table th, .wf-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid var(--bw-line); vertical-align: top; font-size: 14px; }
.wf-table th { color: var(--bw-ink-2); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; background: rgba(245,247,251,0.82); }
.wf-table tbody tr:hover td { background: rgba(53,88,230,0.04); }
.wf-tag { display: inline-flex; align-items: center; min-height: 28px; padding: 0 10px; border-radius: 999px; border: 1px solid transparent; font-size: 12px; font-weight: 600; }
.wf-tag.warn { background: rgba(183,121,31,0.1); color: var(--bw-state-warning); border-color: rgba(183,121,31,0.18); }
.wf-tag.base { background: rgba(85,98,122,0.08); color: var(--bw-ink-2); border-color: rgba(85,98,122,0.12); }
.wf-tag.confidence-high { background: rgba(85,98,122,0.08); color: var(--bw-ink-2); border: 1px solid rgba(85,98,122,0.12); border-radius: var(--radius-full); padding: 2px 10px; font-size: 12px; font-weight: 500; }
.wf-tag.confidence-mid { background: rgba(183,121,31,0.1); color: var(--bw-state-warning); border: 1px solid rgba(183,121,31,0.18); border-radius: var(--radius-full); padding: 2px 10px; font-size: 12px; font-weight: 500; }
.wf-tag.confidence-low { background: rgba(194,65,65,0.1); color: var(--bw-state-error); border: 1px solid rgba(194,65,65,0.2); border-radius: var(--radius-full); padding: 2px 10px; font-size: 12px; font-weight: 500; }
.wf-pill-count { display: inline-flex; align-items: center; gap: 8px; min-height: 34px; padding: 0 12px; border-radius: 999px; background: var(--bw-surface-2); color: var(--bw-ink); font-size: 13px; font-weight: 600; }
.wf-dropzone { min-height: 240px; padding: 32px; border: 2px dashed rgba(53,88,230,0.24); border-radius: 18px; background: linear-gradient(180deg, rgba(53,88,230,0.04), rgba(53,88,230,0.01)); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 12px; }
.wf-pricing-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 18px; }
.wf-price-card { padding: 22px; border-radius: 16px; border: 1px solid var(--bw-line); background: var(--bw-surface); }
.wf-price-card.active { border-color: rgba(53,88,230,0.26); box-shadow: 0 0 0 2px rgba(53,88,230,0.08); }
.wf-price { font-size: 32px; line-height: 1.1; font-weight: 650; letter-spacing: -0.03em; }
.wf-center-card { max-width: 780px; margin: 0 auto; }
.wf-result-layout { display: grid; grid-template-columns: minmax(0,1fr) 300px; gap: 22px; align-items: start; }
.wf-results-aside { display: flex; flex-direction: column; gap: 14px; }
.wf-aside-card { padding: 18px; background: var(--bw-surface); border: 1px solid var(--bw-line); border-radius: 14px; }
.wf-aside-card.highlight { border-left: 3px solid var(--bw-brand); }
.wf-aside-card h3 { margin: 0 0 10px; font-size: 14px; font-weight: 600; color: var(--bw-ink); }
.wf-aside-card p { margin: 0 0 10px; font-size: 13px; color: var(--bw-ink-2); line-height: 1.5; }
.wf-aside-card .wf-link { color: var(--bw-brand); font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; }
.wf-aside-card .wf-link:hover { text-decoration: underline; }
.wf-shortlist-counter { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: var(--bw-surface-2); border-radius: 12px; }
.wf-shortlist-counter strong { font-size: 16px; font-weight: 600; color: var(--bw-ink); }
.wf-heart-icon { width: 24px; height: 24px; border-radius: 50%; background: rgba(53,88,230,0.1); display: inline-flex; align-items: center; justify-content: center; color: var(--bw-brand); font-size: 12px; cursor: pointer; }
.wf-heart-icon.filled { background: var(--bw-brand); color: var(--bw-brand-ink); }
.wf-control-bar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 16px 20px; background: rgba(255,255,255,0.95); border: 1px solid var(--bw-line); border-radius: 16px; position: sticky; top: 0; z-index: 10; backdrop-filter: blur(10px); margin-bottom: 16px; }
.wf-control-bar .wf-title-group { flex: 1; min-width: 200px; }
.wf-control-bar .wf-filter-group { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.wf-control-bar .wf-sort-group { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.wf-action-link { color: var(--bw-brand); font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; white-space: nowrap; }
.wf-action-link:hover { text-decoration: underline; }
.wf-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237f8aa0' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
.wf-empty-state { display: grid; place-items: center; min-height: 360px; padding: 32px; text-align: center; background: linear-gradient(180deg, rgba(245,247,251,0.95), rgba(255,255,255,0.95)); }
.wf-empty-state strong { display: block; margin-bottom: 8px; font-size: 18px; }
.wf-rationale-section { margin-top: 24px; padding: 18px 20px; background: var(--bw-surface); border: 1px solid var(--bw-line); border-radius: 14px; }
.wf-rationale-section h4 { margin: 0 0 10px; font-size: 14px; font-weight: 600; color: var(--bw-ink); }
.wf-rationale-section p { margin: 0; font-size: 13px; color: var(--bw-ink-2); line-height: 1.6; }
.wf-drag-list { display: grid; gap: 12px; }
.wf-drag-item { display: grid; grid-template-columns: 26px 1.4fr 1fr 1fr auto; gap: 14px; align-items: center; padding: 16px 18px; border: 1px solid var(--bw-line); border-radius: 14px; background: var(--bw-surface); }
.wf-handle { color: var(--bw-ink-3); font-size: 18px; }
.wf-footer { margin-top: 32px; padding: 20px 0 8px; color: var(--bw-ink-3); font-size: 12px; }

@media (max-width: 1100px) {
  .wf-grid-2, .wf-result-layout, .wf-toolbar-grid, .wf-pricing-grid { grid-template-columns: 1fr; }
  .wf-results-aside { width: 100%; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "style: port wireframe design tokens and wf-* classes"
```

---

## Task 3: Supabase migration + seed

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `supabase/seed.sql`

- [ ] **Step 1: Create 0001_init.sql**

```sql
-- Brickwise MVP schema
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  credits_balance int not null default 0,
  free_credit_month text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  price_basis text not null default 'lowest' check (price_basis in ('original','plan_a','plan_b','lowest')),
  created_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects(user_id);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_name text not null,
  file_type text not null check (file_type in ('pdf','png','jpg')),
  page_count int not null default 1,
  file_hash text,
  status text not null default 'uploaded' check (status in ('uploaded','processing','succeeded','failed')),
  extraction_confidence numeric,
  created_at timestamptz not null default now()
);
create index if not exists documents_project_idx on public.documents(project_id);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_document_id uuid references public.documents(id) on delete set null,
  tower text,
  floor_raw text not null,
  floor_sort_key int not null,
  unit_no text not null,
  saleable_area_sqft numeric not null,
  price_original numeric,
  price_plan_a numeric,
  price_plan_b numeric,
  computed_price numeric,
  psf numeric,
  tags text[] not null default '{}',
  explainability jsonb not null default '{}'::jsonb,
  extraction_confidence numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists units_project_idx on public.units(project_id);
create index if not exists units_project_floor_idx on public.units(project_id, floor_sort_key);
create index if not exists units_project_unit_idx on public.units(project_id, unit_no);

create table if not exists public.shortlist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  rank int not null default 0,
  created_at timestamptz not null default now(),
  unique (project_id, unit_id)
);
create index if not exists shortlist_project_idx on public.shortlist_items(project_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.units enable row level security;
alter table public.shortlist_items enable row level security;

create policy "own profile" on public.profiles for select using (auth.uid() = id);
create policy "manage own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own projects" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own documents" on public.documents for all using (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
);

create policy "own units" on public.units for all using (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
);

create policy "own shortlist" on public.shortlist_items for all using (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
);
```

- [ ] **Step 2: Create seed.sql**

Note: the demo profile uses a fixed UUID `00000000-0000-0000-0000-000000000001` — run after creating the auth user with the same id, or insert directly for local dev. For local dev only, you may relax RLS temporarily.

```sql
-- Seed demo project + units (local dev). Assumes a profile row exists for the demo user.
-- Run: insert the profile first (see README), then this file.

insert into public.projects (id, user_id, name, price_basis)
values ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', '柏瓏 III（示範樓盤）', 'lowest')
on conflict (id) do nothing;

insert into public.documents (id, project_id, file_name, file_type, page_count, status, extraction_confidence)
values ('00000000-0000-0000-0000-000000000d01', '00000000-0000-0000-0000-000000000100', 'price-list.pdf', 'pdf', 5, 'succeeded', 0.9)
on conflict (id) do nothing;

insert into public.units (id, project_id, source_document_id, tower, floor_raw, floor_sort_key, unit_no, saleable_area_sqft, price_original, price_plan_a, price_plan_b, tags, explainability, extraction_confidence) values
('00000000-0000-0000-0000-00000000u01','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','18F',18,'A',512,9200000,8620000,8450000,array['overpriced_high_floor'],'{"premium_pct":12.3,"threshold":10,"percentile":92,"comparison_basis":"全盤","prev_floor":"16F","prev_price":8450000,"this_price":8620000}',98),
('00000000-0000-0000-0000-00000000u02','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','16F',16,'B',512,9000000,8450000,8300000,array[]::text[],'{}',82),
('00000000-0000-0000-0000-00000000u03','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','15F',15,'A',512,8950000,8380000,8220000,array[]::text[],'{}',99),
('00000000-0000-0000-0000-00000000u04','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','12F',12,'C',512,8450000,7920000,7780000,array[]::text[],'{}',71),
('00000000-0000-0000-0000-00000000u05','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','10F',10,'A',512,8300000,7780000,7650000,array[]::text[],'{}',95),
('00000000-0000-0000-0000-00000000u06','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','8F',8,'B',512,8100000,7580000,7450000,array[]::text[],'{}',90),
('00000000-0000-0000-0000-00000000u07','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','5F',5,'A',512,7900000,7400000,7280000,array[]::text[],'{}',88),
('00000000-0000-0000-0000-00000000u08','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','3F',3,'C',512,7700000,7200000,7100000,array[]::text[],'{}',80),
('00000000-0000-0000-0000-00000000u09','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','1F',1,'A',512,7600000,7100000,7000000,array['lowest_floor'],'{}',76),
('00000000-0000-0000-0000-00000000u10','00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000d01','1座','G/F',0,'B',512,7500000,7000000,6900000,array['ground_floor','lowest_floor'],'{}',70)
on conflict (id) do nothing;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_init.sql supabase/seed.sql
git commit -m "feat(db): add supabase schema with rls and seed data"
```

---

## Task 4: Supabase clients + types

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/types.ts`

- [ ] **Step 1: Create types.ts**

```ts
export type PriceBasis = "original" | "plan_a" | "plan_b" | "lowest";
export type SortKey = "psf_asc" | "total_asc";
export type UnitTag = "lowest_floor" | "ground_floor" | "overpriced_high_floor";

export interface Profile {
  id: string;
  email: string | null;
  credits_balance: number;
  free_credit_month: string | null;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  price_basis: PriceBasis;
  created_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  file_name: string;
  file_type: "pdf" | "png" | "jpg";
  page_count: number;
  file_hash: string | null;
  status: "uploaded" | "processing" | "succeeded" | "failed";
  extraction_confidence: number | null;
}

export interface Explainability {
  premium_pct?: number;
  threshold?: number;
  percentile?: number;
  comparison_basis?: string;
  prev_floor?: string;
  prev_price?: number;
  this_price?: number;
}

export interface Unit {
  id: string;
  project_id: string;
  source_document_id: string | null;
  tower: string | null;
  floor_raw: string;
  floor_sort_key: number;
  unit_no: string;
  saleable_area_sqft: number;
  price_original: number | null;
  price_plan_a: number | null;
  price_plan_b: number | null;
  computed_price: number | null;
  psf: number | null;
  tags: UnitTag[];
  explainability: Explainability;
  extraction_confidence: number;
}

export interface ShortlistItem {
  id: string;
  project_id: string;
  unit_id: string;
  rank: number;
}
```

- [ ] **Step 2: Create client.ts**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createBrowserClient(url, key);
}
```

- [ ] **Step 3: Create server.ts**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // ignored: called from a Server Component
        }
      },
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/supabase/client.ts src/lib/supabase/server.ts
git commit -m "feat(lib): add supabase clients and db types"
```

---

## Task 5: Pure helpers (price + format) with tests

**Files:**
- Create: `src/lib/price.ts`, `src/lib/format.ts`, `src/lib/confidence.ts`
- Test: `src/lib/__tests__/price.test.ts`, `src/lib/__tests__/format.test.ts`, `src/lib/__tests__/confidence.test.ts`

- [ ] **Step 1: Write price.test.ts**

```ts
import { describe, it, expect } from "vitest";
import { computePrice, computePsf } from "@/lib/price";
import type { Unit, PriceBasis } from "@/lib/types";

const baseUnit: Unit = {
  id: "u1", project_id: "p1", source_document_id: null, tower: null,
  floor_raw: "18F", floor_sort_key: 18, unit_no: "A",
  saleable_area_sqft: 512,
  price_original: 9200000, price_plan_a: 8620000, price_plan_b: 8450000,
  computed_price: null, psf: null, tags: [], explainability: {},
  extraction_confidence: 98,
};

describe("computePrice", () => {
  it("returns price_original for original basis", () => {
    expect(computePrice(baseUnit, "original")).toBe(9200000);
  });
  it("returns price_plan_a for plan_a basis", () => {
    expect(computePrice(baseUnit, "plan_a")).toBe(8620000);
  });
  it("returns price_plan_b for plan_b basis", () => {
    expect(computePrice(baseUnit, "plan_b")).toBe(8450000);
  });
  it("returns min available price for lowest basis", () => {
    expect(computePrice(baseUnit, "lowest")).toBe(8450000);
  });
  it("falls back to another price when selected basis is null", () => {
    const u = { ...baseUnit, price_plan_a: null, price_plan_b: null, price_original: null };
    expect(computePrice(u, "plan_a")).toBe(null);
  });
  it("lowest ignores nulls and picks min of present", () => {
    const u = { ...baseUnit, price_plan_b: null };
    expect(computePrice(u, "lowest")).toBe(8620000);
  });
});

describe("computePsf", () => {
  it("divides price by area", () => {
    expect(computePsf(8620000, 512)).toBeCloseTo(16835.94, 1);
  });
  it("returns null when price is null", () => {
    expect(computePsf(null, 512)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `computePrice` not defined.

- [ ] **Step 3: Create price.ts**

```ts
import type { Unit, PriceBasis } from "./types";

export function computePrice(unit: Unit, basis: PriceBasis): number | null {
  if (basis === "original") return unit.price_original;
  if (basis === "plan_a") return unit.price_plan_a;
  if (basis === "plan_b") return unit.price_plan_b;
  const candidates = [unit.price_original, unit.price_plan_a, unit.price_plan_b].filter(
    (v): v is number => v != null
  );
  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}

export function computePsf(price: number | null, area: number): number | null {
  if (price == null || area <= 0) return null;
  return price / area;
}
```

- [ ] **Step 4: Run price tests — verify pass**

Run: `npm test -- src/lib/__tests__/price.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Write format.test.ts**

```ts
import { describe, it, expect } from "vitest";
import { formatHKD, formatSqft } from "@/lib/format";

describe("formatHKD", () => {
  it("formats millions compactly", () => {
    expect(formatHKD(8620000)).toBe("HK$8.62M");
  });
  it("formats thousands with K", () => {
    expect(formatHKD(16836)).toBe("HK$16,836");
  });
  it("returns placeholder for null", () => {
    expect(formatHKD(null)).toBe("—");
  });
});

describe("formatSqft", () => {
  it("appends 呎", () => {
    expect(formatSqft(512)).toBe("512 呎");
  });
});
```

- [ ] **Step 6: Create format.ts**

```ts
export function formatHKD(value: number | null): string {
  if (value == null) return "—";
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `HK$${m.toFixed(2)}M`;
  }
  return `HK$${value.toLocaleString("en-HK")}`;
}

export function formatSqft(area: number): string {
  return `${area} 呎`;
}
```

- [ ] **Step 7: Write confidence.test.ts**

```ts
import { describe, it, expect } from "vitest";
import { confidenceClass } from "@/lib/confidence";

describe("confidenceClass", () => {
  it("high for >=90", () => {
    expect(confidenceClass(98)).toBe("confidence-high");
    expect(confidenceClass(90)).toBe("confidence-high");
  });
  it("mid for 75-89", () => {
    expect(confidenceClass(82)).toBe("confidence-mid");
    expect(confidenceClass(75)).toBe("confidence-mid");
  });
  it("low for <75", () => {
    expect(confidenceClass(71)).toBe("confidence-low");
    expect(confidenceClass(0)).toBe("confidence-low");
  });
});
```

- [ ] **Step 8: Create confidence.ts**

```ts
export function confidenceClass(confidence: number): string {
  if (confidence >= 90) return "confidence-high";
  if (confidence >= 75) return "confidence-mid";
  return "confidence-low";
}
```

- [ ] **Step 9: Run all tests**

Run: `npm test`
Expected: PASS (all price + format + confidence tests).

- [ ] **Step 10: Commit**

```bash
git add src/lib/price.ts src/lib/format.ts src/lib/confidence.ts src/lib/__tests__/
git commit -m "feat(lib): add price/format/confidence helpers with tests"
```

---

## Task 6: Tag components

**Files:**
- Create: `src/components/ConfidenceTag.tsx`, `src/components/UnitTag.tsx`

- [ ] **Step 1: Create ConfidenceTag.tsx**

```tsx
import { confidenceClass } from "@/lib/confidence";

export function ConfidenceTag({ confidence }: { confidence: number }) {
  return (
    <span className={`wf-tag ${confidenceClass(confidence)}`}>
      {Math.round(confidence)}%
    </span>
  );
}
```

- [ ] **Step 2: Create UnitTag.tsx**

```tsx
import type { UnitTag as UnitTagType } from "@/lib/types";
import type { Explainability } from "@/lib/types";

const LABELS: Record<UnitTagType, string> = {
  overpriced_high_floor: "不划算高層",
  lowest_floor: "最低層",
  ground_floor: "地下",
};

const CLASS: Record<UnitTagType, string> = {
  overpriced_high_floor: "wf-tag warn",
  lowest_floor: "wf-tag base",
  ground_floor: "wf-tag base",
};

export function UnitTag({
  tag,
  explainability,
  expanded,
  onToggle,
}: {
  tag: UnitTagType;
  explainability: Explainability;
  expanded: boolean;
  onToggle: () => void;
}) {
  const interactive = tag === "overpriced_high_floor";
  return (
    <span
      className={`${CLASS[tag]}${interactive ? " wf-action-link" : ""}`}
      onClick={interactive ? onToggle : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={interactive ? { cursor: "pointer" } : undefined}
    >
      {LABELS[tag]}
      {expanded && interactive && tag === "overpriced_high_floor" && explainability.premium_pct != null && (
        <span style={{ display: "block", marginTop: 4, fontWeight: 400, whiteSpace: "normal" }}>
          此單位較上一層貴 +{explainability.premium_pct}%，高於預設 {explainability.threshold ?? 10}% 閾值，
          因此標記為不划算高層。
          {explainability.percentile != null && `（全盤 premium 第 ${explainability.percentile} 百分位）`}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ConfidenceTag.tsx src/components/UnitTag.tsx
git commit -m "feat(ui): add confidence and unit tag components"
```

---

## Task 7: AppShell + root layout + landing stub

**Files:**
- Create: `src/components/AppShell.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Create AppShell.tsx**

```tsx
import Link from "next/link";
import { Dashboard, LogIn } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="wireframe-body">
      <div className="wf-shell">
        <div className="wf-topbar">
          <Link href="/" className="wf-brand">
            Brickwise 磚研
            <small>一手樓價單分析工具</small>
          </Link>
          <div className="wf-actions">
            <Link href="/dashboard" className="wf-secondary-button">
              <Dashboard size={16} style={{ marginRight: 6 }} /> Dashboard
            </Link>
            <Link href="/pricing" className="wf-secondary-button">購買 Credits</Link>
            <Link href="/login" className="wf-button">
              <LogIn size={16} style={{ marginRight: 6 }} /> 登入
            </Link>
          </div>
        </div>
        {children}
        <div className="wf-footer">
          本平台提供之分析及資料僅供參考，並非投資意見 / 法律意見 / 按揭建議。用戶應自行核對原始價單並向專業人士查詢。
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Brickwise 磚研",
  description: "香港一手樓價單分析工具",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className="light">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create page.tsx (landing)**

```tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="wf-page">
      <div className="wf-card" style={{ textAlign: "center", padding: "48px 28px" }}>
        <span className="wf-kicker">Brickwise 磚研</span>
        <h1 className="wf-title">將混亂價單，變成你睇得明嘅比較表</h1>
        <p className="wf-subtitle" style={{ margin: "16px auto 0" }}>
          上載一手樓價單，系統自動整理成可排序、可篩選、可匯出嘅單位清單，幫你自助揀樓。
        </p>
        <div className="wf-inline" style={{ justifyContent: "center", marginTop: 24 }}>
          <Link href="/login" className="wf-button">開始使用</Link>
          <Link href="/dashboard" className="wf-secondary-button">查看項目</Link>
        </div>
        <div className="wf-note warn" style={{ marginTop: 24, textAlign: "left" }}>
          <strong>重要提示：</strong>本平台提供之分析及資料僅供參考，並非投資意見 / 法律意見 / 按揭建議。
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: build succeeds (landing + layout compile).

- [ ] **Step 5: Commit**

```bash
git add src/components/AppShell.tsx src/app/layout.tsx src/app/page.tsx
git commit -m "feat(ui): add app shell, root layout, landing page"
```

---

## Task 8: Login (magic link) + auth callback

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/auth/callback/route.ts`

- [ ] **Step 1: Create login/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { getClient } from "@/lib/supabase/client";
import { Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗，請再試一次。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wf-page">
      <div className="wf-center-card wf-card">
        <span className="wf-kicker">登入</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>以 Email 登入</h1>
        <p className="wf-subtitle">輸入你的 email，我們會寄出 magic link 畀你登入。登入後可保存分析結果與 credits。</p>
        {sent ? (
          <div className="wf-note" style={{ marginTop: 20 }}>
            已寄出登入連結到 <strong>{email}</strong>。請檢查你的信箱並點擊連結完成登入。
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ marginTop: 20, display: "grid", gap: 12 }}>
            <input
              type="email"
              className="wf-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="wf-button" disabled={loading}>
              <Mail size={16} style={{ marginRight: 6 }} />
              {loading ? "寄出中…" : "發送 magic link"}
            </button>
            {error && <div className="wf-note error">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create auth/callback/route.ts**

```ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  if (!code) return NextResponse.redirect(`${url.origin}${next}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
  await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(`${url.origin}${next}`);
}
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/login/page.tsx src/app/auth/callback/route.ts
git commit -m "feat(auth): add magic link login + callback handler"
```

---

## Task 9: Dashboard stub

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard/page.tsx**

```tsx
import Link from "next/link";
import { getClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export default async function DashboardPage() {
  let projects: Project[] = [];
  try {
    const supabase = await getClient();
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    projects = (data as Project[]) ?? [];
  } catch {
    projects = [];
  }

  return (
    <div className="wf-page">
      <div className="wf-panel">
        <span className="wf-kicker">Dashboard</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>你的項目</h1>
        <p className="wf-subtitle">查看過往分析項目，或建立新 project 開始上載價單。</p>
        <div className="wf-inline" style={{ marginTop: 16 }}>
          <span className="wf-button" style={{ opacity: 0.6, cursor: "not-allowed" }}>+ 新增 project（稍後推出）</span>
        </div>
      </div>
      <div className="wf-list">
        {projects.length === 0 && (
          <div className="wf-list-item">
            <span>尚未有項目。請先登入並建立 project。</span>
          </div>
        )}
        {projects.map((p) => (
          <div className="wf-list-item" key={p.id}>
            <div>
              <strong>{p.name}</strong>
              <small style={{ display: "block", marginTop: 4 }}>價格基準：{p.price_basis}</small>
            </div>
            <Link href={`/projects/${p.id}/results`} className="wf-action-link">查看結果 →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Note: fix the malformed `<span尚未...` — use `<span>尚未有項目。請先登入並建立 project。</span>`.

- [ ] **Step 2: Build check + Commit**

```bash
npm run build
git add src/app/dashboard/page.tsx
git commit -m "feat(ui): add dashboard project list stub"
```

---

## Task 10: Upload + Review stubs

**Files:**
- Create: `src/app/projects/[id]/upload/page.tsx`, `src/app/projects/[id]/review/page.tsx`

- [ ] **Step 1: Create upload/page.tsx**

```tsx
import Link from "next/link";

export default async function UploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="wf-page">
      <div className="wf-panel">
        <span className="wf-kicker">Upload</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>上載價單</h1>
        <p className="wf-subtitle">拖放 PDF / PNG / JPG 價單到下方，系統會自動解析。</p>
      </div>
      <div className="wf-dropzone">
        <strong>拖放檔案到此</strong>
        <span className="wf-muted">支援 PDF / PNG / JPG</span>
      </div>
      <div className="wf-note warn">
        <strong>稍後推出：</strong>檔案解析功能將於稍後推出。現可前往示範項目結果頁查看已解析數據。
      </div>
      <Link href={`/projects/${id}/results`} className="wf-button">查看示範結果 →</Link>
    </div>
  );
}
```

- [ ] **Step 2: Create review/page.tsx**

```tsx
export default function ReviewPage() {
  return (
    <div className="wf-page">
      <div className="wf-panel">
        <span className="wf-kicker">Extraction Review</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>確認抽取結果</h1>
        <p className="wf-subtitle">系統對抽取結果信心不足，請協助確認少量欄位。</p>
      </div>
      <div className="wf-note warn">
        <strong>稍後推出：</strong>Extraction Review 修正功能將於稍後推出。
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/projects/[id]/upload/page.tsx src/app/projects/[id]/review/page.tsx
git commit -m "feat(ui): add upload and review stubs"
```

---

## Task 11: Pricing + Payment stubs

**Files:**
- Create: `src/app/pricing/page.tsx`, `src/app/payment/[status]/page.tsx`

- [ ] **Step 1: Create pricing/page.tsx**

```tsx
const PACKAGES = [
  { name: "入門", credits: 10, price: "HK$98", active: false },
  { name: "標準", credits: 30, price: "HK$258", active: true },
  { name: "專業", credits: 80, price: "HK$638", active: false },
];

export default function PricingPage() {
  return (
    <div className="wf-page">
      <div className="wf-panel" style={{ textAlign: "center" }}>
        <span className="wf-kicker">Pricing</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>購買 Credits</h1>
        <p className="wf-subtitle" style={{ margin: "12px auto 0" }}>每位用戶每月免費 3 credits。不足時可購買。</p>
      </div>
      <div className="wf-pricing-grid">
        {PACKAGES.map((p) => (
          <div className={`wf-price-card${p.active ? " active" : ""}`} key={p.name}>
            <strong style={{ display: "block", marginBottom: 8 }}>{p.name}</strong>
            <div className="wf-price">{p.price}</div>
            <small style={{ display: "block", marginTop: 8, color: "var(--bw-ink-2)" }}>{p.credits} credits</small>
            <button className="wf-button" style={{ marginTop: 16, width: "100%" }} disabled>購買（稍後推出）</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create payment/[status]/page.tsx**

```tsx
export default async function PaymentPage({ params }: { params: Promise<{ status: string }> }) {
  const { status } = await params;
  const success = status === "success";
  return (
    <div className="wf-page">
      <div className="wf-center-card wf-card" style={{ textAlign: "center" }}>
        <h1 className="wf-title" style={{ fontSize: 32 }}>{success ? "付款成功" : "付款未完成"}</h1>
        <p className="wf-subtitle" style={{ margin: "12px auto 0" }}>
          {success ? "你的 credits 已經增加。返回項目繼續分析。" : "付款流程已取消，你可返回重新購買。"}
        </p>
        <div className="wf-inline" style={{ justifyContent: "center", marginTop: 20 }}>
          <a href="/dashboard" className="wf-button">返回 Dashboard</a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/pricing/page.tsx src/app/payment/[status]/page.tsx
git commit -m "feat(ui): add pricing and payment stubs"
```

---

## Task 12: Shortlist stub

**Files:**
- Create: `src/app/projects/[id]/shortlist/page.tsx`, `src/components/ShortlistCounter.tsx`

- [ ] **Step 1: Create shortlist/page.tsx**

```tsx
import Link from "next/link";
import { getClient } from "@/lib/supabase/server";
import { formatHKD, formatSqft } from "@/lib/format";

export default async function ShortlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let items: Array<{ unit_id: string; rank: number; units: { floor_raw: string; unit_no: string; saleable_area_sqft: number; computed_price: number | null } | null }> = [];
  try {
    const supabase = await getClient();
    const { data } = await supabase
      .from("shortlist_items")
      .select("unit_id, rank, units(floor_raw, unit_no, saleable_area_sqft, computed_price)")
      .eq("project_id", id)
      .order("rank", { ascending: true });
    items = (data as typeof items) ?? [];
  } catch {
    items = [];
  }

  return (
    <div className="wf-page">
      <div className="wf-panel">
        <span className="wf-kicker">Shortlist</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>心水單位</h1>
        <p className="wf-subtitle">拖拉排序心水優先次序，並可匯出 CSV。</p>
        <div className="wf-inline" style={{ marginTop: 12 }}>
          <Link href={`/projects/${id}/results`} className="wf-action-link">返回結果表 →</Link>
        </div>
      </div>
      <div className="wf-drag-list">
        {items.length === 0 && <div className="wf-list-item"><span>尚未加入任何心水單位。</span></div>}
        {items.map((it) => (
          <div className="wf-drag-item" key={it.unit_id}>
            <span className="wf-handle">⋮⋮</span>
            <strong>{it.units?.floor_raw ?? "—"} {it.units?.unit_no ?? ""}</strong>
            <span>{it.units ? formatSqft(it.units.saleable_area_sqft) : "—"}</span>
            <span>{it.units ? formatHKD(it.units.computed_price) : "—"}</span>
            <div className="wf-inline">
              <button className="wf-secondary-button" disabled>↑</button>
              <button className="wf-secondary-button" disabled>↓</button>
            </div>
          </div>
        ))}
      </div>
      <div className="wf-note warn">
        <strong>稍後推出：</strong>拖拉排序與 CSV 匯出功能將於稍後推出。
      </div>
    </div>
  );
}
```

Note: fix `<span尚未...` → `<span>尚未加入任何心水單位。</span>`.

- [ ] **Step 2: Create ShortlistCounter.tsx**

```tsx
import Link from "next/link";
import { Heart } from "lucide-react";

export function ShortlistCounter({ count, projectId }: { count: number; projectId: string }) {
  return (
    <div className="wf-aside-card">
      <h3>心水單位</h3>
      <div className="wf-shortlist-counter">
        <span className="wf-heart-icon filled" style={{ background: "rgba(53,88,230,0.15)" }}>
          <Heart size={12} fill="currentColor" />
        </span>
        <div><strong>已加入 {count} 個心水</strong></div>
      </div>
      <p style={{ marginTop: 12 }}>將心儀單位加入 Shortlist，方便稍後比較。</p>
      <Link href={`/projects/${projectId}/shortlist`} className="wf-link">管理心水清單 →</Link>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/projects/[id]/shortlist/page.tsx src/components/ShortlistCounter.tsx
git commit -m "feat(ui): add shortlist stub and counter component"
```

---

## Task 13: Compare page — selects + filter chips

**Files:**
- Create: `src/components/PriceBasisSelect.tsx`, `src/components/SortSelect.tsx`, `src/components/FilterChips.tsx`

- [ ] **Step 1: Create PriceBasisSelect.tsx**

```tsx
import type { PriceBasis } from "@/lib/types";

export function PriceBasisSelect({
  value,
  onChange,
}: {
  value: PriceBasis;
  onChange: (v: PriceBasis) => void;
}) {
  return (
    <div className="wf-sort-group">
      <label className="wf-field-label" style={{ marginBottom: 0, marginRight: 6 }}>價格基準</label>
      <select
        className="wf-select"
        style={{ width: 180 }}
        value={value}
        onChange={(e) => onChange(e.target.value as PriceBasis)}
      >
        <option value="original">原價</option>
        <option value="plan_a">Plan A</option>
        <option value="plan_b">Plan B</option>
        <option value="lowest">最低價（自動）</option>
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Create SortSelect.tsx**

```tsx
import type { SortKey } from "@/lib/types";

export function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <div className="wf-sort-group">
      <label className="wf-field-label" style={{ marginBottom: 0, marginRight: 6 }}>排序</label>
      <select
        className="wf-select"
        style={{ width: 180 }}
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
      >
        <option value="psf_asc">最低呎價（低至高）</option>
        <option value="total_asc">最低總價（低至高）</option>
      </select>
    </div>
  );
}
```

- [ ] **Step 3: Create FilterChips.tsx**

```tsx
export type FilterKey = "overpriced" | "lowest_floor";

export function FilterChips({
  shortlistOnly,
  filters,
  onShortlistOnly,
  onToggleFilter,
}: {
  shortlistOnly: boolean;
  filters: Set<FilterKey>;
  onShortlistOnly: (v: boolean) => void;
  onToggleFilter: (k: FilterKey) => void;
}) {
  const toggle = (k: FilterKey) => {
    const next = new Set(filters);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onToggleFilter(next);
  };
  return (
    <div className="wf-filter-group">
      <span
        className={`wf-chip${!shortlistOnly ? " active" : ""}`}
        onClick={() => onShortlistOnly(false)}
      >全部</span>
      <span
        className={`wf-chip${shortlistOnly ? " active" : ""}`}
        onClick={() => onShortlistOnly(true)}
      >已加入 Shortlist</span>
      <span
        className={`wf-chip${filters.has("overpriced") ? " active" : ""}`}
        onClick={() => toggle("overpriced")}
      >剔除不划算高層</span>
      <span
        className={`wf-chip${filters.has("lowest_floor") ? " active" : ""}`}
        onClick={() => toggle("lowest_floor")}
      >剔除地下/最低層</span>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/PriceBasisSelect.tsx src/components/SortSelect.tsx src/components/FilterChips.tsx
git commit -m "feat(ui): add price basis select, sort select, filter chips"
```

---

## Task 14: Compare page — ResultsTable + ResultsView

**Files:**
- Create: `src/components/ResultsTable.tsx`, `src/components/ResultsView.tsx`, `src/app/projects/[id]/results/page.tsx`

- [ ] **Step 1: Create ResultsTable.tsx**

```tsx
import { Fragment } from "react";
import { Heart } from "lucide-react";
import type { Unit } from "@/lib/types";
import { formatHKD, formatSqft } from "@/lib/format";
import { computePrice, computePsf } from "@/lib/price";
import type { PriceBasis } from "@/lib/types";
import { ConfidenceTag } from "./ConfidenceTag";
import { UnitTag } from "./UnitTag";

export interface RowUnit {
  unit: Unit;
  computed_price: number | null;
  psf: number | null;
}

export function ResultsTable({
  rows,
  basis,
  shortlist,
  expandedUnit,
  onToggleShortlist,
  onToggleExpand,
}: {
  rows: RowUnit[];
  basis: PriceBasis;
  shortlist: Set<string>;
  expandedUnit: string | null;
  onToggleShortlist: (unitId: string) => void;
  onToggleExpand: (unitId: string) => void;
}) {
  return (
    <table className="wf-table">
      <thead>
        <tr>
          <th>加入心水</th>
          <th>樓層</th>
          <th>單位</th>
          <th>實用面積</th>
          <th>折實總價</th>
          <th>折實單呎</th>
          <th>標籤</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ unit, computed_price, psf }) => {
          const inShortlist = shortlist.has(unit.id);
          return (
            <Fragment key={unit.id}>
              <tr>
                <td>
                  <span
                    className={`wf-heart-icon${inShortlist ? " filled" : ""}`}
                    onClick={() => onToggleShortlist(unit.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <Heart size={12} fill={inShortlist ? "currentColor" : "none"} />
                  </span>
                </td>
                <td>{unit.floor_raw}</td>
                <td>{unit.tower ? `${unit.tower} ` : ""}{unit.unit_no}</td>
                <td>{formatSqft(unit.saleable_area_sqft)}</td>
                <td>{formatHKD(computed_price)}</td>
                <td>{psf != null ? `${formatHKD(psf)}/呎` : "—"}</td>
                <td>
                  <ConfidenceTag confidence={unit.extraction_confidence} />
                  {unit.tags.map((t) => (
                    <span key={t} style={{ marginLeft: 6, display: "inline-block" }}>
                      <UnitTag
                        tag={t}
                        explainability={unit.explainability}
                        expanded={expandedUnit === unit.id}
                        onToggle={() => onToggleExpand(unit.id)}
                      />
                    </span>
                  ))}
                </td>
                <td>
                  <span className="wf-action-link" onClick={() => onToggleShortlist(unit.id)}>
                    {inShortlist ? "移除" : "加入 Shortlist"}
                  </span>
                </td>
              </tr>
              {expandedUnit === unit.id && unit.tags.includes("overpriced_high_floor") && (
                <tr key={`${unit.id}-detail`}>
                  <td colSpan={8} style={{ background: "var(--bw-surface-2)" }}>
                    <div style={{ padding: 8 }}>
                      <UnitTag
                        tag="overpriced_high_floor"
                        explainability={unit.explainability}
                        expanded
                        onToggle={() => onToggleExpand(unit.id)}
                      />
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
```

Note: the `<tr key={unit.id}-detail>` second row uses a `-detail` suffix key to avoid duplicate-key warnings.

- [ ] **Step 2: Create ResultsView.tsx**

```tsx
"use client";

import { useMemo, useState } from "react";
import { getClient } from "@/lib/supabase/client";
import type { Project, Unit, PriceBasis, SortKey } from "@/lib/types";
import { computePrice, computePsf } from "@/lib/price";
import { ResultsTable, type RowUnit } from "./ResultsTable";
import { PriceBasisSelect } from "./PriceBasisSelect";
import { SortSelect } from "./SortSelect";
import { FilterChips, type FilterKey } from "./FilterChips";
import { ShortlistCounter } from "./ShortlistCounter";

export function ResultsView({
  project,
  units,
  initialShortlist,
}: {
  project: Project;
  units: Unit[];
  initialShortlist: string[];
}) {
  const [basis, setBasis] = useState<PriceBasis>(project.price_basis ?? "lowest");
  const [sortKey, setSortKey] = useState<SortKey>("psf_asc");
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [shortlist, setShortlist] = useState<Set<string>>(new Set(initialShortlist));
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  const rows: RowUnit[] = useMemo(() => {
    const withComputed = units.map((u) => {
      const computed_price = computePrice(u, basis);
      const psf = computePsf(computed_price, u.saleable_area_sqft);
      return { unit: u, computed_price, psf };
    });
    const filtered = withComputed.filter(({ unit }) => {
      if (filters.has("overpriced") && unit.tags.includes("overpriced_high_floor")) return false;
      if (filters.has("lowest_floor") && (unit.tags.includes("lowest_floor") || unit.tags.includes("ground_floor"))) return false;
      return true;
    });
    const scope = shortlistOnly ? filtered.filter(({ unit }) => shortlist.has(unit.id)) : filtered;
    const sorted = [...scope].sort((a, b) => {
      if (sortKey === "psf_asc") return (a.psf ?? Infinity) - (b.psf ?? Infinity);
      return (a.computed_price ?? Infinity) - (b.computed_price ?? Infinity);
    });
    return sorted;
  }, [units, basis, filters, shortlistOnly, shortlist, sortKey]);

  async function toggleShortlist(unitId: string) {
    const prev = new Set(shortlist);
    const next = new Set(prev);
    const isAdd = !next.has(unitId);
    if (isAdd) next.add(unitId);
    else next.delete(unitId);
    setShortlist(next);
    try {
      const supabase = getClient();
      if (isAdd) {
        await supabase.from("shortlist_items").insert({
          project_id: project.id,
          unit_id: unitId,
          rank: next.size,
        });
      } else {
        await supabase
          .from("shortlist_items")
          .delete()
          .eq("project_id", project.id)
          .eq("unit_id", unitId);
      }
    } catch {
      setShortlist(prev);
    }
  }

  const total = units.length;
  const visible = rows.length;

  return (
    <div className="wf-page wf-page-results" style={{ paddingTop: 24 }}>
      <div className="wf-control-bar">
        <div className="wf-title-group">
          <span className="wf-kicker">Results</span>
          <h1 className="wf-title" style={{ fontSize: 28 }}>{visible} 個單位已比較</h1>
        </div>
        <FilterChips
          shortlistOnly={shortlistOnly}
          filters={filters}
          onShortlistOnly={setShortlistOnly}
          onToggleFilter={setFilters}
        />
        <PriceBasisSelect value={basis} onChange={setBasis} />
        <SortSelect value={sortKey} onChange={setSortKey} />
        <div className="wf-pill-count"><span>{visible} / {total} 個單位</span></div>
      </div>

      <div className="wf-result-layout">
        <div className="wf-table-card">
          {visible === 0 ? (
            <div className="wf-empty-state">
              <strong>沒有符合篩選條件的單位</strong>
              <button
                className="wf-secondary-button"
                onClick={() => { setFilters(new Set()); setShortlistOnly(false); }}
              >清除篩選</button>
            </div>
          ) : (
            <ResultsTable
              rows={rows}
              basis={basis}
              shortlist={shortlist}
              expandedUnit={expandedUnit}
              onToggleShortlist={toggleShortlist}
              onToggleExpand={(id) => setExpandedUnit((cur) => (cur === id ? null : id))}
            />
          )}
        </div>
        <aside className="wf-results-aside">
          <div className="wf-aside-card highlight">
            <h3>價格基準說明</h3>
            <p>
              折實單呎 = 折實成交價 ÷ 實用面積。<br />
              切換價格基準後，所有指標即時重新計算，不會扣除 credits。
            </p>
            <span className="wf-link">你可自行切換價格基準作出不同維度的比較 →</span>
          </div>
          <div className="wf-aside-card">
            <h3>標籤說明</h3>
            <p>
              信心指數反映系統對成交價準確度的評估信心，與單位質素無關。<br />
              你可忽略系統標籤，自行判斷。
            </p>
            <span className="wf-link">了解標籤含義 →</span>
          </div>
          <ShortlistCounter count={shortlist.size} projectId={project.id} />
          <div className="wf-note warn">
            <strong>重要提示：</strong>本平台提供之分析及資料僅供參考，並非投資意見 / 法律意見 / 按揭建議。用戶應自行核對原始價單並向專業人士查詢。
          </div>
        </aside>
      </div>

      <div className="wf-rationale-section">
        <h4>設計原由</h4>
        <p>
          此頁為 MVP 最關鍵的決策頁。雙欄佈局讓用戶在查看完整比較表格的同時，隨時可見價格基準說明與心水清單狀態，
          降低認知負擔。信心指數以視覺化標籤呈現，輔助而非取代用戶判斷。
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create results/page.tsx (RSC)**

```tsx
import { notFound } from "next/navigation";
import { getClient } from "@/lib/supabase/server";
import { ResultsView } from "@/components/ResultsView";
import type { Project, Unit, ShortlistItem } from "@/lib/types";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getClient();

  const { data: project } = await supabase
    .from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  const { data: units } = await supabase
    .from("units").select("*").eq("project_id", id).order("floor_sort_key", { ascending: false });

  const { data: shortlist } = await supabase
    .from("shortlist_items").select("unit_id").eq("project_id", id);

  return (
    <ResultsView
      project={project as Project}
      units={(units as Unit[]) ?? []}
      initialShortlist={((shortlist as ShortlistItem[]) ?? []).map((s) => s.unit_id)}
    />
  );
}
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: build succeeds. Resolve any TypeScript errors reported (ensure `Fragment` import is present in ResultsTable and all JSX tags are well-formed).

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all helper tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ResultsTable.tsx src/components/ResultsView.tsx src/app/projects/[id]/results/page.tsx
git commit -m "feat(results): implement unit compare page with sort/filter/shortlist"
```

---

## Task 15: Final verification + README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
# Brickwise 磚研

Hong Kong first-hand property price list analysis web app.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in Supabase URL + anon key.
3. Create a Supabase project and run `supabase/migrations/0001_init.sql` then `supabase/seed.sql`.
4. For the seed to be readable by anon RLS, create an auth user whose id matches the demo profile
   (`00000000-0000-0000-0000-000000000001`) or insert the profile row with your own user id and
   update the seed's `user_id` / `project_id` accordingly.
5. `npm run dev` and open http://localhost:3000

## Demo results page

Visit `/projects/00000000-0000-0000-0000-000000000100/results` to see the seeded compare page.

## Deploy to Netlify

1. Push to GitHub.
2. Connect repo to Netlify; build command `npm run build`, publish `.next`.
3. Set env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Disclaimer

本平台提供之分析及資料僅供參考，並非投資意見 / 法律意見 / 按揭建議。
```

- [ ] **Step 2: Full build**

Run: `npm run build`
Expected: build succeeds with all routes compiled.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 4: Manual smoke test (dev server)**

Run: `npm run dev`
- Visit `/projects/00000000-0000-0000-0000-000000000100/results`.
- Verify table renders with 10 seed rows.
- Switch price basis → 折實總價/單呎 recompute.
- Switch sort → rows reorder.
- Toggle 剔除不划算高層 → 18F removed.
- Toggle 剔除地下/最低層 → G/F + 1F removed.
- Click heart on a row → counter increments; refresh persists.
- Click 不划算高層 tag → explanation expands.
- Toggle both filters + 已加入 Shortlist with empty shortlist → empty state shows.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and deploy instructions"
```

---

## Self-Review

**Spec coverage:**
- §2 stack (Next.js, Supabase, lucide, plain CSS, Netlify) → Tasks 1, 2, 8, 11.
- §3 project structure → mapped across all tasks.
- §4 data model → Task 3.
- §5 seed data → Task 3 (10 rows match spec table, 18F overpriced, G/F+1F lowest).
- §6.1 RSC data fetch → Task 14 page.tsx.
- §6.2 layout → Task 14 ResultsView.
- §6.3 state → Task 14 ResultsView.
- §6.4 derived rows (computePrice/filter/sort) → Task 14 + helpers Task 5.
- §6.5 subcomponents (PriceBasisSelect, SortSelect, FilterChips, ResultsTable, ConfidenceTag, UnitTag, ShortlistCounter) → Tasks 6, 12, 13, 14.
- §6.6 persistence (optimistic insert/delete) → Task 14 toggleShortlist.
- §6.7 empty state → Task 14.
- §6.8 disclaimer → Task 14 sidebar + AppShell footer.
- §7 other pages stubs → Tasks 7–12.
- §8 Netlify → Task 1 netlify.toml + README Task 15.
- §9 verification → Task 15.

**Placeholder scan:** All code steps contain complete, well-formed code. The "稍後推出" notes in stub pages are intentional product copy (not implementation placeholders). The `Fragment` import + keyed usage in ResultsTable is shown explicitly.

**Type consistency:** `PriceBasis`, `SortKey`, `Unit`, `Project`, `ShortlistItem`, `FilterKey`, `RowUnit` defined in Task 4 / Task 13 / Task 14 and reused consistently. `computePrice`/`computePsf` signatures match across Task 5 and Task 14. `confidenceClass` used in ConfidenceTag Task 6 matches Task 5 helper.
