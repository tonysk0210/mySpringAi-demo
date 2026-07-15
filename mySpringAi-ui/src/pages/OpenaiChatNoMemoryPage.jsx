import ChatBox from '../components/ChatBox'
export default function OpenaiChatNoMemoryPage() {
  return <ChatBox title="OpenAI No-memory Chat" description="測試 OpenAI 無記憶對話：每次請求都是全新的 context。" endpoint="/openai/chat-noMemory" />
}
