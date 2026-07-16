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
        label: "OpenAI · No Memory",
        model: "gpt-4.1-nano",
      },
      {
        path: "/openai/chat-inMemory",
        label: "OpenAI · In-memory",
        model: "gpt-4.1-nano",
        requiresUserName: true,
      },
      {
        path: "/openai/chat-jdbc",
        label: "OpenAI · JDBC",
        model: "gpt-4.1-nano",
        requiresUserName: true,
      },
      {
        path: "/ollama/chat-jdbc",
        label: "Ollama · JDBC",
        model: "llama3.2:1b",
        requiresUserName: true,
      },
    ],
  },
  {
    label: "RAG",
    routes: [
      { path: "/rag/rag", label: "Manual RAG", model: "gpt-4.1-nano" },
      { path: "/rag/ragPdf", label: "PDF Advisor", model: "gpt-4.1-nano" },
      {
        path: "/rag/preAndPostRAAdvisor",
        label: "Pre/Post Advisor",
        model: "gpt-4.1-nano",
      },
      { path: "/rag/ragTavily", label: "Tavily Search", model: "gpt-4.1-nano" },
    ],
  },
  {
    label: "Semantic Cache",
    routes: [
      { path: "/cache/redisCaching-chat", label: "Redis Cache", model: "gpt-4.1-nano" },
      { path: "/cache/qdrantCaching-chat", label: "Qdrant Cache", model: "gpt-4.1-nano" },
    ],
  },
  {
    label: "Structured Output",
    routes: [
      { path: "/dto/generateJsonDto", label: "JSON DTO", model: "gpt-4.1-nano" },
      { path: "/dto/generateListJsonDto", label: "DTO List", model: "gpt-4.1-nano" },
      { path: "/dto/generateList", label: "String List", model: "gpt-4.1-nano" },
      { path: "/dto/generateMap", label: "Map", model: "gpt-4.1-nano" },
    ],
  },
  {
    label: "Tools",
    routes: [
      {
        path: "/tool/time",
        label: "Time Tool · JDBC",
        model: "gpt-4.1-nano",
        requiresUserName: true,
      },
      {
        path: "/tool/helpDeskTicket",
        label: "Help Desk · JDBC",
        model: "gpt-4.1-nano",
        requiresUserName: true,
      },
    ],
  },
  {
    label: "Email",
    routes: [
      { path: "/email/emailResponse", label: "Email Response", model: "gpt-4.1-nano" },
    ],
  },
  {
    label: "Image",
    routes: [
      { path: "/image/image", label: "Generate Image", model: "gpt-image-1-mini" },
      { path: "/image/image-options", label: "Image Options", model: "gpt-image-1" },
    ],
  },
  {
    label: "Audio",
    routes: [
      { path: "/audio/transcribe", label: "Transcribe", model: "whisper-1" },
      {
        path: "/audio/transcribe-options",
        label: "Transcribe Options",
        model: "whisper-1",
      },
      { path: "/audio/text-to-speech", label: "Text to Speech", model: "gpt-4o-mini-tts" },
      {
        path: "/audio/text-to-speech-options",
        label: "Speech Options",
        model: "gpt-4o-mini-tts",
      },
    ],
  },
];
