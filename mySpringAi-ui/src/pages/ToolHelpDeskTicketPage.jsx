import ChatBox from '../components/ChatBox'
export default function ToolHelpDeskTicketPage() {
  return <ChatBox title="客服工單 Tool Calling" description="讓模型查詢或建立客服工單，並依 userName 管理工單與 JDBC 對話記憶。" endpoint="/tool/helpDeskTicket" requiresUserName />
}
