import ChatBox from "../components/ChatBox";
export default function RagRagPage() {
  return (
    <ChatBox
      title="Manual RAG"
      description="Run a manual vector similarity search and augment the model prompt."
      endpoint="/rag/rag"
    />
  );
}
