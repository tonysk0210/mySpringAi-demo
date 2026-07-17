import ChatBox from '../components/ChatBox'
export default function RagPreAndPostRAAdvisorPage() {
  return <ChatBox title="完整 Pre/Post RAG Pipeline" description="依序執行問題翻譯、向量檢索、PII 遮罩與 Context 增強的完整 RAG 流程。" endpoint="/rag/preAndPostRAAdvisor" />
}
