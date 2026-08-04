# Brickwise 磚研 MVP Wireframe — 實作計劃（完整版）

## Summary

本計劃覆蓋 Brickwise 磚研 MVP wireframe 的完整實作流程，包含已確認的需求邊界（MVP 範圍：Module 1/3/6、Extraction Review、Credits 收費）、頁面架構、Results 頁重點稿設計、CSS 擴展、Wiring 邏輯，以及交付驗證清單。

---

## Current State Analysis

### 已完成工作

- 讀取 PRD（`brickwise-prd-mvp.md`）與 design brief（`brickwise-trae-design-brief.md`）
- 確認 MVP 範圍無衝突
- 建立 `brickwise-mvp-wireframe` 專案目錄結構（`assets/`、`pages/`、`partials/`、`.preflight/`）
- 建立 `colors_and_type.css`（品牌 CSS，含 `wf-*` 系統）
- 跑通 CSS preflight（`@theme inline` 與 `semantic-token-fallback` 均存在）
- 預先註冊 17 個 `.design` 頁面節點
- 建立 `generation-tree.json` 與 `runtime-orchestration-summary.json`
- 完成 dispatch preflight（`build-page-dispatch-manifest.mjs` 回傳 17 entries，pass）
- 生成 5 個 partial fragments（`project-shell.html`、`public-shell.html`、`app-shell.html`、`upload-shell.html`、`results-shell.html`）

### 磁盤上已存在的頁面（12 個）

| 檔案 | 狀態 |
|------|------|
| `pages/flow-overview.html` | 已完成 |
| `pages/landing.html` | 已完成 |
| `pages/login.html` | 已完成 |
| `pages/dashboard.html` | 已完成 |
| `pages/upload-empty.html` | 已完成 |
| `pages/upload-ready.html` | 已完成 |
| `pages/upload-processing.html` | 已完成 |
| `pages/upload-insufficient-credits.html` | 已完成 |
| `pages/shortlist.html` | 已完成 |
| `pages/pricing-buy-credits.html` | 已完成 |
| `pages/payment-success.html` | 已完成 |
| `pages/payment-cancel.html` | 已完成 |

### 磁盤上缺失的頁面（5 個）

| 優先級 | 頁面 ID | 檔案 | 說明 |
|--------|---------|------|------|
| **P0** | extraction-review | `extraction-review.html` | 欄位檢閱與修正（AI 抽取後、人工確認前） |
| **P0** | results-default | `results-default.html` | Results 預設視圖（預設以折實單呎價格排序） |
| **P1** | results-price-basis | `results-price-basis.html` | 切換至「建築面積單呎」排序基準 |
| **P1** | results-tag-explanation | `results-tag-explanation.html` | 展開「標籤說明」面板的狀態 |
| **P2** | results-empty | `results-empty.html` | 篩選後無任何結果的空狀態 |

### `.design` interactions 現況

- 全部 17 個節點的 `interactions` 均為 `[]`（待填入）
- 需要在最後一步統一填入所有按鈕/連結的導航互動

---

## Proposed Changes

### 1. CSS 擴展（`colors_and_type.css`）

新增以下 4 個 class 定義：

```css
/* 排序下拉選單 */
.wf-select { min-height: 44px; width: 100%; padding: 0 14px; border: 1px solid var(--bw-line); border-radius: 10px; background: var(--bw-surface); color: var(--bw-ink); display: flex; align-items: center; font-size: 14px; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237f8aa0' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }

/* 表格列懸停高亮 */
.wf-table tbody tr:hover td { background: rgba(53, 88, 230, 0.04); }

/* 信心指數標籤 */
.wf-tag.confidence-high { background: rgba(85, 98, 122, 0.08); color: var(--bw-ink-2); border-color: rgba(85, 98, 122, 0.12); }
.wf-tag.confidence-mid { background: rgba(183, 121, 31, 0.1); color: var(--bw-state-warning); border-color: rgba(183, 121, 31, 0.18); }

/* 操作連結 */
.wf-action-link { color: var(--bw-brand); font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; }
.wf-action-link:hover { text-decoration: underline; }
```

### 2. `extraction-review.html`（P0）

**目的**：在 AI 抽取信心不足時，以最少操作救回結果。是 Flow3 的核心閘門頁。

**版型**：使用 `app-shell` partial（雙欄佈局 `.wf-status-layout`）

**內容結構**：
- 頁首 panel：kicker「Extraction Review」、標題「檢閱已抽取的欄位，確認後繼續比較」、副標題說明目的
- 左側主卡片：`.wf-drag-list` 呈現已抽取單位清單（grid 5列：`26px 2fr 1fr 1fr 0.6fr auto`）
  - 列：拖曳把手、單位名稱、實用面積、折實總價、信心指數標籤、修正按鈕
  - 信心指數：>90% 灰、80-90% 黃、<80% 紅色警示
  - 點擊「修正」展開該單位完整欄位表（標示需修正的格位）
