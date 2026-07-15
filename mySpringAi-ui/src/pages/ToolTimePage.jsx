import ChatBox from '../components/ChatBox'
export default function ToolTimePage() {
  return <ChatBox title="Time Tool" description="Ask a time-related question and test model tool calling." endpoint="/tool/time" requiresUserName />
}
