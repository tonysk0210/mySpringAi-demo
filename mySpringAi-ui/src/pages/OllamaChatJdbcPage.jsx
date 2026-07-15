import ChatBox from '../components/ChatBox'
export default function OllamaChatJdbcPage() {
  return <ChatBox title="Ollama JDBC Chat" description="Test a local Ollama model with JDBC conversation memory." endpoint="/ollama/chat-jdbc" requiresUserName />
}
