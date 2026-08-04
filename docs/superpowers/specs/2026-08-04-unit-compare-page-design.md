# Brickwise — Unit Compare Page & App Scaffold Design

> Sub-project spec for the first implementation cycle of the Brickwise MVP.
> Scope: full Next.js app scaffold + Supabase schema/seed + end-to-end implementation of the
> sortable, filterable **unit compare page** (per `results-default.html` wireframe). Other pages
> ship as navigable stubs to be completed in later cycles.

---

## 1. Context & Goals

Brickwise (`磚研`) is a Hong Kong first-hand property buyer's web app. Users upload price lists
(PDF/PNG/JPG); the system extracts a sortable/filterable unit table and provides explainable tags
(`不划算高層`, `最低層`) to help users pick units independently of agent influence.

The full MVP spans Modules 1 / 3 / 6 plus Extraction Review and credit-based billing — too large for
one spec. This cycle focuses on the product's most important screen — the **unit compare (results)
page** — while scaffolding the surrounding app so it deploys to Netlify and can grow.

### Source references
- PRD: `brickwise-prd-mvp.md` (§2.1 price basis, §2.2 sort/filter, §5 data model, §6 explainable rules,
  §9 disclaimer).
- Wireframe: `brickwise-mvp-wireframe/pages/results-default.html` (layout, `.wf-select`,
  `.wf-table`, `.wf-tag.confidence-*`).
- Brief: `brickwise-trae-design-brief.md`.

### Success criteria for this cycle
- Compare page reads live data from Supabase and renders per wireframe.
- Sorting (最低呎價 / 最低總價), filtering (剔除不划算高層 / 剔除地下/最低層), price-basis switch
  (原價 / Plan A / Plan B / 最低價), and add-to-shortlist all work.
- Confidence tags render with the correct `.wf-tag.confidence-*` class.
- App builds (`npm run build`) and is deployable to Netlify.
- Other MVP routes exist as navigable stubs with real auth on login.

---

## 2. Stack & Architecture

- **Next.js 15 (App Router) + TypeScript**.
- **`@supabase/supabase-js`** — browser client + server (RSC) client helpers.
- **`@netlify/plugin-nextjs`** for deployment.
- **`lucide-react`** for icons (wireframe uses lucide).
- **Plain CSS + design tokens** (no Tailwind build step) — port wireframe `:root` tokens and
  `.wf-*` classes verbatim into `src/app/globals.css`. Keeps Netlify build simple and visuals
  identical to the wireframe.
- **No global state library** — React `useState`/`useMemo` in the client component for the
  compare page.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`.env.local` + Netlify env).
  Server-only service role is *not* used in this cycle (anon + RLS is enough for the compare page
  and seed reads).

### Why not the wireframe's Tailwind CDN
The wireframe loads Tailwind v4 browser CDN for a couple of base layer utilities. A real Next.js
build should not depend on a runtime CDN; we replace those few utilities with plain CSS in
`globals.css` and keep all `.wf-*` classes unchanged.

---

## 3. Project Structure

```
brickwise/
  src/app/
    layout.tsx                # root <html>, globals import, brand
    page.tsx                  # landing (stub)
    globals.css               # ported wireframe tokens + .wf-* classes
    login/page.tsx            # magic link (real Supabase auth)
    dashboard/page.tsx        # project list (stub, lists seeded project)
    projects/[id]/
      upload/page.tsx         # upload (stub: dropzone UI, no processing)
      results/page.tsx       # ← FULLY IMPLEMENTED compare page
      shortlist/page.tsx      # shortlist (stub: reads shortlist_items, drag UI stubbed)
      review/page.tsx         # extraction review (stub: static preview)
    pricing/page.tsx          # buy credits (stub: static cards)
    payment/[status]/page.tsx # success / cancel (stub)
  src/lib/
    supabase/client.ts        # getClient() for client components
    supabase/server.ts        # getClient() for RSC (cookies)
    types.ts                  # DB row types (Project, Document, Unit, ShortlistItem)
    price.ts                  # pure recompute helpers (computed_price, psf, premium, tags)
    format.ts                 # HKD / sqft formatters
  src/components/
    AppShell.tsx              # topbar + nav wrapper
    ResultsView.tsx           # client component: state + wiring (sort/filter/basis/shortlist)
    ResultsTable.tsx          # .wf-table rendering
    PriceBasisSelect.tsx      # .wf-select for price basis
    SortSelect.tsx            # .wf-select for sort key
    FilterChips.tsx           # .wf-chip toggles for the two filters + shortlist-only
    ConfidenceTag.tsx         # .wf-tag.confidence-{high|mid|low}
    UnitTag.tsx               # overpriced_high_floor / lowest_floor tag + expandable rationale
    ShortlistCounter.tsx      # sidebar counter
  supabase/
    migrations/0001_init.sql  # schema (all entities from PRD §5)
    seed.sql                  # realistic units matching wireframe rows
  netlify.toml
  .env.example
  package.json
  tsconfig.json
  next.config.ts
```

