package com.example.mySpringAi.controller;

import com.example.mySpringAi.payload.MessageChatPayload;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.rag.advisor.RetrievalAugmentationAdvisor;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/rag")
public class RagController {

    private final ChatClient openaiCCNoMem;
    private final VectorStore ragVectorStore;
    private final VectorStore pdfVectorStore;
    private final RetrievalAugmentationAdvisor pdfRAAdvisor;
    private final RetrievalAugmentationAdvisor tavilyRAAdvisor;
    private final RetrievalAugmentationAdvisor preAndPostRAAdvisor;

    @Value("classpath:/promptTemplate/RagPromptTemplate.st")
    Resource ragPromptTemplate;

    @Autowired
    public RagController(@Qualifier("openaiCCNoMem") ChatClient openaiCCNoMem,
                         @Qualifier("vectorStore") VectorStore ragVectorStore,
                         @Qualifier("pdfVectorStore") VectorStore pdfVectorStore,
                         @Qualifier("pdf-RA-Advisor") RetrievalAugmentationAdvisor pdfRAAdvisor,
                         @Qualifier("tavily-RA-Advisor") RetrievalAugmentationAdvisor tavilyRAAdvisor,
                         @Qualifier("preAndPost-RA-Advisor") RetrievalAugmentationAdvisor preAndPostRAAdvisor) {
        this.openaiCCNoMem = openaiCCNoMem;
        this.ragVectorStore = ragVectorStore;
        this.pdfVectorStore = pdfVectorStore;
        this.pdfRAAdvisor = pdfRAAdvisor;
        this.tavilyRAAdvisor = tavilyRAAdvisor;
        this.preAndPostRAAdvisor = preAndPostRAAdvisor;
    }

    /**
     * 手動 RAG：呼叫 vectorStore.similaritySearch()，自行組 context 塞入 prompt。
     * 對比 /ragPdf：手動版適合理解底層流程；/ragPdf 交給 advisor 自動處理。
     */
    @PostMapping("/rag")
    public String rag(@RequestBody MessageChatPayload messageChatPayload) {

        // 1. 用 user 輸入去找相關文件，手動建立 SearchRequest 條件
        SearchRequest searchRequest = SearchRequest.builder()
                .query(messageChatPayload.message())
                .topK(5)                                 // 最多取前 5 筆最相似的 Document
                .similarityThreshold(.5)             // 搜尋的相似度門檻
                .build();

        // 2. 用建好的 SearchRequest 從 ragVectorStore 找相關文件
        List<Document> listOfSimilarDocuments = ragVectorStore.similaritySearch(searchRequest);

        // 3. 將相關文件的內容串成一串字，供模型當作 context 使用
        String similarContext = listOfSimilarDocuments.stream().map(Document::getText).collect(Collectors.joining(",\n")); // 將所有 Document 轉成 String

        // 4. 帶著相關文件內容呼叫大模型
        return openaiCCNoMem.prompt()
                .system(systemSpec ->
                        systemSpec.text(ragPromptTemplate)
                                .param("documents", similarContext)) // 讀取 RAG prompt template，並把向量搜尋取得的文件內容填入 {documents}，作為 system prompt 傳給模型，會覆寫 defaultSystem prompt
                .user(messageChatPayload.message()) // 將用戶的訊息加到 User Prompt
                .call().content();
    }

    /**
     * 自動 RAG（PDF）：一行 .advisors(retrievalAugmentationAdvisor) 完成檢索、增強、生成。
     * 對比 /rag：advisor 自動處理；/rag 需手動 similaritySearch + 組 prompt。
     */
    @PostMapping("/ragPdf")
    public String ragPdf(@RequestBody MessageChatPayload messageChatPayload) {
        return openaiCCNoMem.prompt()
                .advisors(pdfRAAdvisor) // 帶著 retrievalAugmentationAdvisor
                .user(messageChatPayload.message()) // RetrievalAugmentationAdvisor 只認 .user 的 user message 產出對應的 {query}
                .call().content();
    }

    /**
     * 網路搜尋 RAG：換掉 documentRetriever 為 TavilyWebSearchDocumentRetriever，改從網路即時搜尋資料。
     * 對比 /ragPdf：本 endpoint 用 Tavily 網路搜尋；/ragPdf 用本地 Qdrant 向量庫。
     */
    @PostMapping("/ragTavily")
    public String tavily(@RequestBody MessageChatPayload messageChatPayload) {
        return openaiCCNoMem.prompt()
                .advisors(tavilyRAAdvisor) // 帶著 tavilyRaAdvisor 自定義 retrievalAugmentationAdvisor
                .user(messageChatPayload.message())
                .call().content();
    }

    /**
     * 完整 pipeline RAG：Query 翻譯成英文（Pre-retrieval）→ 檢索 → 遮罩 email/phone（Post-retrieval）→ 增強 → 生成。
     * 對比 /ragPdf：本 endpoint 多加 pre-retrieval query 翻譯與 post-retrieval PII 遮罩；/ragPdf 只做基本檢索與增強。
     */
    @PostMapping("/preAndPostRAAdvisor")
    public String preRetrieval(@RequestBody MessageChatPayload messageChatPayload) {
        return openaiCCNoMem.prompt()
                .advisors(preAndPostRAAdvisor) // 帶著 preAndPostRAAdvisor
                .user(messageChatPayload.message())
                .call().content();
    }
}
