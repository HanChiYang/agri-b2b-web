# CLAUDE.md

農藥經銷 B2B 訂購平台的前端（Angular + Angular Material）。

- 前端的決策、範圍、開發階段與進度：`docs/plan.md`
- 需求、角色、API 草稿以後端為準：`D:\CHI\c_sharp_workspace\nissan` 的 `docs/plan.md`、`docs/adr/`
- 後端本機執行：見後端的 `README.md`，API 在 `http://localhost:5034`，API 文件在 `http://localhost:5034/scalar`
- 建置、測試、lint 的指令：階段 F1 建立專案骨架後補上

## Git 流程（一定要遵守）

- **commit 與 push 一律要經過使用者確認。** 完成一個段落（例如一個階段）且測試通過後，先列出要 commit 的檔案和 commit 訊息，使用者同意才執行 `git commit`、`git push`。使用者拒絕時不要重試，改成列出建議的 commit 訊息與指令，交給使用者自己執行
- 不在本機的 `main` 上開發或 commit，`main` 只用來 `git pull` 最新版本
  - 唯一的例外：repo 的第一個 commit（`docs/plan.md`、`CLAUDE.md`）直接 commit 在 `main`，之後才有 `main` 可以開 branch
- 開始任何工作前，先單獨執行這行，再開始改檔案：
  `git switch main && git pull && git switch -c feature/<簡短描述>`
  - 修 bug 用 `fix/<簡短描述>`
  - 一個階段或一個功能一個 branch，例如 `feature/f1-skeleton`
- 完成後 commit、`git push -u origin <branch>`（都要使用者確認），再由使用者到 GitHub 開 Pull Request，用 Squash and merge 合併進 `main`
- 不直接 push 到 `main`
- PR 合併後：`git switch main && git pull`，再刪掉本機的 branch
- 後端的 hook（擋下不在 `feature/`、`fix/` branch 上的修改、push 到 `main`）還沒搬過來，見 `docs/plan.md` 階段 F0。搬過來之前要自己遵守上面的規則

## 開發流程：規格 → 測試 → 實作（一定要遵守）

每個階段或功能都照這個順序做，不可以跳步。做法和原因與後端相同，見後端的 `CLAUDE.md` 和 ADR-0011、0012、0014、0017。

1. **寫規格**：寫成 `docs/specs/<branch 名稱去掉 feature/>.md`，並加進 `docs/specs/README.md` 的清單。驗收條件要編號（AC-1、AC-2…），寫使用者看得到的行為，不寫實作細節。會改變已完成規格的行為時，寫在「影響到的既有規格」。寫完就停下來請使用者確認；**使用者同意之前，不寫測試和程式**。使用者回答「待確認」的問題後，把結論寫進規格對應的段落、從「待確認」移除，再把狀態改成「已確認」
2. **先寫測試**：每條驗收條件至少對應一個測試。測試名稱開頭標出編號，例如 `it('AC-1：…')`；最外層的 `describe` 用規格檔名，例如 `describe('f2-auth', …)`（每份規格的編號都從 AC-1 開始，要靠它區分）。元件和 service 的行為用 Vitest 測，需要真的後端才能確認的完整流程用 Playwright。寫完執行一次，確認新的測試是因為功能還沒做而失敗，不是因為測試本身寫錯
3. **實作**：寫到全部測試通過，lint 也沒有錯誤。**不可以為了讓測試通過而修改或刪除測試。** 唯一的例外是規格「影響到的既有規格」列出的測試：照新的行為修改，並一起更新舊規格的內容。覺得測試或規格有錯，或遇到規格沒寫到的情況，先停下來問使用者；同意後先改規格，再改測試
4. **審查**：交給沒有對話上下文的 agent 做兩種審查：
   - 對照規格：只告訴它規格檔的路徑，**不要附上自己的說明或判斷**（`spec-reviewer` subagent 搬過來之前，用一般的 subagent 做同樣的事）
   - 執行 `/code-review` 找 bug

   把兩邊的結果整理給使用者，由使用者決定要修哪些。符合下面任一條才建議修：
   - 規格的驗收條件沒做到，或那條完全沒有測試
   - 在現在或下一個階段真的會發生，而且會顯示或送出錯的資料、有安全漏洞，或讓建置、CI、本機開發跑不起來

   其他的一律建議不修，每項只寫一行理由；和之後階段有關的，用一行記在 `docs/plan.md` 對應的階段。修完只重新跑測試，不再整份審查；修改本身很大時，才再審查一次，而且只審查這次修改的部分
5. **收尾**：確認建置、測試、lint 都通過；在 `docs/plan.md` 打勾，規格狀態改成「已完成」，再 commit、push

## 修 bug 的流程（一定要遵守）

在 `fix/<簡短描述>` branch 上做，不用另外寫規格。

1. **先重現**：寫一個會因為這個 bug 而失敗的測試，執行確認它真的失敗。測試放在相關規格的測試檔裡，名稱標出對應的驗收條件
2. **規格沒寫到的情況**：找不到對應的驗收條件，表示 bug 是規格沒寫清楚或沒寫到的情況。先停下來問使用者，同意後在那份規格補上驗收條件，測試標上新的編號
3. **修正**：修到全部測試通過。一樣不可以為了讓測試通過而修改或刪除其他測試
4. **審查**：執行 `/code-review` 找 bug；有修改規格的話，也對照那份規格審查。結果的處理方式和開發流程的第 4 步相同
5. **收尾**：確認建置、測試、lint 都通過，再 commit、push

## 品質檢查

- TypeScript 開啟 strict，ESLint 的警告一律視為錯誤
- **不可以為了讓建置或 lint 通過而關掉檢查**，例如 `// eslint-disable`、`@ts-ignore`、`@ts-expect-error`、用 `any` 或 `as` 硬轉型別、調低規則等級。真的需要時，先問使用者，並在旁邊寫明原因
- 工具產生的檔案（例如從 OpenAPI 產生的型別）不手改，也不用處理裡面原本就有的檢查設定
- GitHub Actions 會在每個 PR 檢查 lint、建置和測試，沒通過就不能合併（階段 F1 建立）

## 和後端的關係

- API 的格式以後端為準，型別從後端的 OpenAPI 文件產生，不要手寫一份和後端不一致的型別
- 前端需要、後端還沒有或不好用的 API，不要在前端繞過去，也不要在這個 repo 的工作中修改後端。記在 `docs/plan.md` 第 6 節，交給後端的流程處理
- 權限一律由後端把關，前端的 guard 和隱藏按鈕只是為了畫面好用

## 前端的慣例

- 畫面文字用繁體中文（台灣用語）
- 金額是整數新台幣元，時間由後端以 UTC 傳來；一律用 `shared/` 的 pipe 顯示，不在各頁面自己格式化（見 `docs/plan.md` 5.4）
- 不使用 `innerHTML`、`bypassSecurityTrust*`，避免 XSS（token 存在 `localStorage`）
- 重要決策寫成 ADR，放在 `docs/adr/`，並更新 `docs/adr/README.md` 的清單（目錄在階段 F0 建立）
