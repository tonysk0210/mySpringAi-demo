# mySpringAi-demo

全端 Spring AI 展示專案，涵蓋多種 LLM 整合模式。後端採用 **Spring Boot 4.1.0 + Spring AI 2.0.0**（Java 25、Maven），前端採用 **React 19 + Vite 8**。

---

## 目錄

- [功能特色](#功能特色)
- [架構說明](#架構說明)
- [技術堆疊](#技術堆疊)
- [環境需求](#環境需求)
- [快速啟動](#快速啟動)
- [API 端點](#api-端點)
- [設定說明](#設定說明)
- [基礎設施服務](#基礎設施服務)
- [專案結構](#專案結構)
- [前端開發指南](#前端開發指南)

---

## 功能特色

| 類別 | 說明 |
|---|---|
| **對話（Chat）** | 透過 OpenAI 或本地 Ollama 進行無狀態、記憶體內及 H2 持久化對話 |
| **RAG** | 手動向量搜尋、PDF 檢索、網路搜尋（Tavily）、進階查詢翻譯 + PII 遮罩 |
| **語意快取** | Redis 與 Qdrant 兩種後端——語意相似的查詢直接命中快取，略過 LLM |
| **結構化輸出** | 自動反序列化為 DTO、`List<DTO>`、`List<String>`、`Map<String, Object>` |
| **工具呼叫** | 時區查詢與服務單管理，透過 Spring AI MCP 實作 |
| **Email 自動回覆** | 從客戶來信自動生成專業回覆 |
| **圖片生成** | OpenAI DALL-E，支援自訂模型、品質與尺寸 |
| **音訊處理** | 語音轉文字（Whisper）與文字轉語音，支援聲音、格式、速度設定 |
| **可觀測性** | OpenTelemetry 追蹤（Jaeger）、Prometheus 指標、Grafana 儀表板、Token 用量稽核 |

---

## 架構說明

```
mySpringAi-demo/
├── mySpringAi/          # Spring Boot 後端
└── mySpringAi-ui/       # React 前端
```

### 後端設計模式

每個展示功能皆為獨立的 `@RestController`，對應一個專屬的 `ChatClient` Bean。`config/` 套件透過組合三個層次來建立各 Bean：

```
LLM 供應商    ──┐
記憶體策略    ──┼──▶  ChatClient Bean  ──▶  Controller  ──▶  REST 端點
Advisor 鏈   ──┘
```

**可用的 ChatClient Bean：**

| Bean | 供應商 | 記憶體 | 特色 |
|---|---|---|---|
| `openaiCCNoMem` | OpenAI | 無 | 預設日誌 |
| `openaiCCInMemory` | OpenAI | 記憶體內（50 則） | — |
| `openaiCCJdbcMemory` | OpenAI | H2/JDBC（50 則） | — |
| `ollamaCCJdbcMemory` | Ollama | H2/JDBC（50 則） | 本地模型 |
| `openaiCCNoMemRedisCache` | OpenAI | 無 | Redis 語意快取 |
| `openaiCCNoMemQdrantCache` | OpenAI | 無 | Qdrant 語意快取 |
| `openaiCCJdbcMemoryWithToolCalling` | OpenAI | H2/JDBC | MCP 工具呼叫 |

所有對話 Bean 均使用：`temperature=0.5`、`maxTokens=500`、`PrettyLoggerAdvisor`、`TokenUsageAuditAdvisor`。

### Advisor 鏈

Controller 透過在 `ChatClient` 呼叫上附加 Advisor 來組合行為，執行順序至關重要：

```
請求（Request）
  │
  ▼
TokenUsageAuditAdvisor   (order: -2) — 回應後記錄 Token 用量
PrettyLoggerAdvisor      (order: -1) — 格式化輸出請求／回應至主控台
MessageChatMemoryAdvisor            — 注入／儲存對話歷史
RetrievalAugmentationAdvisor        — RAG：查詢 → 向量搜尋 → 增強提示詞
SemanticCacheAdvisor                — 快取命中時直接短路，略過 LLM
  │
  ▼
LLM
```

### 對話隔離

HTTP header `userName` 作為 `MessageChatMemoryAdvisor` 的 `conversationId`，依使用者與端點限定對話記憶體範圍——不同端點維持各自獨立的對話歷史。

---

## 技術堆疊

### 後端
- Java 25、Spring Boot 4.1.0、Spring AI 2.0.0
- OpenAI（`gpt-4.1-mini`、`gpt-image-1`、`whisper-1`、`gpt-4o-mini-tts`）
- Ollama（`llama3.2:1b`）— 本地 LLM
- H2（檔案式持久化對話記憶體）
- Qdrant（向量資料庫——RAG 與語意快取）
- Redis Stack（語意快取）
- OpenTelemetry + Prometheus + Grafana + Jaeger（可觀測性）
- Lombok

### 前端
- React 19.2.7、Vite 8.1.1
- React Router v7
- Axios 1.18.1（120 秒逾時、繁體中文錯誤訊息）
- 深色主題設計系統（CSS 自定義屬性）

---

## 環境需求

- **Java 25**（或相容 JDK）
- **Node.js 20+** 與 npm
- **Docker Desktop**（用於 Qdrant、Redis 及選用的監控服務）
- **Maven Wrapper**（已內建，使用 `./mvnw`）
- API 金鑰（請參閱[設定說明](#設定說明)）

---

## 快速啟動

### 1. 設定 API 金鑰

建立 `mySpringAi/src/main/resources/api.properties`（已加入 .gitignore）：

```properties
spring.ai.openai.api-key=sk-...
spring.ai.tavily.api-key=tvly-...   # 僅 /rag/ragTavily 需要
```

### 2. 啟動基礎設施

```bash
cd mySpringAi
docker compose up -d          # 啟動 Qdrant + Redis + Jaeger
```

### 3. 啟動後端

```bash
cd mySpringAi
./mvnw spring-boot:run        # 監聽 :8080
```

### 4. 啟動前端

```bash
cd mySpringAi-ui
npm install
npm run dev                   # 監聽 :5173
```

開啟 **http://localhost:5173**——在頂部欄位設定使用者名稱，再從側邊欄選擇任一展示功能。

### 選用：啟用完整監控服務

```bash
cd mySpringAi
docker compose --profile monitoring up -d    # 另加 Prometheus + Grafana
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=monitoring"
```

---

## API 端點

所有端點均接受 `POST` 請求，`Content-Type: application/json`。需要維護對話歷史的端點必須提供 `userName` HTTP header。

### 對話 — `/openai` 與 `/ollama`

| 端點 | 模型 | 記憶體 | 需要 `userName` |
|---|---|---|---|
| `POST /openai/chat-noMemory` | gpt-4.1-mini | 無 | 否 |
| `POST /openai/chat-inMemory` | gpt-4.1-mini | 記憶體內 | 是 |
| `POST /openai/chat-jdbc` | gpt-4.1-mini | H2/JDBC | 是 |
| `POST /ollama/chat-jdbc` | llama3.2:1b | H2/JDBC | 是 |

請求本體：`{ "message": "..." }`

### RAG — `/rag`

| 端點 | 策略 |
|---|---|
| `POST /rag/rag` | 手動對 `rag-collection` 進行相似度搜尋，搭配自訂提示詞範本 |
| `POST /rag/ragPdf` | 使用 `RetrievalAugmentationAdvisor` 查詢 `pdf-collection`（topK=3，threshold=0.5） |
| `POST /rag/ragTavily` | 透過 Tavily API 進行即時網路搜尋 |
| `POST /rag/preAndPostRAAdvisor` | 檢索前：中文→英文查詢翻譯；檢索後：Email／電話 PII 遮罩 |

請求本體：`{ "message": "..." }`

### 語意快取 — `/cache`

| 端點 | 後端 |
|---|---|
| `POST /cache/redisCaching-chat` | Redis（相似度閾值：0.9） |
| `POST /cache/qdrantCaching-chat` | Qdrant `caching-collection`（相似度閾值：0.8） |

請求本體：`{ "message": "..." }`

### 結構化輸出 — `/dto`

| 端點 | 回傳型別 |
|---|---|
| `POST /dto/generateJsonDto` | `CountryCitiesDto { country: String, city: List<String> }` |
| `POST /dto/generateListJsonDto` | `List<CountryCitiesDto>` |
| `POST /dto/generateList` | `List<String>` |
| `POST /dto/generateMap` | `Map<String, Object>` |

請求本體：`{ "message": "..." }`

### 工具呼叫 — `/tool`

| 端點 | 可用工具 | 需要 `userName` |
|---|---|---|
| `POST /tool/time` | `getCurrentLocalTime()`、`getCurrentTime(timeZone)` | 是 |
| `POST /tool/helpDeskTicket` | `createTicket(...)`、`getTicketStatus()` | 是 |

`getTicketStatus` 從 H2 資料庫依 `userName` 篩選並回傳服務單。  
請求本體：`{ "message": "..." }`

### Email 自動回覆 — `/email`

| 端點 | 說明 |
|---|---|
| `POST /email/emailResponse` | 根據客戶來信自動生成專業 Email 回覆 |

請求本體：`{ "customerName": "...", "customerMessage": "..." }`

### 圖片生成 — `/image`

| 端點 | 模型 | 備註 |
|---|---|---|
| `POST /image/image` | gpt-image-1 | 預設：1024×1024，品質 auto |
| `POST /image/image-options` | 可設定 | 接受 model、quality、size 參數 |

基本請求：`{ "message": "..." }`  
進階請求：`{ "message": "...", "model": "gpt-image-1", "quality": "high", "size": "1024x1024" }`  
生成圖片儲存至 `image-output/`，對外路徑為 `/generated-images/**`。

### 音訊 — `/audio`

| 端點 | 類型 | 備註 |
|---|---|---|
| `POST /audio/transcribe` | 語音轉文字 | 預設設定（whisper-1） |
| `POST /audio/transcribe-options` | 語音轉文字 | 可設定：格式、語言、溫度、提示詞 |
| `POST /audio/text-to-speech` | 文字轉語音 | 預設聲音，MP3 輸出 |
| `POST /audio/text-to-speech-options` | 文字轉語音 | 可設定：聲音、速度、格式（mp3/opus/aac/flac/wav/pcm） |

生成音訊檔案儲存至 `audio-output/`。

---

## 設定說明

### `mySpringAi/src/main/resources/application.properties`

```properties
server.port=8080

# LLM 模型
spring.ai.openai.chat.options.model=gpt-4.1-mini
spring.ai.ollama.chat.options.model=llama3.2:1b

# H2 持久化記憶體
spring.datasource.url=jdbc:h2:file:./h2db/chatmemory

# Qdrant（gRPC）
spring.ai.vectorstore.qdrant.host=localhost
spring.ai.vectorstore.qdrant.port=6334

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379

# OpenTelemetry（Jaeger）
spring.ai.chat.observations.include-prompt=true
management.otlp.tracing.endpoint=http://localhost:4318/v1/traces
management.tracing.sampling.probability=1.0

# 檔案上傳限制
spring.servlet.multipart.max-file-size=25MB
spring.servlet.multipart.max-request-size=25MB

# 預設系統語言
spring.ai.openai.chat.options.system=回答時請使用清楚、易理解且專業的繁體中文。
```

### `mySpringAi/src/main/resources/api.properties`（需手動建立，已加入 .gitignore）

```properties
spring.ai.openai.api-key=${OPENAI_API_KEY:}
spring.ai.tavily.api-key=${TAVILY_API_KEY:}
```

---

## 基礎設施服務

所有服務定義於 `mySpringAi/compose.yml`。執行 `./mvnw spring-boot:run` 時，Spring Boot 會自動啟動這些服務。

| 服務 | 映像檔 | 連接埠 | 用途 |
|---|---|---|---|
| Qdrant | `qdrant/qdrant:latest` | 6333（REST）、6334（gRPC） | RAG 向量資料庫 + 語意快取 |
| Redis Stack | `redis/redis-stack:latest` | 6379（客戶端）、8001（Insight UI） | 語意快取 |
| Jaeger | `jaegertracing/all-in-one:latest` | 16686（UI）、4317（gRPC）、4318（HTTP） | 分散式追蹤 |
| Prometheus | `prom/prometheus` *（monitoring profile）* | 9090 | 指標收集 |
| Grafana | `grafana/grafana` *（monitoring profile）* | 3000 | 儀表板（admin/admin） |

### Qdrant 向量集合

| 集合名稱 | 使用端點 |
|---|---|
| `rag-collection` | `/rag/rag` 手動搜尋 |
| `pdf-collection` | `/rag/ragPdf` 自動 Advisor（topK=3，threshold=0.5） |
| `caching-collection` | Qdrant 語意快取 |

### 關鍵網址

| 服務 | 網址 |
|---|---|
| 後端 API | http://localhost:8080 |
| H2 主控台 | http://localhost:8080/h2-console |
| Actuator / Prometheus | http://localhost:8080/actuator/prometheus |
| 前端開發伺服器 | http://localhost:5173 |
| Qdrant 儀表板 | http://localhost:6333 |
| Redis Insight | http://localhost:8001 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |
| Jaeger UI | http://localhost:16686 |

---

## 專案結構

```
mySpringAi-demo/
├── mySpringAi/                              # Spring Boot 後端
│   ├── src/main/java/com/example/mySpringAi/
│   │   ├── advisor/                         # TokenUsageAuditAdvisor、PrettyLoggerAdvisor
│   │   ├── config/                          # ChatClient Bean、RAAdvisorConfig、VectorStoreConfig
│   │   ├── controller/                      # 每個功能一個 Controller
│   │   │   ├── GenericChatController.java   # /openai/*、/ollama/*
│   │   │   ├── RagController.java           # /rag/*
│   │   │   ├── ImageController.java         # /image/*
│   │   │   ├── AudioController.java         # /audio/*
│   │   │   ├── ToolCallingController.java   # /tool/*
│   │   │   ├── SemanticCachingController.java # /cache/*
│   │   │   ├── JsonOutputController.java    # /dto/*
│   │   │   └── AutoEmailResponseController.java # /email/*
│   │   ├── dto/                             # CountryCitiesDto
│   │   ├── entity/                          # HelpDeskTicketEntity（JPA）
│   │   ├── payload/                         # 請求／回應 Record 型別
│   │   ├── repo/                            # HelpDeskTicketRepository
│   │   ├── service/                         # HelpDeskTicketService
│   │   ├── tools/                           # TimeTool、HelpDeskTicketTool（MCP）
│   │   └── util/                            # MaskingDocumentPostProcessor、RagDataLoader 等
│   ├── src/main/resources/
│   │   ├── promptTemplate/                  # StringTemplate（.st）提示詞範本
│   │   ├── application.properties
│   │   ├── application-monitoring.properties
│   │   └── api.properties                   # （已加入 .gitignore，需手動建立）
│   ├── compose.yml                          # Docker 服務定義
│   └── pom.xml
│
├── mySpringAi-ui/                           # React 前端
│   ├── src/
│   │   ├── api/client.js                    # Axios 實例
│   │   ├── components/                      # ChatBox、AudioSpeechDemo、AudioTranscriptionDemo 等
│   │   ├── config/
│   │   │   ├── apiRoutes.js                 # 導覽選單定義（資料驅動）
│   │   │   └── apiTestGuides.js             # 各端點範例查詢與測試要點
│   │   ├── context/
│   │   │   ├── DemoContext.jsx              # 全域狀態（userName + 訊息歷史）
│   │   │   └── useDemo.js                   # Context 存取 Hook
│   │   ├── pages/                           # 25+ 薄包裝頁面元件
│   │   └── App.jsx                          # 路由宣告
│   ├── vite.config.js                       # /api 代理至 :8080
│   └── package.json
│
├── CLAUDE.md
└── README.md
```

---

## 前端開發指南

### 新增展示頁面

1. 在 `src/config/apiRoutes.js` 新增項目（自動驅動導覽選單）
2. 在 `src/App.jsx` 新增 `<Route>`
3. 在 `src/pages/` 建立薄包裝頁面元件：

```jsx
import ChatBox from '../components/ChatBox';

export default function MyFeaturePage() {
  return (
    <ChatBox
      endpoint="/my-feature/endpoint"
      title="我的功能"
      description="此展示說明。"
    />
  );
}
```

### 全域狀態

狀態存放於 `DemoContext`（無 Redux）：

```
{ userName: string, messagesByUserAndEndpoint: { [userName]: { [endpoint]: Message[] } } }
```

兩個欄位皆持久化至 `sessionStorage`（鍵值：`myspringai:userName`、`myspringai:messages`）。透過 `useDemo()` Hook 存取。

### 訊息格式

```js
{ role: "user" | "assistant" | "error", content: string, imageUrl?: string }
```

### HTTP 客戶端行為

- 基底 URL：`VITE_API_BASE_URL` 環境變數（預設：`/api`，由 Vite 代理至 `:8080`）
- 逾時：120 秒
- 換頁時中止的請求會靜默丟棄，不顯示錯誤
- 所有錯誤訊息以繁體中文顯示
