// 每個 API 的測試說明。key 為 endpoint，值為 guide 物件。
// 沒有對應 guide 的 endpoint 會 fallback 為 ChatBox 預設的空狀態。
//
// guide 結構：
//   summary       — 一句話說明此 API 的用途
//   testPoints    — 這個 API 想驗證什麼（bullet list）
//   sampleQueries — 建議測試提問（bullet list）
//   notes         — 前置條件或注意事項（可省略）
export const apiTestGuides = {
  // ────────── Chat ──────────
  "/openai/chat-noMemory": {
    summary: "OpenAI 純聊天，無任何記憶。",
    testPoints: [
      "每次呼叫都是全新對話，LLM 不會記得前一輪的內容",
      "用來對照『有記憶 vs 無記憶』的差異",
    ],
    sampleQueries: [
      "我叫做 Tony",
      "我叫什麼名字？（預期：LLM 不知道）",
    ],
  },
  "/openai/chat-inMemory": {
    summary: "OpenAI 聊天，搭配 In-memory ChatMemory。",
    testPoints: [
      "同一個 userName 的對話會被記住（存在應用記憶體）",
      "重啟後端後記憶會消失",
      "不同 userName 的對話是隔離的",
    ],
    sampleQueries: [
      "我叫做 Tony",
      "我叫什麼名字？（預期：回答 Tony）",
    ],
    notes: "此 API 需要在上方 Demo 欄位輸入 userName。",
  },
  "/openai/chat-jdbc": {
    summary: "OpenAI 聊天，搭配 JDBC ChatMemory（H2 檔案資料庫）。",
    testPoints: [
      "對話會持久化到 H2 資料庫，重啟後仍保留",
      "可對照 In-memory 版本觀察『持久化』的差異",
      "可到 http://localhost:8080/h2-console 查看實際存下來的訊息",
    ],
    sampleQueries: [
      "記住我最喜歡的顏色是藍色",
      "（重啟後端後）我最喜歡什麼顏色？",
    ],
    notes: "此 API 需要在上方 Demo 欄位輸入 userName。",
  },
  "/ollama/chat-jdbc": {
    summary: "Ollama 本地模型（llama3.2:1b），搭配 JDBC ChatMemory。",
    testPoints: [
      "使用本地端 Ollama 模型，不依賴 OpenAI API",
      "回應速度與品質可與 OpenAI 版對照",
    ],
    sampleQueries: [
      "用繁體中文自我介紹",
      "解釋什麼是 Spring Boot",
    ],
    notes: "需事先啟動 Ollama 服務並下載 llama3.2:1b 模型。",
  },

  // ────────── RAG ──────────
  "/rag/rag": {
    summary: "Manual RAG：手動 similaritySearch + 自組 prompt。",
    testPoints: [
      "檢索『星辰科技』虛構知識庫（rag-collection）",
      "驗證 LLM 依知識庫回答，不會亂編",
      "對照 /openai/chat-noMemory 問相同問題 → LLM 應該不知道",
      "log 會顯示 [DOCS] 檢索結果與 similarity score",
    ],
    sampleQueries: [
      "Nova AI Pro 方案多少錢？",
      "星辰科技的 CEO 是誰？",
      "員工每年有幾天特休？",
      "今天台北天氣如何？（預期：拒答，範疇外）",
    ],
    notes: "topK=5、similarityThreshold=0.8；可於 RagController.java 調整。",
  },
  "/rag/ragPdf": {
    summary: "自動 RAG（PDF）：RetrievalAugmentationAdvisor 檢索 pdf-collection。",
    testPoints: [
      "檢索 Eazybytes HR 政策 PDF 的向量結果",
      "由 Advisor 自動處理檢索、增強、生成",
      "對照 /rag/rag 觀察『手動 vs 自動』的實作差異",
    ],
    sampleQueries: [
      "How many days of paid leave do employees get?",
      "What is the work from home policy?",
    ],
  },
  "/rag/ragTavily": {
    summary: "網路搜尋 RAG：改用 Tavily 從網路即時檢索。",
    testPoints: [
      "來源不是本地向量庫，而是 Tavily API 的網路搜尋結果",
      "適合問『即時 / 最新』的問題",
    ],
    sampleQueries: [
      "今天台積電的股價是多少？",
      "2026 年最新的 AI 新聞",
    ],
    notes: "需設定 TAVILY_API_KEY。",
  },
  "/rag/preAndPostRAAdvisor": {
    summary: "完整 pipeline RAG：Query 翻譯（Pre）→ 檢索 → PII 遮罩（Post）→ 生成。",
    testPoints: [
      "Pre-retrieval：把中文 query 翻譯成英文再檢索（提升英文語料的命中率）",
      "Post-retrieval：把檢索結果中的 email / phone 遮罩",
      "觀察 log 可看到 query 被改寫的過程",
    ],
    sampleQueries: [
      "特休假有幾天？（Pre 會翻成英文再檢索）",
    ],
  },

  // ────────── Semantic Cache ──────────
  "/cache/redisCaching-chat": {
    summary: "Redis 語意快取：相似 query 命中快取，跳過 LLM。",
    testPoints: [
      "第一次問會呼叫 LLM 並存快取；第二次問相似問題會直接從 Redis 拿",
      "觀察 token 用量的差異（TokenUsageAuditAdvisor log）",
      "同義句也能命中（不是純字串比對）",
    ],
    sampleQueries: [
      "什麼是 Spring Boot？",
      "請介紹 Spring Boot（預期：命中快取，回應變快）",
    ],
  },
  "/cache/qdrantCaching-chat": {
    summary: "Qdrant 語意快取：使用向量庫做 caching。",
    testPoints: [
      "與 Redis 版對照，都是語意相似度快取但底層儲存不同",
      "可到 Qdrant Dashboard 觀察 caching-collection 內容",
    ],
    sampleQueries: [
      "什麼是 Docker？",
      "介紹一下 Docker（預期：命中快取）",
    ],
  },

  // ────────── Structured Output ──────────
  "/dto/generateJsonDto": {
    summary: "結構化輸出：LLM 回應會被解析成單一 DTO 物件。",
    testPoints: [
      "回應為固定 schema 的 JSON（不是自由文字）",
      "驗證 Spring AI 的 ChatClient.entity() 機制",
    ],
    sampleQueries: [
      "介紹一位知名的 Java 工程師",
    ],
  },
  "/dto/generateListJsonDto": {
    summary: "結構化輸出：LLM 回應會被解析成 DTO List。",
    testPoints: ["回應為 JSON 陣列，可迭代處理"],
    sampleQueries: ["列出 3 位知名的 AI 研究者"],
  },
  "/dto/generateList": {
    summary: "結構化輸出：LLM 回應會被解析成 List<String>。",
    testPoints: ["驗證非 DTO 的簡單集合輸出"],
    sampleQueries: ["列出 5 種常見的程式語言"],
  },
  "/dto/generateMap": {
    summary: "結構化輸出：LLM 回應會被解析成 Map<String, Object>。",
    testPoints: ["驗證動態 key-value 結構的輸出"],
    sampleQueries: ["提供 3 個城市與其人口數"],
  },

  // ────────── Tools ──────────
  "/tool/time": {
    summary: "Tool Calling：LLM 呼叫 TimeTool 取得目前時間。",
    testPoints: [
      "LLM 無法自己知道時間，需透過 tool call 取得",
      "log 會顯示 [TOOL_CALL] 與 [TOOL_RESP] 的完整流程",
      "同一次 API 內會有多次 LLM Request/Response（tool 前 & tool 後）",
    ],
    sampleQueries: [
      "現在幾點？",
      "現在是台北時間幾點？",
    ],
    notes: "此 API 需要在上方 Demo 欄位輸入 userName。",
  },
  "/tool/helpDeskTicket": {
    summary: "Tool Calling：模擬客服工單建立流程。",
    testPoints: [
      "LLM 會根據使用者訊息呼叫工具建立工單",
      "驗證 tool call 的參數是否正確傳遞",
    ],
    sampleQueries: [
      "我的 Nova AI Pro 帳號無法登入，請幫我建立工單",
    ],
    notes: "此 API 需要在上方 Demo 欄位輸入 userName。",
  },

  // ────────── Email ──────────
  "/email/emailResponse": {
    summary: "Email 自動回覆：根據來信內容生成回覆草稿。",
    testPoints: ["驗證 prompt template 的參數注入與 email 語氣"],
    sampleQueries: [
      "客戶抱怨產品運送延遲三天，請生成道歉信",
    ],
  },
};
