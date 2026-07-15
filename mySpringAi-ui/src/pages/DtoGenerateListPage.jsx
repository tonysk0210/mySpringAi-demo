import ChatBox from '../components/ChatBox'
export default function DtoGenerateListPage() {
  return <ChatBox title="Generate String List" description="Convert a model response into a structured list of strings." endpoint="/dto/generateList" />
}
