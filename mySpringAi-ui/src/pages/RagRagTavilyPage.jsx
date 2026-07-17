import ChatBox from '../components/ChatBox'
export default function RagRagTavilyPage() {
  return <ChatBox title="Tavily 即時網路搜尋 RAG" description="透過 Tavily 搜尋即時網路內容，將結果加入 Context 後交由模型回答。" endpoint="/rag/ragTavily" />
}
