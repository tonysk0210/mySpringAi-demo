import ChatBox from '../components/ChatBox'
export default function OpenaiChatJdbcPage() {
  return <ChatBox title="OpenAI JDBC 對話" description="依 userName 將對話記憶持久化至 H2 JDBC，後端重啟後仍可延續。" endpoint="/openai/chat-jdbc" requiresUserName />
}
