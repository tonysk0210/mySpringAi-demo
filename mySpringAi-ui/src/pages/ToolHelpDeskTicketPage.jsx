import ChatBox from '../components/ChatBox'
export default function ToolHelpDeskTicketPage() {
  return <ChatBox title="Help Desk Ticket Tool" description="Create a help desk ticket or query an existing ticket through tool calling." endpoint="/tool/helpDeskTicket" requiresUserName />
}
