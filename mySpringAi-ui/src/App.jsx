import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import OpenaiChatNoMemoryPage from "./pages/OpenaiChatNoMemoryPage";
import OpenaiChatInMemoryPage from "./pages/OpenaiChatInMemoryPage";
import OpenaiChatJdbcPage from "./pages/OpenaiChatJdbcPage";
import OllamaChatJdbcPage from "./pages/OllamaChatJdbcPage";
import RagRagPage from "./pages/RagRagPage";
import RagRagPdfPage from "./pages/RagRagPdfPage";
import RagRagTavilyPage from "./pages/RagRagTavilyPage";
import RagPreAndPostRAAdvisorPage from "./pages/RagPreAndPostRAAdvisorPage";
import CacheRedisCachingChatPage from "./pages/CacheRedisCachingChatPage";
import CacheQdrantCachingChatPage from "./pages/CacheQdrantCachingChatPage";
import DtoGenerateJsonDtoPage from "./pages/DtoGenerateJsonDtoPage";
import DtoGenerateListJsonDtoPage from "./pages/DtoGenerateListJsonDtoPage";
import DtoGenerateListPage from "./pages/DtoGenerateListPage";
import DtoGenerateMapPage from "./pages/DtoGenerateMapPage";
import ToolTimePage from "./pages/ToolTimePage";
import ToolHelpDeskTicketPage from "./pages/ToolHelpDeskTicketPage";
import EmailEmailResponsePage from "./pages/EmailEmailResponsePage";
import ImageImagePage from "./pages/ImageImagePage";
import ImageImageOptionsPage from "./pages/ImageImageOptionsPage";
import AudioTranscribePage from "./pages/AudioTranscribePage";
import AudioTranscribeOptionsPage from "./pages/AudioTranscribeOptionsPage";
import AudioTextToSpeechPage from "./pages/AudioTextToSpeechPage";
import AudioTextToSpeechOptionsPage from "./pages/AudioTextToSpeechOptionsPage";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route
            index
            element={<Navigate to="/openai/chat-noMemory" replace />}
          />
          <Route
            path="/openai/chat-noMemory"
            element={<OpenaiChatNoMemoryPage />}
          />
          <Route
            path="/openai/chat-inMemory"
            element={<OpenaiChatInMemoryPage />}
          />
          <Route path="/openai/chat-jdbc" element={<OpenaiChatJdbcPage />} />
          <Route path="/ollama/chat-jdbc" element={<OllamaChatJdbcPage />} />
          <Route path="/rag/rag" element={<RagRagPage />} />
          <Route path="/rag/ragPdf" element={<RagRagPdfPage />} />
          <Route path="/rag/ragTavily" element={<RagRagTavilyPage />} />
          <Route
            path="/rag/preAndPostRAAdvisor"
            element={<RagPreAndPostRAAdvisorPage />}
          />
          <Route
            path="/cache/redisCaching-chat"
            element={<CacheRedisCachingChatPage />}
          />
          <Route
            path="/cache/qdrantCaching-chat"
            element={<CacheQdrantCachingChatPage />}
          />
          <Route
            path="/dto/generateJsonDto"
            element={<DtoGenerateJsonDtoPage />}
          />
          <Route
            path="/dto/generateListJsonDto"
            element={<DtoGenerateListJsonDtoPage />}
          />
          <Route path="/dto/generateList" element={<DtoGenerateListPage />} />
          <Route path="/dto/generateMap" element={<DtoGenerateMapPage />} />
          <Route path="/tool/time" element={<ToolTimePage />} />
          <Route
            path="/tool/helpDeskTicket"
            element={<ToolHelpDeskTicketPage />}
          />
          <Route
            path="/email/emailResponse"
            element={<EmailEmailResponsePage />}
          />
          <Route path="/image/image" element={<ImageImagePage />} />
          <Route
            path="/image/image-options"
            element={<ImageImageOptionsPage />}
          />
          <Route path="/audio/transcribe" element={<AudioTranscribePage />} />
          <Route
            path="/audio/transcribe-options"
            element={<AudioTranscribeOptionsPage />}
          />
          <Route
            path="/audio/text-to-speech"
            element={<AudioTextToSpeechPage />}
          />
          <Route
            path="/audio/text-to-speech-options"
            element={<AudioTextToSpeechOptionsPage />}
          />
          <Route
            path="*"
            element={
              <div className="not-found">
                <strong>404</strong>
                <h1>Page not found</h1>
                <a href="/">Back to playground</a>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
