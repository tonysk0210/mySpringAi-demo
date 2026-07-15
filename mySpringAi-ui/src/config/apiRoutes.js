export const apiGroups = [
  {
    label: 'Chat',
    routes: [
      { path: '/openai/chat-inMemory', label: 'OpenAI · In-memory', ready: true, requiresUserName: true },
      { path: '/openai/chat-jdbc', label: 'OpenAI · JDBC', ready: true, requiresUserName: true },
      { path: '/ollama/chat-jdbc', label: 'Ollama · JDBC', ready: true, requiresUserName: true },
    ],
  },
  {
    label: 'RAG',
    routes: [
      { path: '/rag/rag', label: 'Manual RAG', ready: true },
      { path: '/rag/ragPdf', label: 'PDF Advisor', ready: true },
      { path: '/rag/ragTavily', label: 'Tavily Search', ready: true },
      { path: '/rag/preAndPostRAAdvisor', label: 'Pre/Post Advisor', ready: true },
    ],
  },
  {
    label: 'Semantic Cache',
    routes: [
      { path: '/cache/redisCaching-chat', label: 'Redis Cache', ready: true },
      { path: '/cache/qdrantCaching-chat', label: 'Qdrant Cache', ready: true },
    ],
  },
  {
    label: 'Structured Output',
    routes: [
      { path: '/dto/generateJsonDto', label: 'JSON DTO', ready: true },
      { path: '/dto/generateListJsonDto', label: 'DTO List', ready: true },
      { path: '/dto/generateList', label: 'String List', ready: true },
      { path: '/dto/generateMap', label: 'Map', ready: true },
    ],
  },
  {
    label: 'Tools',
    routes: [
      { path: '/tool/time', label: 'Time Tool', ready: true, requiresUserName: true },
      { path: '/tool/helpDeskTicket', label: 'Help Desk', ready: true, requiresUserName: true },
    ],
  },
  {
    label: 'Email',
    routes: [{ path: '/email/emailResponse', label: 'Email Response', ready: false }],
  },
  {
    label: 'Image',
    routes: [
      { path: '/image/image', label: 'Generate Image', ready: false },
      { path: '/image/image-options', label: 'Image Options', ready: false },
    ],
  },
  {
    label: 'Audio',
    routes: [
      { path: '/audio/transcribe', label: 'Transcribe', ready: false },
      { path: '/audio/transcribe-options', label: 'Transcribe Options', ready: false },
      { path: '/audio/text-to-speech', label: 'Text to Speech', ready: false },
      { path: '/audio/text-to-speech-options', label: 'Speech Options', ready: false },
    ],
  },
]
