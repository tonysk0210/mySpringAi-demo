import ChatBox from '../components/ChatBox'
export default function CacheRedisCachingChatPage() {
  return <ChatBox title="Redis 語意快取" description="使用 Redis 保存 Semantic Cache；語意相近問題命中快取時會跳過 LLM。" endpoint="/cache/redisCaching-chat" />
}
