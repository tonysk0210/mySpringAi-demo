import ChatBox from '../components/ChatBox'
export default function OpenaiChatInMemoryPage() {
  return <ChatBox title="OpenAI 記憶體對話" description="依 userName 在應用程式記憶體保存對話內容；後端重啟後記憶會消失。" endpoint="/openai/chat-inMemory" requiresUserName />
}
