import ChatBox from '../components/ChatBox'
export default function DtoGenerateMapPage() {
  return <ChatBox title="產生 Key-Value Map" description="將模型回應解析為結構化的 key-value Map。" endpoint="/dto/generateMap" />
}
