# Brickwise 磚研 — Product Requirement (MVP v2)

> 定位：香港一手樓準買家上載價單（PDF/PNG/JPG），系統自動抽取成「可排序/可篩選」的單位表，並提供可解釋的標籤（例如不划算高層、最低層），協助用家自助揀樓與導出心水清單。
>
> MVP 範圍：只做 **Module 1 / 3 / 6**，並加入 **Extraction Review（保險頁）**、**Credit-based 收費（信用卡）**、以及 **Vision + LLM 兜底**。

---

## 1. 目標與成功指標

### 1.1 用戶痛點
- 價單複雜、表格欄位多、不同付款計劃（Plan A/B）令比較困難。
- 經紀游說時，用戶缺乏「可自助驗證」的排序/篩選工具。
- OCR/掃描品質參差，純規則抽取容易失敗。

### 1.2 MVP 目標
- 讓用戶於 5 分鐘內完成：上載 → 解析 → 以「最低呎價 / 最低總價」排序 → 剔除「不划算高層 / 最低層」→ 輸出心水 CSV。

### 1.3 成功指標（可量化）
- 文件解析成功率（有結果表可用）：> 90%
- 解析失敗能被救回（透過 Extraction Review 變成可用結果）：> 50%（針對失敗 case）
- 由上載到可排序表格時間（P50）：< 60 秒（視乎文件大小）

---

## 2. MVP 範圍（只做）

### 2.1 Module 1：價單抽取 + 基礎分析
**輸入**
- 1..N 份文件（同一樓盤/Project 可上載多份）
- 支援：PDF / PNG / JPG

**輸出**
- 轉為結構化 `Unit Table`
- 計算：
  - `呎價 = 售價 / 實用面積`
  - `floor premium`（相鄰樓層的價差，% 與 $）
  - 標籤：
    - `最低層 / 地下`（可被 filter 剔除）
    - `不划算高層`（可解釋規則；見第 6 節）

**多價格計劃（Plan A / Plan B / 原價）**
- 系統需支援同一個單位出現多個價錢欄位（例如：原價、Plan A 價、Plan B 價）。
- 解析完成後，系統要讓用戶選擇「本次分析使用哪一個價格基準」：
  - `原價`
  - `Plan A`
  - `Plan B`
  - `最低價（自動）`
- 用戶選擇後，所有指標（呎價、排序、premium、標籤）以該基準重新計算（re-calc 不扣 credits）。

### 2.2 Module 3：排序、篩選、心水清單、CSV
**Sorting（用戶指定）**
- `最低呎價`
- `最低總價`

**Filtering（用戶指定）**
- 剔除 `不划算高層`
- 剔除 `地下 / 最低層`

**Shortlist**
- 加入心水
- 拖拉排序心水優先次序
- 匯出 CSV（心水清單優先；可選匯出當前篩選結果）

### 2.3 Module 6：登入與帳戶（Email magic link）
- Email magic link 登入
- 保存：
  - Projects
  - 上載文件
  - 解析後 Unit Table（含 price basis 選擇）
  - 心水清單
  - credits 使用記錄

---

## 3. 不做（Phase 2+）
- 平面圖特徵識別（明廁/黑廁、走廊比例等）
- 周邊市場橫向對比（一手/二手/溢價率）
- 付款方法解析、按揭風險、倒數提醒/通知

---

## 4. 核心流程（User Flows）

### Flow A：上載與分析（有 credits）
1. Login（magic link）
2. 建立 Project（樓盤名，可選）
3. 上載 1..N 文件
4. 系統估算本次所需 credits（按文件頁數；見第 7 節）並顯示「將扣除 X」
5. 用戶確認開始分析 → 解析 pipeline
6. 若解析信心不足 → 進入 Extraction Review（見 Flow C）
7. 用戶選擇價格基準（原價/Plan A/Plan B/最低價）
8. 顯示 Results Table → 排序/篩選 → 加入心水 → 匯出 CSV

### Flow B：無 credits → 購買 → 回來繼續
1. 用戶按「開始分析」時檢查 credits
2. credits 不足 → 顯示 Upgrade modal → 進入購買頁（信用卡）
3. 付款成功 → credits 增加 → 自動返回 Project 並可重新開始分析

### Flow C：Extraction Review（救回失敗/低信心）
目的：當 OCR/兜底仍然抽唔到穩定表格時，畀用戶「用最少操作」修正，救回結果。

建議 UI（MVP）
- 顯示系統抽出的表格預覽（前 N 行）
- 讓用戶：
  - 指定「邊一行係 header」
  - 將欄位映射到：`樓層`、`單位`、`實用面積`、`原價/Plan A/Plan B/建期`（可多選）
  - 修正少量格（例如 3–10 格）後再按「重新計算」
- 重新計算不再扣 credits（因為成本已經發生）

---

