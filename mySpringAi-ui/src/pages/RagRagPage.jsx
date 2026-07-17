import ChatBox from "../components/ChatBox";
export default function RagRagPage() {
  return (
    <ChatBox
      title="手動向量檢索 RAG"
      description="手動查詢 Qdrant 向量庫，將檢索文件組入 Prompt 後交由模型回答。"
      endpoint="/rag/rag"
    />
  );
}
