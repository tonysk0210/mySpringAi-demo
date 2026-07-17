import ChatBox from '../components/ChatBox'
export default function OllamaChatJdbcPage() {
  return <ChatBox title="Ollama JDBC 對話" description="使用本機 llama3.2:1b，並以 H2 JDBC 依 userName 保存對話記憶。" endpoint="/ollama/chat-jdbc" requiresUserName />
}