## 5. 資料模型（MVP）

### 5.1 Entities
- `User`
  - `email`
  - `credits_balance`
  - `free_credit_month`（記錄最近一次免費月度 credit 發放月份）
- `Project`
  - `user_id`
  - `name`
  - `created_at`
  - `price_basis`（enum：original / plan_a / plan_b / lowest）
- `Document`
  - `project_id`
  - `file_name`
  - `file_type`
  - `page_count`
  - `file_hash`
  - `status`（uploaded / processing / succeeded / failed）
  - `extraction_confidence`
- `Unit`
  - `project_id`
  - `source_document_id`（追溯來源）
  - `tower`（可空）
  - `floor_raw`（原始字串）
  - `floor_sort_key`（可排序數值）
  - `unit_no`
  - `saleable_area_sqft`
  - `price_original`（可空）
  - `price_plan_a`（可空）
  - `price_plan_b`（可空）
  - `computed_price`（依 price_basis 計算出的本次用價）
  - `psf`（computed）
  - `tags[]`（lowest_floor / overpriced_high_floor …）
  - `explainability`（JSON：存標籤原因、比較基準、計算數）
- `ShortlistItem`
  - `project_id`
  - `unit_id`
  - `rank`（拖拉排序）

---

## 6. 可解釋規則（Explainable Rules）

### 6.1 最低層 / 地下
- 基於 `floor_sort_key`：
  - 全盤最低 `floor_sort_key` 的單位標記為 `最低層`
  - 若 `floor_raw` 命中常見字樣（例如 `G/F`），亦標記 `地下`

### 6.2 不划算高層（按你最新定義調整）
你提出的方向：
- **10% 差就不划算**
- **用全個屋苑/全盤作比較**（而唔係單一 stack）

MVP 建議規則（可配置，預設 10%）：
1. 對每個 stack（同 `tower + unit_no`），計算相鄰樓層的 `premium_per_floor`（用 computed_price）  
   `premium = (price[f] - price[f-1]) / price[f-1]`
2. 若 `premium >= 0.10`（預設）→ 該樓層單位標記 `不划算高層`
3. 同時提供全盤統計作解釋（但不作為硬閾值）：
   - 全盤 premium 的 P50/P75/P90
   - UI 顯示「此 premium 係全盤第幾 percentile」

**標籤解釋（必須展示）**
- 「此單位較上一層貴 +12.3%，高於預設 10% 閾值，因此標記為不划算高層。」

---

## 7. 收費與成本控制（Credit-based + 信用卡）

### 7.1 Credit 扣減原則（按文件頁數）
你要求：
- **每份文件首次成功解析扣 credits**  
- 同一 Project 上載 3 份JPEG文件就要扣 3 credit
- **PDF按文件頁數去計，每5頁的PDF當成一份文件**

MVP 建議（你可按成本再調整）：
- `credits_to_charge = Σ per_document_credits`
- `per_document_credits = max(1, ceil(page_count / 5))`
  - 例：1-5頁扣 1、6-10 頁扣 2…

### 7.2 不重覆燒成本（Cache）
- 同一用戶若重覆上載同一文件（file_hash 相同）：
  - 直接取回舊結果，不再扣 credits、不再跑 vision/LLM

### 7.3 免費額度
- 每用戶免費每月 3 credit（不足以「無限試」，但足夠體驗）

---

## 8. 解析策略（規則優先 + SiliconFlow Vision/LLM 兜底）

### 8.1 Pipeline（概念）
1. 讀取 PDF 結構（可抽到文字/表格就先用，成本較低）
2. 若抽不到或信心低：
   - 轉 page 為圖片 → SiliconFlow Vision OCR
3. 仍然混亂（例如 Plan A/B 欄位、header 不清晰）：
   - 用 LLM 兜底做「結構化」：把 OCR 結果整理成固定 JSON schema（Unit array + 欄位映射 + 信心）

### 8.2 Plan A/B 價格欄位：避免過度依賴 LLM 的做法
優先用規則做「欄位偵測 + 欄位命名」，LLM 只係兜底：
- 規則：
  - header 文字匹配（`PLAN A`、`PLAN B`、`原價/售價/定價`、`折實` 等）
  - 偵測到 Plan A/B 時預設 `最低價`，並提醒用戶可切換
  - 金額格式（HKD、逗號、$）
  - 欄位型態（同一欄大多為金額）
- 若規則偵測到多個 price 欄位但命名不確定：
  - 交由 LLM 回傳「欄位 → price_type」映射
- 最後一關：Extraction Review 讓用戶確認（真正保險）

---

## 9. 合規與免責（MVP 必須）
- 在 `Landing` + `Results` 至少兩處顯示：
  - 「本平台提供之分析及資料僅供參考，並非投資意見 / 法律意見 / 按揭建議。用戶應自行核對原始價單並向專業人士查詢。」
