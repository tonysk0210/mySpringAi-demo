import ChatBox from '../components/ChatBox'
export default function CacheQdrantCachingChatPage() {
  return <ChatBox title="Qdrant 語意快取" description="使用 Qdrant 向量庫保存 Semantic Cache；語意相近問題命中時會跳過 LLM。" endpoint="/cache/qdrantCaching-chat" />
}
