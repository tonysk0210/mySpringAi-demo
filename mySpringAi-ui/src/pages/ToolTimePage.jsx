import ChatBox from '../components/ChatBox'
export default function ToolTimePage() {
  return <ChatBox title="時間查詢 Tool Calling" description="讓模型呼叫 TimeTool 取得即時時間，並以 JDBC 保存對話記憶。" endpoint="/tool/time" requiresUserName />
}