- 右側 aside 卡片：說明如何修正與確認邏輯、disclaimer
- 底部按鈕：「確認並開始比較」（主要）、返回上一步」（次要）

**Wiring**：`confirm-extraction` → `upload-processing.html`（或直接 `results-default.html`）；`back-to-upload` → `upload-ready.html`

### 3. `results-default.html`（P0）

**目的**：整個 MVP 最重要的決策頁。讓用戶在可理解的介面中排序、篩選、加入心水。

**版型**：使用 `results-shell` partial（`.wf-result-layout` 雙欄）

**內容結構**：
- 控制列（sticky）：
  - kicker + 大標題（已比較單元數量）
  - filter chips（全部 / 已加入 Shortlist）
  - sort dropdown（折實單呎 / 建築面積單呎）
  - 結果數量 badge
- 主表格（`.wf-table-card`）：
  - 欄位：加入心水、樓層、單位、實用面積、折實總價、折實單呎、標籤、說明入口
  - 信心指數標籤（`.wf-tag.confidence-high/.confidence-mid`）
  - 操作列：「加入 Shortlist」（`.wf-action-link`）
- 側欄卡片（`.wf-card`）：
  - 價格基準說明卡（折實單呎公式 + 切換連結）
  - 標籤說明卡（了解標籤含義 →）
  - 心水單位計數卡
  - disclaimer（`.wf-note.warn`）

**Wiring**：`add-to-shortlist` → `shortlist.html`；`switch-to-building-sqft` → `results-price-basis.html`；`open-tag-explanation` → `results-tag-explanation.html`

### 4. `results-price-basis.html`（P1）

**目的**：切換至建築面積單呎排序基準，展示不同排序順序。

**與 default 的差異**：
- sort dropdown 選擇「建築面積單呎」
- 表格第4列標題變為「建築單呎」
- 側欄價格說明卡替換為建築面積單呎公式說明
- 切換連結文字改為「恢復折實單呎 →」

**Wiring**：`switch-to-net-sqft` → `results-default.html`

### 5. `results-tag-explanation.html`（P1）

**目的**：展開說明 Results 頁中的標籤（信心指數、Shortlist 標記、排序基準）含義。

**與 default 的差異**：
- filter chip「標籤說明」呈 active 狀態
- 側欄卡片替換為說明面板（`.wf-list` 標籤說明卡片）
  - 信心指數閾值說明
  - Shortlist 標記說明
  - 排序基準說明
  - 返回連結

**Wiring**：`return-from-explanation` → `results-default.html`

### 6. `results-empty.html`（P2）

**目的**：篩選後無結果的 empty state，提供明確的回復路徑。

**主表格區**：使用 `.wf-empty-state`（現有 CSS：`display: grid; place-items: center; min-height: 360px`）
- 空狀態晶片「篩選結果為空」
- 標題「沒有符合條件的單位」
- 副標題說明放寬篩選
- 按鈕：「返回預設檢視」、「重新修正資料」

**Wiring**：`return-to-default-results` → `results-default.html`；`retry-extraction` → `extraction-review.html`

### 7. Wiring 邏輯（`.design` interactions 填入）

需要在 `.design` 的 17 個節點的 `devMetadata.interactions` 填入以下 `data-dom-id` → `targetPageId` 映射：

| dom-id | 頁面 | 目的地 |
|--------|------|--------|
| `go-landing` | `flow-overview.html` | `landing.html` |
| `cta-login` | `landing.html` | `login.html` |
| `magic-link-sent` | `login.html` | `dashboard.html` |
| `open-upload` | `dashboard.html` | `upload-empty.html` |
| `start-analysis` | `upload-ready.html` | `upload-processing.html` |
| `credits-blocked` | `upload-ready.html` | `upload-insufficient-credits.html` |
| `need-review` | `upload-processing.html` | `extraction-review.html` |
| `analysis-direct-results` | `upload-processing.html` | `results-default.html` |
| `go-pricing` | `upload-insufficient-credits.html` | `pricing-buy-credits.html` |
| `pay-success` | `pricing-buy-credits.html` | `payment-success.html` |
| `pay-cancel` | `pricing-buy-credits.html` | `payment-cancel.html` |
| `resume-project` | `payment-success.html` | `dashboard.html` |
| `return-pricing` | `payment-cancel.html` | `pricing-buy-credits.html` |
| `confirm-extraction` | `extraction-review.html` | `upload-processing.html` |
| `back-to-upload` | `extraction-review.html` | `upload-ready.html` |
| `add-to-shortlist` | `results-default.html` | `shortlist.html` |
| `switch-to-building-sqft` | `results-default.html` | `results-price-basis.html` |
| `switch-to-net-sqft` | `results-price-basis.html` | `results-default.html` |
| `open-tag-explanation` | `results-default.html` | `results-tag-explanation.html` |
| `return-from-explanation` | `results-tag-explanation.html` | `results-default.html` |
| `return-to-default-results` | `results-empty.html` | `results-default.html` |
| `retry-extraction` | `results-empty.html` | `extraction-review.html` |
| `go-to-shortlist` | `shortlist.html` | `results-default.html` |