---

## 4. Data Model (Supabase)

Per PRD §5.1. All tables created in `0001_init.sql` with RLS.

### `profiles`
- `id` uuid PK ref `auth.users(id) on delete cascade`
- `email` text
- `credits_balance` int default 0
- `free_credit_month` text nullable  (e.g. `"2026-08"`)
- `created_at` timestamptz default now()

### `projects`
- `id` uuid PK default gen_random_uuid()
- `user_id` uuid ref profiles(id) on delete cascade
- `name` text not null
- `price_basis` text not null default `'lowest'`  check in (`original`,`plan_a`,`plan_b`,`lowest`)
- `created_at` timestamptz default now()
- RLS: user can select/insert/update own rows.

### `documents`
- `id` uuid PK
- `project_id` uuid ref projects on delete cascade
- `file_name` text
- `file_type` text  (`pdf` | `png` | `jpg`)
- `page_count` int default 1
- `file_hash` text
- `status` text default `'uploaded'`  (`uploaded` | `processing` | `succeeded` | `failed`)
- `extraction_confidence` numeric nullable
- `created_at` timestamptz default now()

### `units`
The core entity for the compare page.
- `id` uuid PK
- `project_id` uuid ref projects on delete cascade
- `source_document_id` uuid ref documents on delete set null
- `tower` text nullable
- `floor_raw` text              (e.g. `"18F"`, `"G/F"`)
- `floor_sort_key` int          (numeric for sort/filter; G/F → 0)
- `unit_no` text                (e.g. `"A"`)
- `saleable_area_sqft` numeric
- `price_original` numeric nullable
- `price_plan_a` numeric nullable
- `price_plan_b` numeric nullable
- `computed_price` numeric       (derived from selected basis; recomputed on switch)
- `psf` numeric                  (computed_price / saleable_area_sqft)
- `tags` text[]                  (`lowest_floor`, `ground_floor`, `overpriced_high_floor`)
- `explainability` jsonb         ({ premium_pct, threshold, percentile, comparison_basis, prev_floor … })
- `extraction_confidence` numeric (0–100; drives confidence tag class)
- `created_at` timestamptz default now()
- Indexes: `(project_id)`, `(project_id, floor_sort_key)`, `(project_id, unit_no)`.
- RLS: select/insert/update where project_id belongs to current user.

### `shortlist_items`
- `id` uuid PK
- `project_id` uuid ref projects on delete cascade
- `unit_id` uuid ref units on delete cascade
- `rank` int
- `created_at` timestamptz default now()
- Unique `(project_id, unit_id)`.

### Derived columns strategy
`computed_price` and `psf` are stored (not computed in SQL at read time) so sorting is cheap. They
are **recomputed client-side** when the user switches price basis (PRD §2.1: re-calc costs no
credits). The compare page fetches raw `price_*` fields once, then derives `computed_price`/`psf`
per basis in `useMemo`. We do *not* persist the user's chosen basis back to `projects.price_basis`
in this cycle — that can be added later; the page just reads/writes local state seeded from the
project default.

---

## 5. Seed Data (`seed.sql`)

A single demo project owned by a demo profile (for local dev; in production the user creates their
own). ~8–10 units matching the wireframe rows so the page looks right out of the box:

| floor_raw | unit_no | area | price_original | price_plan_a | price_plan_b | confidence | tags |
|-----------|---------|------|----------------|---------------|---------------|------------|------|
| 18F | A | 512 | 9.20M | 8.62M | 8.45M | 98 | overpriced_high_floor |
| 16F | B | 512 | 9.00M | 8.45M | 8.30M | 82 | — |
| 15F | A | 512 | 8.95M | 8.38M | 8.22M | 99 | — |
| 12F | C | 512 | 8.45M | 7.92M | 7.78M | 71 | — |
| 10F | A | 512 | 8.30M | 7.78M | 7.65M | 95 | — |
| 8F  | B | 512 | 8.10M | 7.58M | 7.45M | 90 | — |
| 5F  | A | 512 | 7.90M | 7.40M | 7.28M | 88 | — |
| 3F  | C | 512 | 7.70M | 7.20M | 7.10M | 80 | — |
| 1F  | A | 512 | 7.60M | 7.10M | 7.00M | 76 | lowest_floor |
| G/F  | B | 512 | 7.50M | 7.00M | 6.90M | 70 | ground_floor, lowest_floor |

