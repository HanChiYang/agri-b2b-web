# 農藥經銷 B2B 訂購平台：前端開發計畫

- 最後更新：2026-10-25
- 後端專案：`D:\CHI\c_sharp_workspace\nissan`（AgriB2B，GitHub repo `agri-b2b-platform`）
- 需求、範圍、角色、API 草稿以後端的 `docs/plan.md` 為準，這份只寫前端的部分
- 決策的確認結果記錄在[第 1 節](#1-決策紀錄)

## 1. 決策紀錄

2026-10-25 確認：

| # | 問題 | 結論 |
|---|---|---|
| 1 | 前端框架 | Angular（取代後端計畫中的「React 或 Vue，待定」） |
| 2 | 前端放在哪裡 | 獨立 repo，不放進後端 repo |
| 3 | 前台和後台要做成一個網站還是兩個 | 一個網站，後台放在 `/admin/**` 底下，用 lazy loading 分開載入 |
| 4 | 前後端的開發順序 | 後端先完成，前端再開始做功能。前端需要的 API 細節（[第 6 節](#6-需要後端在規格中定下來的事)）在後端寫各階段規格時一起考慮 |
| 5 | 開發流程 | 沿用後端的流程：規格 → 測試 → 實作、hook 擋下規格確認前的修改、完成前交給沒有上下文的 agent 審查、CI 把關 |
| 6 | UI 套件 | Angular Material。重視升級穩定、文件與範例多；表格和檔案上傳要自己多組合幾個元件。比較見[第 3 節](#3-ui-套件比較) |

## 2. 技術選型

| 項目 | 選擇 | 理由 |
|---|---|---|
| 框架 | Angular 22（standalone component、signals、`@if` / `@for` 語法） | 本機已安裝 Angular CLI 22.2.4、Node 24.19 |
| UI 套件 | Angular Material（含 CDK） | 和 Angular 同時發布，升級最順；比較見第 3 節 |
| 表單 | Reactive Forms | 已經穩定；Signal Forms 等正式版再考慮 |
| API 型別 | 從後端的 OpenAPI 文件（`/openapi/v1.json`）自動產生，不手改 | API 一改型別就跟著改，對應後端 ADR-0001 的「用 OpenAPI 文件讓前端對照」 |
| 本機串接 | Angular dev server 的 proxy：`/api` 轉到 `http://localhost:5034` | 開發時不會碰到 CORS |
| 單元與元件測試 | Vitest（Angular CLI 預設）＋ `HttpTestingController` | |
| E2E 測試 | Playwright，只跑重要流程 | |
| 程式碼檢查 | TypeScript strict、angular-eslint、Prettier，警告視為錯誤 | 和後端一致 |
| CI | GitHub Actions：每個 PR 檢查 lint、建置和測試 | 和後端一致 |

## 3. UI 套件比較

2026-10-25 選定 Angular Material，以下是當時的比較。

| | Angular Material | PrimeNG |
|---|---|---|
| 誰維護 | Google 的 Angular 團隊 | PrimeTek（商業公司），開源（MIT） |
| 版本 | 和 Angular 同時發布，升級最順 | 跟著 Angular 升級，但過去的大版本有過不少破壞性變更（例如主題系統整個改寫） |
| 元件數量 | 較少，只有常用的基本元件 | 很多，後台常用的進階元件幾乎都有 |
| 表格 | `mat-table` 只負責顯示，排序、分頁要自己組合 `mat-sort`、`mat-paginator` | `p-table` 內建排序、篩選、分頁、後端分頁（lazy load） |
| 檔案上傳 | 沒有，要自己用 `<input type="file">` 做 | 有 `p-fileUpload` |
| 外觀 | Material Design，客製化比較受限 | 有多套主題，也可以不套樣式、搭配 Tailwind |
| 無障礙 | 很完整（CDK 是業界標準） | 有，但品質比較不一致 |
| 付費項目 | 沒有 | 元件免費；版型範本、舊版本的長期支援要付費 |

對這個專案的影響：

- 後台主要是「表格 + 篩選 + 分頁 + 表單」：經銷商、管理員、商品、訂單列表，還有商品圖片上傳、訂單的日期區間篩選。PrimeNG 現成的元件比較多，可以少寫一些程式
- 這些功能用 Material 也做得到，只是表格和上傳要多組合幾個元件。換來的好處是升級穩定、文件和範例最多

## 4. 頁面與路由

```text
公開（訪客）
  /                    首頁、公司簡介（寫死在前端，後端 ADR-0015）
  /contact             聯絡資訊
  /login               登入

登入後共用
  /change-password     修改密碼；第一次登入或密碼被重設後，強制導向這裡

經銷商
  /products            商品列表：分類篩選、關鍵字搜尋、分頁
  /products/:id        商品詳細資料、選規格、加入購物車
  /cart                購物車（存在前端）
  /checkout            收件資訊（預設帶入 /api/auth/me 的資料）、備註、送出
  /orders              我的訂單
  /orders/:id          訂單詳細資料，狀態是 Pending 時可以取消

後台（限 Admin，lazy load）
  /admin/distributors  列表（搜尋、分頁）、新增、編輯、停用、重設密碼
  /admin/admins        同上；不能停用自己，畫面上直接隱藏這個按鈕
  /admin/categories    分類的新增、編輯、排序、上下架
  /admin/products      商品與規格的新增、編輯、上下架，主圖上傳
  /admin/orders        列表（狀態、經銷商、日期區間）、詳細資料、狀態變更、歷程
```

## 5. 前端的設計原則

### 5.1 專案結構

```text
src/app/
  core/        auth（token、目前使用者）、interceptors、guards、錯誤處理
  api/         從 OpenAPI 產生的型別（不手改）＋ 各功能的 API service
  shared/      共用元件、pipe（新台幣、台灣時間、訂單狀態名稱）
  layouts/     public-layout、shop-layout、admin-layout
  features/
    public/  auth/  shop/  orders/
    admin/   distributors/ admins/ categories/ products/ orders/
```

### 5.2 認證（對應後端 ADR-0005）

- interceptor 在每個請求加上 `Authorization: Bearer <token>`。收到 401 時清掉 token，導回 `/login?returnUrl=...`（帳號停用、密碼被改，讓舊 token 失效時也會走這條路）
- guards：`authGuard` 檢查是否登入，`roleGuard` 檢查是 Admin 還是 Distributor，`mustChangePasswordGuard` 在需要改密碼時擋下其他頁面
- token 放在 `localStorage`，多個分頁共用登入狀態。token 有效 8 小時，沒有 refresh token，過期就重新登入
- 防範 XSS：不使用 `bypassSecurityTrust*`、`innerHTML`，部署時加上 CSP 標頭
- 角色和公司資料以 `/api/auth/me` 為準，解碼 JWT 只用來決定畫面怎麼顯示，權限一律由後端把關

### 5.3 購物車

- 存在 `localStorage`，key 加上使用者 id，換人登入才不會看到別人的購物車
- 只存規格 id 和數量，名稱和價格每次都向後端查最新的
- 送出訂單後以伺服器回傳的金額為準；有規格已下架時，標出是哪幾項
- 送出時鎖住按鈕，避免連點重複下單

### 5.4 顯示格式

- 金額是整數元（後端 ADR-0016），顯示用 `Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 })`
- 時間由後端以 UTC 傳來，顯示時轉成 `Asia/Taipei`
- 訂單狀態在畫面上顯示中文：待確認、已確認、已出貨、已完成、已取消

## 6. 需要後端在規格中定下來的事

後端寫階段 3～6 的規格時，要一起確認下面這些，前端才不用猜。確認後在這裡打勾，寫上對應的後端規格。

- [ ] 登入回應的格式，例如 `{ token, expiresAt, role, mustChangePassword }`（階段 3）
- [ ] 帳號鎖定、帳號停用、帳密錯誤分別回什麼狀態碼和訊息（階段 3）
- [ ] 驗證錯誤用 `ValidationProblemDetails`，`errors` 的 key 對應欄位名稱，前端才能把錯誤標在欄位上（階段 3 起）
- [ ] 商業規則的錯誤（例如不允許的狀態變更、規格已下架）要有固定的錯誤代碼，不要只有文字訊息（階段 3 起）
- [ ] enum 在 JSON 裡用字串，例如 `"Pending"`，不用數字（目前 `OrderStatus` 是 1～5 的 int）
- [ ] 統一的分頁格式，例如 `{ items, totalCount, page, pageSize }`（階段 4）
- [ ] 時間一律用 ISO 8601 UTC 格式
- [ ] 商品圖片的網址：後端用哪個路徑提供，回傳完整 URL 還是相對路徑（階段 5）
- [ ] 下單時規格已下架或改價，回應要包含哪幾項有問題（階段 6）
- [ ] 是否要防止重複下單（idempotency key），或只靠前端鎖按鈕（階段 6）

後端要配合修改的設定：

- [ ] CORS：`appsettings.Development.json` 目前只允許 `http://localhost:5173`（Vite 的預設 port）。前端開發時用 proxy 就不需要 CORS；改成 Angular 預設的 `http://localhost:4200`，或拿掉這個設定都可以，到時候再決定
- [ ] 後端新增一份 ADR：前端用 Angular、前台和後台做成同一個網站，並更新後端 `docs/plan.md` 的第 4 節、第 9 節第 8 項和階段 9

## 7. 開發順序與待辦

前端從後端完成之後開始（見第 1 節第 4 項）。每個階段一樣先寫規格，使用者確認後先寫測試再實作。

### 階段 F0：準備

- [x] 確認前端的架構決策，結果記錄在第 1 節
- [x] 確認 UI 套件：Angular Material（第 1 節第 6 項）
- [ ] 後端新增 Angular 的 ADR，更新後端 `docs/plan.md`（第 6 節最後一項）
- [x] `git init`（預設 branch 為 `main`）
- [ ] 第一個 commit（`docs/plan.md`、`CLAUDE.md`），在 GitHub 建立 repo 並 push
- [x] 建立 `CLAUDE.md`：Git 流程、規格 → 測試 → 實作、修 bug 流程、品質檢查、和後端的關係
- [ ] 建立 `docs/adr/`、`docs/specs/`（含 `_template.md`、`README.md`）
- [ ] 把後端的 hook（`require-feature-branch`、`require-confirmed-spec`）、`write-spec` skill、`spec-reviewer` subagent 改成前端適用的版本

`.gitignore` 等到階段 F1 由 `ng new` 產生，現在先建立的話，可能會和 `ng new` 產生的檔案衝突；屆時再補上 `.claude/settings.local.json` 等不進版控的檔案。

### 階段 F1：專案骨架

- [ ] `ng new`，啟用 strict
- [ ] 加入 Angular Material（`ng add @angular/material`），設定主題
- [ ] ESLint、Prettier，警告視為錯誤
- [ ] Vitest、Playwright
- [ ] dev server 的 proxy
- [ ] 三種 layout：公開、經銷商、後台
- [ ] 首頁（公司簡介）、聯絡資訊頁
- [ ] 從後端 OpenAPI 產生型別的指令
- [ ] CI：GitHub Actions 在每個 PR 檢查 lint、建置和測試

完成標準：執行 `npm start` 後可以看到首頁和聯絡資訊頁，`/api` 的請求會轉到後端。

### 階段 F2：認證（需要後端階段 3）

- [ ] 登入頁、登入失敗與帳號鎖定的提示
- [ ] interceptor、guards
- [ ] 修改密碼，第一次登入強制改密碼
- [ ] 收到 401 時登出並導回登入頁

完成標準：管理員登入後進入後台，經銷商登入後進入商品列表；經銷商打開 `/admin` 會被擋下。

### 階段 F3：後台帳號管理（需要後端階段 4）

- [ ] 經銷商列表（搜尋、分頁）、新增、編輯、停用、重設密碼
- [ ] 管理員列表、新增、編輯、停用、重設密碼；不能停用自己
- [ ] 初始密碼和重設後的密碼用 dialog 顯示，只顯示一次

### 階段 F4：商品與分類（需要後端階段 5）

- [ ] 後台：分類、商品、規格的管理，主圖上傳
- [ ] 經銷商端：商品列表（分類、關鍵字、分頁）與詳細資料

### 階段 F5：訂單（需要後端階段 6）

- [ ] 購物車、結帳
- [ ] 經銷商：我的訂單、訂單詳細資料、取消訂單
- [ ] 後台：訂單列表（篩選）、詳細資料、狀態變更與歷程
- [ ] Playwright 跑完整流程：經銷商下單 → 管理員確認 → 出貨 → 完成，以及取消

完成標準：一張訂單可以從前端下單一路走到完成，也可以取消。

### 階段 F6：部署（配合後端階段 8）

- [ ] `ng build` 產生靜態檔
- [ ] 前端和 API 放在同一個網域（nginx 反向代理，或由 ASP.NET Core 提供靜態檔），到時候和後端的部署方式一起決定
- [ ] CSP 等安全性標頭