---

## Assumptions & Decisions

- **CSS 新增 class**：`colors_and_type.css` 缺少 `.wf-select`、信心標籤、hover 行高亮，需直接追加至現有檔案
- **Results 4 狀態共享結構**：所有 Results 頁共用 `.wf-result-layout` + `.wf-table-card` 外殼；僅 control state、table state、aside state 有差異
- **Extraction Review 閘門設計**：若抽取信心高，flow 直接跳 `results-default.html`；若信心低則需經 `extraction-review.html` 確認
- **Shortlist 與 Results 雙向互通**：Shortlist 頁可返回 Results，Results 可加入 Shortlist
- **Credits 不足 flow**：在 `upload-ready.html` 的「開始分析」前檢查 credits；若不足直接顯示 `upload-insufficient-credits.html`，不浪費 credits
- **付款 flow**：第三方支付成功/取消後分別進 `payment-success.html` / `payment-cancel.html`，主 CTA 均為返回 `dashboard.html`

---

## Verification Steps

### 檔案存在性
- [ ] `pages/extraction-review.html` 存在
- [ ] `pages/results-default.html` 存在
- [ ] `pages/results-price-basis.html` 存在
- [ ] `pages/results-tag-explanation.html` 存在
- [ ] `pages/results-empty.html` 存在
- [ ] `colors_and_type.css` 包含 `.wf-select`、`.wf-tag.confidence-*`、`.wf-action-link`、`.wf-table tbody tr:hover`

### HTML 語法
- [ ] 每個 HTML 檔案以 `<!DOCTYPE html>` 開頭
- [ ] `<html lang="zh-Hant">`
- [ ] `<link rel="stylesheet" href="../colors_and_type.css">`
- [ ] `<body class="wireframe-body">`
- [ ] `<div class="wf-shell">` 包覆內容
- [ ] `<header class="wf-topbar">` 存在
- [ ] `<main class="wf-page">` 存在
- [ ] `<footer class="wf-footer">` 存在

### CSS Token 一致性
- [ ] 所有顏色使用 `var(--bw-*)` 或 `var(--bw-state-*)`
- [ ] 所有 border-radius 使用 `var(--radius-*)` 或 `var(--bw-radius-*)`
- [ ] 所有間距為 8px 倍數

### Wiring 邏輯
- [ ] `.design` 的 interactions 已填入（見上方 wiring 表格）
- [ ] Results 4 狀態共用 `.wf-result-layout` 結構
- [ ] Extraction Review 使用 `.wf-drag-list` 5列 grid
- [ ] 所有 Results 頁側欄均有 Shortlist 計數 badge
- [ ] 所有頁面 footer 含 disclaimer「比較結果僅供參考，並非投資意見。」

### MVP 範圍核查
- [ ] 無平面圖分析頁
- [ ] 無周邊市場比較頁
- [ ] 無按揭/付款條款分析頁
- [ ] 無完整 billing center

### Flow 閉環核查
- [ ] Flow 1：`landing → login → dashboard → upload → results` 可走通
- [ ] Flow 2：`upload → insufficient-credits → pricing → payment-success → dashboard` 可走通
- [ ] Flow 3：`upload → extraction-review → results` 可走通
- [ ] Flow 4：`results → shortlist → export` 可走通

### 狀態覆蓋核查
- [ ] Upload 空白
- [ ] Upload 已上載未分析
- [ ] 分析中 loading
- [ ] credits 不足
- [ ] Extraction Review
- [ ] Results 正常
- [ ] Results empty
- [ ] Payment success

---

## 執行次序

1. **CSS 擴展**（`colors_and_type.css`）— 新增 4 個 class
2. **`extraction-review.html`** — P0，閘門頁
3. **`results-default.html`** — P0，最重要頁
4. **`results-price-basis.html`** — P1，切換狀態
5. **`results-tag-explanation.html`** — P1，說明狀態
6. **`results-empty.html`** — P2，空狀態
7. **Wiring** — 更新 `.design` 的 interactions 陣列
8. **驗證** — `validate-design-workspace.mjs` + `validate-finish-readiness.mjs`