`explainability` for 18F (overpriced): `{ "premium_pct": 12.3, "threshold": 10, "percentile": 92,
"comparison_basis": "全盤", "prev_floor": "16F", "prev_price": 8.45M, "this_price": 8.62M }`.

Prices chosen so 18F's premium over 16F is ≥10% (triggers the tag) and G/F + 1F trigger the
lowest-floor tag, demonstrating both filters.

---

## 6. Compare Page — Detailed Design

Route: `/projects/[id]/results` — `src/app/projects/[id]/results/page.tsx`.

### 6.1 Data fetch (RSC)
Server component reads `id`, calls Supabase server client:
- `select * from projects where id = ?` (for name + default `price_basis`).
- `select * from units where project_id = ? order by floor_sort_key`.
- `select unit_id from shortlist_items where project_id = ?` (initial shortlist set).
Passes these as props to `<ResultsView />` (client component).

### 6.2 Layout (mirrors `results-default.html`)
```
.wf-shell
  .wf-control-bar (sticky)
    .wf-title-group  (kicker "Results" + "{N} 個單位已比較")
    FilterChips        (全部 / 已加入 Shortlist + 剔除不划算高層 + 剔除地下/最低層)
    PriceBasisSelect  (.wf-select: 原價 / Plan A / Plan B / 最低價)
    SortSelect         (.wf-select: 最低呎價 / 最低總價)
    .wf-pill-count     ({visible} / {total} 個單位)
  .wf-result-layout
    .wf-table-card
      ResultsTable
    .wf-results-aside
      .wf-aside-card.highlight  (價格基準說明)
      .wf-aside-card            (標籤說明)
      ShortlistCounter
      .wf-note.warn             (disclaimer per PRD §9)
  .wf-rationale-section (design rationale text)
```

### 6.3 State (`ResultsView.tsx`)
```ts
type PriceBasis = 'original' | 'plan_a' | 'plan_b' | 'lowest';
type SortKey = 'psf_asc' | 'total_asc';

const [basis, setBasis] = useState<PriceBasis>(project.price_basis ?? 'lowest');
const [sortKey, setSortKey] = useState<SortKey>('psf_asc');
const [filters, setFilters] = useState<Set<FilterKey>>(new Set()); // {overpriced, lowest_floor}
const [shortlistOnly, setShortlistOnly] = useState(false);
const [shortlist, setShortlist] = useState<Set<string>>(initialShortlistIds);
const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
```

### 6.4 Derived rows (`useMemo`)
1. `computePrice(unit, basis)` → picks `price_original`/`price_plan_a`/`price_plan_b` or
   `min(of available)` for `lowest`. Returns `computed_price`, `psf`.
2. Apply filters: drop units whose `tags` intersect the active filter set.
3. Apply `shortlistOnly`: keep only units in `shortlist`.
4. Sort by `sortKey` (`psf asc` or `computed_price asc`).
5. Count = length of filtered+sorted rows.

### 6.5 Subcomponents

**PriceBasisSelect** — `<select className="wf-select">` with the four options. On change updates
`basis`. Recomputation happens automatically via memo.

**SortSelect** — `<select className="wf-select">` with two options. PRD §2.2 mandates only these two
sorts.

**FilterChips** — four `.wf-chip` toggles in the control bar:
- `全部` and `已加入 Shortlist` — mutually exclusive pair controlling `shortlistOnly`
  (selecting `全部` clears `shortlistOnly`; selecting `已加入 Shortlist` sets it).
- `剔除不划算高層` — toggle; when active, removes units tagged `overpriced_high_floor`.
- `剔除地下/最低層` — toggle; when active, removes units tagged `lowest_floor` or `ground_floor`.
Active chip gets `.active`. The two filter toggles are independent of the 全部/已加入 Shortlist pair.

**ResultsTable** — `<table className="wf-table">` with columns:
| 加入心水 | 樓層 | 單位 | 實用面積 | 折實總價 | 折實單呎 | 標籤 | 操作 |
- `加入心水`: heart icon button; filled when in shortlist. Click toggles `shortlist` + persists to
  `shortlist_items` (optimistic insert/delete).
- `樓層`: `floor_raw`.
- `單位`: `unit_no` (+ `tower` if present, e.g. `座 A`).
- `實用面積`: `formatSqft(saleable_area_sqft)`.
- `折實總價`: `formatHKD(computed_price)` (e.g. `HK$8.62M`).
- `折實單呎`: `formatHKD(psf)` + `/呎`.
- `標籤`: `ConfidenceTag` (always) + `UnitTag` for `overpriced_high_floor` / `lowest_floor` /
  `ground_floor` when present.
