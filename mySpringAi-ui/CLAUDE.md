# CLAUDE.md

本文件為 Claude Code (claude.ai/code) 在此儲存庫中工作時提供指引。

## 常用指令

```bash
npm run dev       # 啟動 Vite 開發伺服器（將 /api/* 代理至 localhost:8080）
npm run build     # 正式環境建置
npm run preview   # 預覽正式建置結果
npm run lint      # 執行 ESLint
```

本專案未設定測試套件，功能驗證需啟動開發伺服器並在瀏覽器中測試。

## 架構

本專案是 Spring AI Demo 的 React 前端。後端為獨立的 Spring Boot 應用，預設執行於 `http://localhost:8080`。Vite 開發伺服器會將所有 `/api/*` 請求代理至該位址（設定於 `vite.config.js`）。API 基底 URL 透過環境變數 `VITE_API_BASE_URL` 設定（預設為 `/api`），定義於 `src/api/client.js`。

### 路由與頁面

使用 React Router v7 搭配 `BrowserRouter`，共 25+ 條路由宣告於 `src/App.jsx`。頁面為輕量包裝元件，通常僅 4–10 行，負責帶入 `title`、`description`、`endpoint` props 並渲染 `ChatBox` 或特化元件。導覽列由 `src/config/apiRoutes.js` 動態驅動，定義選單群組、路由路徑、標籤與模型名稱，JSX 中無硬編碼選單項目。

### 狀態與持久化

全域狀態透過 React Context（無 Redux）存放於 `src/context/DemoContext.jsx`，儲存目前使用者名稱及訊息歷史，結構為 `{ [userName]: { [endpoint]: [...messages] } }`。兩者皆同步至 `sessionStorage`（鍵值：`myspringai:userName`、`myspringai:messages`），確保頁面重新整理後狀態不遺失。

在元件中透過 `src/context/useDemo.js` 匯出的 `useDemo` hook 存取 Context。

### 元件模式

**`ChatBox.jsx`** 是核心可重用元件，主要 props：
- `endpoint` — `/api/*` 路徑，同時作為 HTTP 呼叫 URL 與訊息歷史的 slot 鍵值
- `title`、`description` — 顯示於面板標頭
- `requiresUserName` — 為 true 時，未設定使用者名稱則封鎖發送

訊息物件格式：`{ role: "user"|"assistant"|"error", content: string, imageUrl?: string }`。

請求取消使用 `AbortController`，元件卸載時執行清理，靜默丟棄進行中的請求（換頁時不顯示錯誤）。

**特化頁面元件**（`AudioTranscriptionDemo.jsx`、`AudioSpeechDemo.jsx`、圖片相關頁面）遵循相同 props 模式，但處理檔案上傳或二進位回應。

### HTTP 客戶端

`src/api/client.js` — Axios 實例，逾時設定 120 秒，錯誤攔截器將網路/逾時/HTTP 錯誤轉換為中文使用者訊息。攔截器區分以下情境：HTTP 錯誤回應、後端無回應（服務不可用）、請求逾時、請求中止（靜默丟棄）。

### 設定檔

- `src/config/apiRoutes.js` — 導覽選單結構；新增路由時應先在此處定義
- `src/config/apiTestGuides.js` — 各 endpoint 的範例查詢與測試要點，顯示於 UI 中（選填）

### 樣式

深色主題設計系統定義於 `src/App.css`，使用 CSS 自定義屬性（`--surface`、`--accent`、`--cyan`、`--danger` 等）。色彩配置：深海軍藍 `#10151f`、紫色 `#8b7cff`、青色 `#4bd6d0`。版面：桌機固定側邊欄，行動裝置為漢堡選單滑入式側邊欄。
