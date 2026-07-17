# 儲存庫指南

## 專案結構與模組組織

本儲存庫包含兩個應用程式。`mySpringAi/` 是以 Java 25、Spring Boot 與 Spring AI 建置的後端；程式碼位於 `src/main/java/com/example/mySpringAi/`，並分為 `controller`、`service`、`repo`、`config` 等套件。測試在 `src/test/java/` 中採用對應的套件結構；設定檔與提示詞位於 `src/main/resources/`。`mySpringAi-ui/` 是 Vite/React 前端，其 `src/` 依頁面、元件、API 輔助程式、Context、設定與資產分類。修改各模組時，也須遵循模組內更具體的 `AGENTS.md`。請勿提交產生的 `target/`、`dist/`、`logs/`、`h2db/` 或媒體輸出目錄。

## 建置、測試與開發指令

請從對應的模組目錄執行指令。

- `mySpringAi\mvnw.cmd spring-boot:run`：啟動後端；已設定的 Compose 相依服務也可能一併啟動。
- `mySpringAi\mvnw.cmd test`：執行 JUnit 測試套件。
- `mySpringAi\mvnw.cmd clean package`：執行測試並建置可執行 JAR。
- 在 `mySpringAi-ui/` 執行 `npm install`：依鎖定檔安裝前端相依套件。
- `npm run dev`：啟動支援熱更新的 Vite 開發伺服器。
- `npm run lint`：使用 ESLint 檢查 JavaScript 與 JSX。
- `npm run build`：在 `dist/` 產生正式環境前端套件。

## 程式碼風格與命名慣例

Java 使用四個空格縮排、PascalCase 型別名稱、camelCase 成員名稱，以及 `Controller`、`Service`、`Repository`、`Dto`、`Payload` 等後綴。保留既有的 `com.example.mySpringAi` 套件名稱，並優先使用建構式注入。React 使用 ES Modules、函式元件、兩個空格縮排、PascalCase 元件與頁面檔名（例如 `ChatBox.jsx`）、camelCase 函式，以及以 `use` 開頭的 Hook。避免無關的格式調整；前端靜態檢查以 ESLint 為準。

## 測試準則

後端測試使用 JUnit 5、Mockito 與 AssertJ。測試類別命名為 `*Test`，方法名稱應描述可觀察行為，例如 `textToSpeechReturnsInlineMp3Bytes`。除非需要驗證應用程式 wiring，否則應使用聚焦的單元測試，而非 `@SpringBootTest`。前端目前未設定測試執行器或覆蓋率門檻；請執行 lint 與 build，並手動驗證受影響路由的成功、載入中及錯誤狀態。

## Commit 與 Pull Request 準則

歷史紀錄中常見 `update` 等過短主旨；新的 commit 應具體且使用祈使語氣，例如 `fix(audio): validate empty transcription`。每個 commit 應聚焦於單一變更。Pull request 應說明行為差異、列出驗證指令、連結相關 issue，並標示 API、環境或 Compose 異動。UI 變更應附截圖，API 變更應提供請求與回應範例。

## 安全性與設定

機密資料應透過 `OPENAI_API_KEY` 等環境變數提供。切勿提交憑證、本機資料庫、日誌、產生的媒體，或 `api.properties` 中的敏感值。請注意，所有 `VITE_` 變數都會暴露給瀏覽器端使用者。
