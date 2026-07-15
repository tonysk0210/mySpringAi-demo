import ChatBox from '../components/ChatBox'
export default function OpenaiChatJdbcPage() {
  return <ChatBox title="OpenAI JDBC Chat" description="Test OpenAI chat with persistent JDBC conversation memory." endpoint="/openai/chat-jdbc" requiresUserName />
}
