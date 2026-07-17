import ChatBox from '../components/ChatBox'
export default function DtoGenerateListPage() {
  return <ChatBox title="產生字串陣列" description="將模型回應解析為結構化的 List<String> 字串陣列。" endpoint="/dto/generateList" />
}
