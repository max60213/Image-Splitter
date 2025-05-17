# System Patterns

## 架構
- Electron 作為桌面應用殼，載入 Vue 前端
- Vue 前端負責 UI 與用戶互動
- Python backend（Flask）負責圖片分割 API
- 前後端以 HTTP API 溝通（本機 localhost）

## 關鍵設計
- 前端與 backend 分離，易於維護與擴展
- 圖片分割邏輯集中於 Python，確保效能與可攜性
- Electron 啟動時同時啟動 backend（未來可自動化） 