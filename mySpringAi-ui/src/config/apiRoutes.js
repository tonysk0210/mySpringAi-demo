// Navbar 的 API 選單設定：依功能分組並提供顯示名稱、導覽路徑與模型名稱。
// path：NavLink 前往的網址；label：畫面名稱；model：該 route 預設使用的模型。
// requiresUserName：記錄 API 是否需要 userName，目前實際行為由各 Page 傳給 ChatBox。
// 此檔案不建立 React Route；URL 對應的 Page 仍在 App.jsx 定義。
export const apiGroups = [
  {
    label: "Chat",
    routes: [
      {
        path: "/openai/chat-noMemory",
        label: "OpenAI · 無記憶對話",
        model: "gpt-4.1-mini",
      },
      {
        path: "/openai/chat-inMemory",
        label: "OpenAI · 記憶體對話記憶",
        model: "gpt-4.1-mini",
        requiresUserName: true,
      },
      {
        path: "/openai/chat-jdbc",
        label: "OpenAI · JDBC 對話記憶",
        model: "gpt-4.1-mini",
        requiresUserName: true,
      },
      {
        path: "/ollama/chat-jdbc",
        label: "Ollama · JDBC 對話記憶",
        model: "llama3.2:1b",
        requiresUserName: true,
      },
    ],
  },
  {
    label: "RAG",
    routes: [
      { path: "/rag/rag", label: "手動向量檢索 RAG", model: "gpt-4.1-mini" },
      {
        path: "/rag/ragPdf",
        label: "PDF Retrieval Advisor",
        model: "gpt-4.1-mini",
      },
      {
        path: "/rag/preAndPostRAAdvisor",
        label: "完整 Pre/Post RAG Pipeline",
        model: "gpt-4.1-mini",
      },
      {
        path: "/rag/ragTavily",
        label: "Tavily 即時網路搜尋",
        model: "gpt-4.1-mini",
      },
    ],
  },
  {
    label: "Semantic Cache",
    routes: [
      {
        path: "/cache/redisCaching-chat",
        label: "Redis 語意快取",
        model: "gpt-4.1-mini",
      },
      {
        path: "/cache/qdrantCaching-chat",
        label: "Qdrant 語意快取",
        model: "gpt-4.1-mini",
      },
    ],
  },
  {
    label: "Structured Output",
    routes: [
      {
        path: "/dto/generateJsonDto",
        label: "單一 JSON DTO",
        model: "gpt-4.1-mini",
      },
      {
        path: "/dto/generateListJsonDto",
        label: "JSON DTO 陣列",
        model: "gpt-4.1-mini",
      },
      { path: "/dto/generateList", label: "字串陣列", model: "gpt-4.1-mini" },
      {
        path: "/dto/generateMap",
        label: "Key-Value Map",
        model: "gpt-4.1-mini",
      },
    ],
  },
  {
    label: "Tools",
    routes: [
      {
        path: "/tool/time",
        label: "時間查詢 Tool · JDBC 記憶",
        model: "gpt-4.1-mini",
        requiresUserName: true,
      },
      {
        path: "/tool/helpDeskTicket",
        label: "客服工單 Tool · JDBC 記憶",
        model: "gpt-4.1-mini",
        requiresUserName: true,
      },
    ],
  },
  {
    label: "Email",
    routes: [
      {
        path: "/email/emailResponse",
        label: "自動產生客服回信",
        model: "gpt-4.1-mini",
      },
    ],
  },
  {
    label: "Image",
    routes: [
      {
        path: "/image/image",
        label: "基礎圖片生成",
        model: "gpt-image-1-mini",
      },
      {
        path: "/image/image-options",
        label: "進階圖片生成 Options",
        model: "gpt-image-1",
      },
    ],
  },
  {
    label: "Audio",
    routes: [
      {
        path: "/audio/transcribe",
        label: "基礎音訊轉文字",
        model: "whisper-1",
      },
      {
        path: "/audio/transcribe-options",
        label: "進階音訊轉文字 Options",
        model: "whisper-1",
      },
      {
        path: "/audio/text-to-speech",
        label: "基礎文字轉語音",
        model: "gpt-4o-mini-tts",
      },
      {
        path: "/audio/text-to-speech-options",
        label: "進階文字轉語音 Options",
        model: "gpt-4o-mini-tts",
      },
    ],
  },
];
