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
    sampleQueries: ["我叫做 Tony", "我叫什麼名字？（預期：LLM 不知道）"],
  },
  "/openai/chat-inMemory": {
    summary: "OpenAI 聊天，搭配 In-memory ChatMemory。",
    testPoints: [
      "同一個 userName 的對話會被記住（存在應用記憶體）",
      "重啟後端後記憶會消失",
      "不同 userName 的對話是隔離的",
    ],
    sampleQueries: ["我叫做 Tony", "我叫什麼名字？（預期：回答 Tony）"],
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
    summary:
      "Ollama 本地模型（llama3.2:1b），搭配 JDBC ChatMemory（H2 檔案資料庫）。",
    testPoints: [
      "使用本地端 Ollama 模型，不依賴 OpenAI API",
      "回應速度與品質可與 OpenAI 版對照",
      "可到 http://localhost:8080/h2-console 查看實際存下來的訊息",
    ],
    sampleQueries: ["用繁體中文自我介紹", "解釋什麼是 Spring Boot"],
    notes: "需事先啟動 Ollama 服務並下載 llama3.2:1b 模型。",
  },

  // ────────── RAG ──────────
  "/rag/rag": {
    summary: "Manual RAG：手動 Similarity Search + 自組 System Prompt。",
    testPoints: [
      "檢索『星辰科技』虛構知識庫（rag-collection）",
      "驗證 LLM 依知識庫回答，不會亂編",
      "對照 /openai/chat-noMemory 問相同問題 → LLM 應該不知道",
      "console log 會顯示 [SYSTEM] 檢索結果與 similarity score",
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
    summary:
      "自動 RAG（PDF）：RetrievalAugmentationAdvisor 檢索 pdf-collection。",
    testPoints: [
      "檢索 ApexTech Solutions HR 政策 PDF 的向量結果（繁體中文）",
      "由 Advisor 自動處理檢索、增強、生成",
      "對照 /rag/rag 觀察『手動 vs 自動』的實作差異",
    ],
    sampleQueries: [
      "員工每年可以請幾天特休假？",
      "遠端工作政策是什麼？",
      "試用期多久？",
    ],
  },
  "/rag/ragTavily": {
    summary: "網路搜尋 RAG：改用 Tavily 從網路即時檢索。",
    testPoints: [
      "來源不是本地向量庫，而是 Tavily API 的網路搜尋結果",
      "適合問『即時 / 最新』的問題",
    ],
    sampleQueries: ["今天台積電的股價是多少？", "2026 年最新的 AI 新聞"],
    notes: "需設定 TAVILY_API_KEY。",
  },
  "/rag/preAndPostRAAdvisor": {
    summary:
      "完整 pipeline RAG：Query 翻譯（Pre）→ 檢索 → PII 遮罩（Post）→ 生成。",
    testPoints: [
      "Pre-retrieval：把 query 翻譯成繁體中文再檢索（PDF 是中文，同語言命中率較高）",
      "Post-retrieval：檢索結果中的 email / phone 會被替換成 [機敏資訊遮罩_EMAIL] / [機敏資訊遮罩_PHONE]",
      "觀察 console log 可看到 query 被改寫的過程",
      "用英文提問最能看出翻譯效果",
      "驗證遮罩：console log 的 [USER] 區塊應該看到遮罩符號（不是原始 email/phone）",
    ],
    sampleQueries: [
      "How many days of paid leave do employees get?（會翻成中文再檢索）",
      "特休假有幾天？（同語言，翻譯後幾乎不變）",
      "HR 部門的 email 是什麼？（測 email 遮罩）",
      "HR 部門的電話？（測 phone 遮罩）",
      "請完整列出文件中所有的聯絡方式（測遮罩最完整）",
    ],
    notes:
      "遮罩發生在 LLM 收到 context 之前 → LLM 回答本來就不會有 email/phone，要看 console log 才能確認遮罩生效。",
  },

  // ────────── Semantic Cache ──────────
  "/cache/redisCaching-chat": {
    summary: "Redis 語意快取：相似 query 命中快取，跳過 LLM。",
    testPoints: [
      "第一次問會呼叫 LLM 並存快取；第二次問相似問題會直接從 Redis 拿",
      "第二次詢問相似問題時，可從後端 console log 判斷是否有再次向 LLM 發送 request",
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
      "第二次詢問相似問題時，可從後端 console log 判斷是否有再次向 LLM 發送 request",
      "可到 Qdrant Dashboard（http://localhost:6333/dashboard#/collections）觀察 caching-collection 內容",
    ],
    sampleQueries: ["什麼是 Docker？", "介紹一下 Docker（預期：命中快取）"],
  },

  // ────────── Structured Output ──────────
  "/dto/generateJsonDto": {
    summary:
      "結構化輸出：LLM 回應會被解析成 CountryCitiesDto { country: String, city: List<String> }。",
    testPoints: [
      "回應為固定 schema 的 JSON（不是自由文字）",
      "驗證 Spring AI 的 ChatClient.entity(CountryCitiesDto.class) 機制",
      "提問必須符合『一個國家 + 多個城市』的語意，否則欄位會空或牛頭不對馬嘴",
    ],
    sampleQueries: [
      "介紹日本的主要城市",
      "台灣有哪些著名的城市？",
      "列出法國最大的五個城市",
    ],
    notes: "DTO 結構限制回應必須是單一國家；問多國會被壓縮成一筆或亂填。",
  },
  "/dto/generateListJsonDto": {
    summary:
      "結構化輸出：LLM 回應會被解析成 List<CountryCitiesDto>（多國各自的城市清單）。",
    testPoints: [
      "回應為 JSON 陣列，每筆都是 { country, city[] }",
      "驗證 Spring AI 的 ChatClient.entity(ParameterizedTypeReference) 機制",
      "適合同時查多個國家的城市資訊",
    ],
    sampleQueries: [
      "列出台灣、日本、韓國各自的主要城市",
      "請提供亞洲三個代表國家的主要城市清單",
      "美國、英國、法國各有哪些著名城市？",
    ],
  },
  "/dto/generateList": {
    summary: "結構化輸出：LLM 回應會被解析成 List<String>（純字串陣列）。",
    testPoints: [
      "驗證非 DTO 的簡單集合輸出（無業務欄位約束）",
      "由 ListOutputConverter 處理",
    ],
    sampleQueries: [
      "列出 5 種常見的程式語言",
      "列出 10 個台灣夜市名稱",
      "提供 8 個常用的英文問候語",
    ],
  },
  "/dto/generateMap": {
    summary:
      "結構化輸出：LLM 回應會被解析成 Map<String, Object>（動態 key-value）。",
    testPoints: [
      "驗證動態 key-value 結構的輸出（key 名稱由 LLM 決定）",
      "由 MapOutputConverter 處理",
      "適合『屬性值不固定』的場景",
    ],
    sampleQueries: [
      "提供 3 個亞洲城市與其人口數",
      "列出 5 種水果與它們的產季",
      "提供 4 個程式語言與它們的主要用途",
    ],
  },

  // ────────── Tools ──────────
  "/tool/time": {
    summary: "Tool Calling：LLM 呼叫 TimeTool 取得目前時間。",
    testPoints: [
      "LLM 無法自己知道時間，需透過 tool call 取得",
      "log 會顯示 [TOOL_CALL] 與 [TOOL_RESP] 的完整流程",
      "同一次 API 內會有多次 LLM Request/Response（tool 前 & tool 後）",
    ],
    sampleQueries: ["現在幾點？", "現在是台北時間幾點？"],
    notes: "此 API 需要在上方 Demo 欄位輸入 userName。",
  },
  "/tool/helpDeskTicket": {
    summary: "Tool Calling：客服工單建立與查詢。",
    testPoints: [
      "每次處理工單問題時，會先呼叫 getTicketStatus，再比對現有工單的 issue",
      "已有語意相近的工單時，不會重複建立，而是回覆現有工單的 id 與 status",
      "沒有相似工單時，才會呼叫 createTicket，並回覆新工單的 id 與 eta",
      "每次查詢狀態都會重新呼叫 getTicketStatus，不使用對話記憶中的舊資料",
      "查詢結果應列出 id、issue、status、eta",
      "可直接回答的一般問題會優先回答，不建立工單",
      "createTicket → 呼叫 HelpDeskTicketService 存進 H2 資料庫",
      "getTicketStatus → 依 userName 撈出該使用者所有工單",
      "userName 由後端 header 注入 ToolContext，不由 LLM 自行填寫",
      "可到 http://localhost:8080/h2-console 查看 HELP_DESK_TICKET 資料表",
    ],
    sampleQueries: [
      "我的 Nova AI Pro 帳號無法登入，請幫我建立工單",
      "訂閱升級後功能還沒開通，請開一張工單追蹤",
      "查看我目前所有工單的狀態",
      "我先前的工單處理進度如何？",
      "我有幾張還沒處理完的工單？",
    ],
    notes:
      "此 API 需要在上方 Demo 欄位輸入 userName；同一個 userName 才能查到自己建立的工單。",
  },

  // ────────── Email ──────────
  "/email/emailResponse": {
    summary: "Email 自動回覆：根據來信內容生成回覆草稿。",
    testPoints: [
      "驗證 customerName 與 customerMessage 是否正確注入 prompt template",
      "回信應針對客戶問題提供具體回應，並維持專業、友善的語氣",
      "面對客訴時，回信應提供適當的安撫與保證",
      "輸出應只有電子郵件內文，不包含主旨、署名或簽名",
    ],
    sampleQueries: [
      "我的包裹已經延遲三天，請問何時可以收到？",
      "升級方案並完成付款後，帳號功能仍未開通。",
      "收到的商品有損壞，希望協助更換新品。",
    ],
    notes: "點擊建議提問會填入 Customer message；送出前仍需填寫 Customer name。",
  },
};
