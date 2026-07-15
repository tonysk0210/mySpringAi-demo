import ChatBox from '../components/ChatBox'
export default function DtoGenerateMapPage() {
  return <ChatBox title="Generate Map" description="Convert a model response into a structured key/value map." endpoint="/dto/generateMap" />
}
