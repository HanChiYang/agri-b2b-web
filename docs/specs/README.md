# 功能規格

每個階段或功能開工前，先在這裡寫一份規格，使用者確認後才寫測試和程式。流程見 [ADR-0005](../adr/0005-adopt-backend-dev-workflow.md)。

- 用 `write-spec` skill 寫（[.claude/skills/write-spec/SKILL.md](../../.claude/skills/write-spec/SKILL.md)），從 [_template.md](_template.md) 複製開始
- 檔名和 branch 名稱對應，例如 branch `feature/f2-auth` 的規格是 `f2-auth.md`
- 驗收條件要編號（AC-1、AC-2…），每一條都要有對應的測試。最外層的 `describe` 用規格檔名，測試名稱開頭標出編號，例如 `it('AC-1：…')`
- 狀態：草稿 → 已確認（使用者同意，可以開始寫測試）→ 已完成（測試全部通過）
- 狀態還不是「已確認」時，hook 會擋下 Claude 對 `src/`、`e2e/`、`public/` 的修改；把狀態改成「已確認」時會跳出確認視窗
- 「待確認」還有項目時不能改成「已確認」；規格確認之後的任何修改都會跳出確認視窗
- 會改變已完成規格的行為時，在新規格的「影響到的既有規格」列出來，並更新舊規格的內容，讓每份規格都描述目前的行為；當時的版本看 git 歷史
- hook 依規格開頭的 `- 狀態：…` 和 `## 待確認` 段落判斷，修改 `_template.md` 的這兩處時要一起修改 `.claude/hooks/require-confirmed-spec.mjs`

## 清單

| 規格 | 對應階段 | 狀態 |
|---|---|---|
