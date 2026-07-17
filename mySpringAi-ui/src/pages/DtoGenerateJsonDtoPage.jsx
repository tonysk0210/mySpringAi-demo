import ChatBox from "../components/ChatBox";
export default function DtoGenerateJsonDtoPage() {
  return (
    <ChatBox
      title="產生單一 JSON DTO"
      description="將模型回應解析為一個 CountryCitiesDto，包含國家與城市陣列。"
      endpoint="/dto/generateJsonDto"
    />
  );
}