- `操作`: `.wf-action-link` "加入 Shortlist" / "移除" depending on shortlist state.

**ConfidenceTag** — picks class by `extraction_confidence`:
- ≥90 → `wf-tag confidence-high`
- 75–89 → `wf-tag confidence-mid`
- <75 → `wf-tag confidence-low`
Shows `{confidence}%`.

**UnitTag** — `.wf-tag.warn` for `overpriced_high_floor`, `.wf-tag.base` for floor tags. Clicking
`overpriced_high_floor` toggles `expandedUnit` for that row → renders an inline `<tr>`/detail panel
with `explainability` text: "此單位較上一層貴 +12.3%，高於預設 10% 閾值，因此標記為不划算高層。
（全盤 premium 第 92 百分位）".

**ShortlistCounter** — shows `{shortlist.size} 個心水`, link to `/projects/[id]/shortlist`.

### 6.6 Persistence
Shortlist add/remove calls Supabase:
- add: `insert into shortlist_items (project_id, unit_id, rank) values (?, ?, ?)` (rank = current
  max + 1).
- remove: `delete from shortlist_items where project_id = ? and unit_id = ?`.
Optimistic UI update; rollback on error.

### 6.7 Empty state
If filtered rows is 0, render `.wf-empty-state` ("沒有符合篩選條件的單位" + "清除篩選" button that
resets `filters` and `shortlistOnly`). Matches PRD brief's "Results empty state".

### 6.8 Disclaimer (PRD §9)
The `.wf-note.warn` in the sidebar shows:
"本平台提供之分析及資料僅供參考，並非投資意見 / 法律意見 / 按揭建議。用戶應自行核對原始價單
並向專業人士查詢。"

---

## 7. Other Pages (Navigable Stubs)

Each renders its wireframe shell + real topbar nav. Interactions that need backend pipelines
(extraction, payment) show a "此功能將於稍後推出" note.

- **Landing** (`/`): hero + value prop + CTA to `/login`. Static content from wireframe.
- **Login** (`/login`): email input + "發送 magic link" button → `supabase.auth.signInWithOtp({ email })`.
  Shows "已寄出登入連結" confirmation. This is real auth, not a stub.
- **Dashboard** (`/dashboard`): lists the seeded demo project (and any the user owns) as cards;
  links to `/projects/[id]/upload`.
- **Upload** (`/projects/[id]/upload`): `.wf-dropzone` UI + file list + "開始分析" button (disabled
  / shows "稍後推出"). No actual processing this cycle.
- **Review** (`/projects/[id]/review`): static extraction-review preview (table preview + mapping
  UI shells), no save.
- **Shortlist** (`/projects/[id]/shortlist`): reads `shortlist_items` joined with units; renders
  `.wf-drag-list` (drag-drop stubbed — reorder via up/down buttons this cycle; full DnD later).
- **Pricing** (`/pricing`): static `.wf-pricing-grid` cards.
- **Payment** (`/payment/success`, `/payment/cancel`): static status pages.

### AppShell
Top bar with brand "Brickwise 磚研", nav links (Dashboard, Pricing), credits balance (read from
`profiles` if logged in, else "登入" link). Footer with disclaimer summary.

---

## 8. Netlify Deployment

`netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```
- Env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) set in Netlify dashboard.
- User provides Supabase project URL + anon key + Netlify site when deploying.

---

## 9. Verification

- `npm run build` passes (TypeScript + Next build).
- `npm run dev`: navigate to `/projects/<seed-project-id>/results` and verify:
  - Table renders with seed rows matching wireframe visuals.
  - Switching price basis recomputes 折實總價 / 折實單呎 for all rows.
  - Sorting by 最低呎價 / 最低總價 reorders rows.
  - Filters remove the correct rows (18F removed by 剔除不划算高層; G/F, 1F removed by
    剔除地下/最低層).
  - Add/remove shortlist persists and updates counter + heart icon.
  - Confidence tags use the correct class per threshold.
  - Clicking 不划算高層 tag expands the explanation.
  - Empty state appears when filters remove everything.
- Navigation across all stub routes works without errors.

No formal unit-test framework in this cycle (keep scope tight); can add Vitest in a later cycle.

---

## 10. Out of Scope (Later Cycles)

- Real extraction pipeline (Module 1 OCR/Vision/LLM).
- Credit charging on upload + insufficient-credits flow.
- Payment integration (Stripe).
- Full drag-and-drop shortlist reordering.
- Persisting `price_basis` selection back to `projects`.
- Extraction Review save/recalculate.
- Mobile-specific tuning beyond the wireframe's existing `@media` rules.
