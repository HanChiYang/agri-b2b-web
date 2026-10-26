# ADR-0005：沿用後端的開發流程

- 狀態：已接受
- 日期：2026-10-25

## 背景

前端的程式一樣主要由 AI 程式助理（Claude Code）撰寫，使用者負責確認需求和審查。後端已經建立一套流程，原因寫在後端的 ADR：

- [ADR-0011](https://github.com/HanChiYang/agri-b2b-platform/blob/main/docs/adr/0011-spec-first-tdd-and-ci.md)：先寫規格和測試再實作，並由 CI 把關
- [ADR-0012](https://github.com/HanChiYang/agri-b2b-platform/blob/main/docs/adr/0012-fresh-context-review.md)：完成前交給沒有上下文的 agent 審查
- [ADR-0013](https://github.com/HanChiYang/agri-b2b-platform/blob/main/docs/adr/0013-hook-enforced-spec-confirmation.md)：用 hook 確保規格經過使用者確認，才開始寫測試和程式
- [ADR-0014](https://github.com/HanChiYang/agri-b2b-platform/blob/main/docs/adr/0014-changes-after-spec-confirmation.md)：規格確認之後的修改流程
- [ADR-0017](https://github.com/HanChiYang/agri-b2b-platform/blob/main/docs/adr/0017-review-fix-criteria.md)：審查結果只修重要的問題

## 決策

- 沿用上面這些決策，只把 .NET 專用的部分換成前端的做法：

| | 後端 | 前端 |
|---|---|---|
| hook 擋下的目錄 | `src/`、`tests/` | `src/`（程式和 Vitest 測試）、`e2e/`（Playwright 測試）、`public/`（靜態檔） |
| 測試標出驗收條件 | `[Fact(DisplayName = "AC-1：…")]`、`[Trait("Spec", "<規格檔名>")]` | `it('AC-1：…')`，最外層 `describe('<規格檔名>', …)` |
| 測試種類 | 整合測試（Testcontainers） | 元件測試（Vitest），重要流程用 E2E（Playwright） |
| 不能繞過的檢查 | `#pragma warning disable`、`[SuppressMessage]`、`.editorconfig` | `eslint-disable`、`@ts-ignore`、`@ts-expect-error`、`any`、硬轉型別 |

- hook、`write-spec` skill、`spec-reviewer` subagent 從後端複製過來再改，放在 `.claude/`
- 規格多一個「需要後端配合」段落：前端需要、後端還沒有的 API 寫在這裡，不在前端繞過去

## 考慮過的其他方案

- 前端用較輕的流程（不寫規格、不用 hook）：前端的畫面行為一樣會被 AI 理解錯，而且前端的錯誤（例如導向錯誤、送出錯的資料）不一定會被後端擋下。兩個 repo 用同一套流程，使用者也不用記兩種做法

## 影響

- 每個前端階段都要先寫規格，等使用者確認
- 後端修改流程時（例如改了 hook 或 ADR），前端不會自動跟著改，要另外決定是否同步
- 仍然擋不住用 shell 指令寫檔，這部分靠 `CLAUDE.md` 的規則；`ng generate`、`ng new` 這類指令產生的檔案也是一樣
