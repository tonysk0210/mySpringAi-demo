import ChatBox from '../components/ChatBox'
export default function OpenaiChatInMemoryPage() {
  return <ChatBox title="OpenAI In-memory Chat" description="Test OpenAI chat with in-memory conversation history." endpoint="/openai/chat-inMemory" requiresUserName />
}
