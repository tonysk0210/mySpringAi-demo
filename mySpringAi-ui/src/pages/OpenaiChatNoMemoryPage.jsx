import ChatBox from '../components/ChatBox'
export default function OpenaiChatNoMemoryPage() {
  return <ChatBox title="OpenAI 無記憶對話" description="每次請求皆為獨立對話，不保存或帶入先前訊息。" endpoint="/openai/chat-noMemory" />
}
