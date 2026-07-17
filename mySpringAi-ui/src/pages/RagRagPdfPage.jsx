import ChatBox from '../components/ChatBox'
export default function RagRagPdfPage() {
  return <ChatBox title="PDF Retrieval Advisor" description="透過 RetrievalAugmentationAdvisor 檢索 PDF 向量資料並增強使用者問題。" endpoint="/rag/ragPdf" />
}
