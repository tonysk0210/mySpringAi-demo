# 儲存庫指南

## 專案結構與模組組織

本專案是以 Vite 建置的 React 單頁應用程式。程式碼位於 `src/`：頁面放在 `src/pages/`、可重用 UI 元件放在 `src/components/`、共用狀態放在 `src/context/`、HTTP 設定位於 `src/api/`，端點資訊則位於 `src/config/`。全域樣式位於 `src/index.css` 與 `src/App.css`。需匯入的圖片放在 `src/assets/`；需原樣提供的檔案放在 `public/`。`src/main.jsx` 負責啟動應用程式，`src/App.jsx` 管理路由。請勿編輯或提交 `dist/` 內的建置產物。

## 建置、測試與開發指令

- `npm install`：依鎖定檔安裝相依套件。
- `npm run dev`：啟動支援熱更新的 Vite 開發伺服器；`/api` 請求會代理至 `http://localhost:8080`。
- `npm run lint`：使用 ESLint 檢查所有 JavaScript 與 JSX。
- `npm run build`：在 `dist/` 產生最佳化的正式環境版本。
- `npm run preview`：在本機預覽正式環境建置結果。

建立 Pull Request 前，請執行 lint 與 build。

## 程式風格與命名慣例

使用現代 ES Modules 與 React 函式元件。遵循現有 JSX 風格，通常採兩個空格縮排，應用程式檔案使用分號；若舊檔案風格不同，請避免無關的格式變更。元件與頁面檔案使用 PascalCase，例如 `ChatBox.jsx`、`ToolTimePage.jsx`；Hook 以 `use` 開頭，例如 `useDemo.js`；變數與函式使用 camelCase。頁面負責路由專屬的流程，重複使用的行為或呈現應抽取為元件。ESLint 會套用 JavaScript、React Hooks 與 Vite Refresh 的建議規則。

## 測試指南

目前尚未設定自動化測試框架或 `npm test` 指令。每次變更都應執行 `npm run lint` 與 `npm run build`，再透過 `npm run dev` 手動驗證受影響的路由，包括載入中、錯誤及 API 成功狀態。若新增測試，請將 `*.test.jsx` 放在來源檔案旁，或統一放在 `src/__tests__/`，並於 `package.json` 加入測試指令。

## Commit 與 Pull Request 指南

近期提交多使用 `update`、`update css` 等簡短訊息。為提高可追溯性，請改用簡潔、祈使語氣且包含範圍的主旨，例如 `fix(audio): handle empty transcription`，並讓每次提交聚焦於單一目的。Pull Request 應說明使用者可見的變更、列出驗證指令、連結相關 Issue，且 UI 變更應附上截圖或錄影。若修改 API 路由、代理或環境變數，請明確註記。

## 設定與安全性

可透過 `VITE_API_BASE_URL` 指定其他後端。請勿將機密資訊提交至版本控制，並注意所有 `VITE_` 變數都會暴露於瀏覽器。HTTP 行為應集中於 `src/api/client.js`，路由定義則集中於 `src/config/`。
