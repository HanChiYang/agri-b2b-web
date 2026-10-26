# 架構決策紀錄（ADR）

這裡記錄前端的重要決策，以及當時為什麼這樣決定。整個平台的決策（例如 JWT、金額只用整數）見後端的 [docs/adr](https://github.com/HanChiYang/agri-b2b-platform/blob/main/docs/adr/README.md)。

- 「提議中」的 ADR 可以直接修改
- 「已接受」的 ADR 不再修改；決策改變時新增一份 ADR，並把舊的狀態改成「已被 ADR-XXXX 取代」

## 清單

| 編號 | 標題 | 狀態 |
|---|---|---|
| [0001](0001-angular.md) | 前端使用 Angular | 已接受 |
| [0002](0002-angular-material.md) | UI 套件使用 Angular Material | 已接受 |
| [0003](0003-single-site-for-shop-and-admin.md) | 前台和後台做成同一個網站 | 已接受 |
| [0004](0004-separate-repo.md) | 前端放在獨立的 repo | 已接受 |
| [0005](0005-adopt-backend-dev-workflow.md) | 沿用後端的開發流程 | 已接受 |

## 範本

```markdown
# ADR-XXXX：標題

- 狀態：提議中
- 日期：YYYY-MM-DD

## 背景

為什麼需要做這個決定，當時有哪些限制。

## 決策

決定怎麼做。

## 考慮過的其他方案

- 方案：為什麼沒選

## 影響

這個決定帶來的好處、代價，以及之後要注意的事。
```
