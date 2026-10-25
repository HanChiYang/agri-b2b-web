# ADR-0001：前端使用 Angular

- 狀態：已接受
- 日期：2026-10-25

## 背景

後端的 [ADR-0001](https://github.com/HanChiYang/agri-b2b-platform/blob/main/docs/adr/0001-web-api-and-separate-frontend.md) 決定前後端分離，前端框架原本寫「React 或 Vue，之後決定」，留到後端計畫的階段 9。

這個平台的畫面以後台的表單、表格為主，前台是商品瀏覽和下單，沒有複雜的動畫或大量的公開頁面。

## 決策

- 前端使用 Angular（目前是 22 版），使用 standalone component、signals、`@if` / `@for` 語法
- 取代後端計畫中「React 或 Vue」的寫法；後端要新增一份 ADR 記錄這個決定，並更新後端的 `docs/plan.md`

## 考慮過的其他方案

- React：生態系最大，但路由、表單、HTTP、測試都要自己挑套件組合，每個決定都要另外寫規則讓 AI 遵守
- Vue：上手快，一樣要另外挑路由以外的不少套件

## 影響

- Angular 內建路由、表單、HTTP client、依賴注入和測試工具，專案的寫法比較一致，AI 產生的程式也比較不會每次用不同的套件
- TypeScript strict 是預設，配合從 OpenAPI 產生的型別，前後端的型別比較容易對上
- Angular 每半年一個大版本，升級要照官方的 `ng update` 指引做
