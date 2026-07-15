// Navbar 的 API 選單設定：依功能分組並提供顯示名稱、導覽路徑與完成狀態。
// path：NavLink 前往的網址；label：畫面名稱；ready：是否顯示 SOON。
// requiresUserName：記錄 API 是否需要 userName，目前實際行為由各 Page 傳給 ChatBox。
// 此檔案不建立 React Route；URL 對應的 Page 仍在 App.jsx 定義。
export const apiGroups = [
  {
    label: "Chat",
    routes: [
      {
        path: "/openai/chat-noMemory",
        label: "OpenAI · No Memory",
        ready: true,
      },
      {
        path: "/openai/chat-inMemory",
        label: "OpenAI · In-memory",
        ready: true,
        requiresUserName: true,
      },
      {
        path: "/openai/chat-jdbc",
        label: "OpenAI · JDBC",
        ready: true,
        requiresUserName: true,
      },
      {
        path: "/ollama/chat-jdbc",
        label: "Ollama · JDBC",
        ready: true,
        requiresUserName: true,
      },
    ],
  },
  {
    label: "RAG",
    routes: [
      { path: "/rag/rag", label: "Manual RAG", ready: true },
      { path: "/rag/ragPdf", label: "PDF Advisor", ready: true },
      { path: "/rag/ragTavily", label: "Tavily Search", ready: true },
      {
        path: "/rag/preAndPostRAAdvisor",
        label: "Pre/Post Advisor",
        ready: true,
      },
    ],
  },
  {
    label: "Semantic Cache",
    routes: [
      { path: "/cache/redisCaching-chat", label: "Redis Cache", ready: true },
      { path: "/cache/qdrantCaching-chat", label: "Qdrant Cache", ready: true },
    ],
  },
  {
    label: "Structured Output",
    routes: [
      { path: "/dto/generateJsonDto", label: "JSON DTO", ready: true },
      { path: "/dto/generateListJsonDto", label: "DTO List", ready: true },
      { path: "/dto/generateList", label: "String List", ready: true },
      { path: "/dto/generateMap", label: "Map", ready: true },
    ],
  },
  {
    label: "Tools",
    routes: [
      {
        path: "/tool/time",
        label: "Time Tool · JDBC",
        ready: true,
        requiresUserName: true,
      },
      {
        path: "/tool/helpDeskTicket",
        label: "Help Desk · JDBC",
        ready: true,
        requiresUserName: true,
      },
    ],
  },
  {
    label: "Email",
    routes: [
      { path: "/email/emailResponse", label: "Email Response", ready: true },
    ],
  },
  {
    label: "Image",
    routes: [
      { path: "/image/image", label: "Generate Image", ready: true },
      { path: "/image/image-options", label: "Image Options", ready: true },
    ],
  },
  {
    label: "Audio",
    routes: [
      { path: "/audio/transcribe", label: "Transcribe", ready: false },
      {
        path: "/audio/transcribe-options",
        label: "Transcribe Options",
        ready: false,
      },
      { path: "/audio/text-to-speech", label: "Text to Speech", ready: false },
      {
        path: "/audio/text-to-speech-options",
        label: "Speech Options",
        ready: false,
      },
    ],
  },
];
