import ChatBox from '../components/ChatBox'
export default function DtoGenerateListJsonDtoPage() {
  return <ChatBox title="產生 JSON DTO 陣列" description="將模型回應解析為 CountryCitiesDto 陣列，檢視多筆國家與城市資料。" endpoint="/dto/generateListJsonDto" />
}
