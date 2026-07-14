package com.example.mySpringAi.config;

import com.example.mySpringAi.util.MaskingDocumentPostProcessor;
import com.example.mySpringAi.util.component.rag.TavilyWebSearchDocumentRetriever;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.rag.Query;
import org.springframework.ai.rag.advisor.RetrievalAugmentationAdvisor;
import org.springframework.ai.rag.generation.augmentation.ContextualQueryAugmenter;
import org.springframework.ai.rag.preretrieval.query.transformation.QueryTransformer;
import org.springframework.ai.rag.preretrieval.query.transformation.TranslationQueryTransformer;
import org.springframework.ai.rag.retrieval.search.VectorStoreDocumentRetriever;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.Resource;

/**
 * RAG 相關的 Spring Bean 設定。
 * RetrievalAugmentationAdvisor 負責 RAG 中的 Retrieval + Augmentation：
 * 先檢索相關 Document，再把 Document 內容補進 prompt；最後的 Generation 由 ChatClient/LLM 完成。
 * <p>
 * Retrieval：
 * 根據使用者問題去找相關 Document
 * <p>
 * Augmentation：
 * 把找到的 Document 內容補進 prompt/context
 * <p>
 * Generation：
 * 不是它本身做，而是後面的 ChatClient / LLM 做
 */
@Slf4j
@Configuration
public class RAAdvisorConfig {

    /**
     * PDF RAG advisor（給 /api/openai/ragPdf 用）：檢索 pdf-collection → 套進 RagPdfPromptTemplate.st → 改寫 user message → 送 LLM。
     * Template placeholder 必須是 {context} + {query}（Spring AI 硬性規定；對比手動 RAG /api/openai/rag 的 {documents}）。
     */
    @Primary
    @Bean("pdf-RA-Advisor")
    public RetrievalAugmentationAdvisor pdfRetrievalAugmentationAdvisor(@Qualifier("pdfVectorStore") VectorStore pdfVectorStore,
                                                                        @Value("classpath:/promptTemplate/RagPdfPromptTemplate.st") Resource ragPdfPromptTemplate) {
        return RetrievalAugmentationAdvisor.builder()
                // 1. 設定文件檢索器；收到使用者問題後，advisor 會透過它去找相關 Document。
                .documentRetriever(
                        // 1.1 用 pdfVectorStore 建立 retriever，實際對 Qdrant 的 pdf-collection 做 similarity search。
                        VectorStoreDocumentRetriever.builder()
                                .vectorStore(pdfVectorStore)
                                .topK(3)                                // 最多回傳 3 筆最相似的 chunk
                                .similarityThreshold(0.5)    // 過濾 similarity < 0.5 的雜訊
                                .build())
                // 2. 設定 query augmenter；將檢索到的 Document 內容與使用者問題套進 prompt template - RagPdfPromptTemplate.st
                .queryAugmenter(
                        // 2.1 將 Document 內容填入 {context}，將使用者問題填入 {query}。
                        ContextualQueryAugmenter.builder()
                                .promptTemplate(new PromptTemplate(ragPdfPromptTemplate))
                                .build())
                // 3. 設定 advisor 執行順序；-10 早於 PrettyLoggerAdvisor(order=-1)，讓 logger 顯示 RAG 增強後的 UserMessage。
                .order(-10)
                .build();
    }

    /**
     * 建立給 /api/openai/ragTavily 使用的 Tavily RAG advisor。
     * 這個 advisor 使用自定義的 TavilyWebSearchDocumentRetriever，
     * 將使用者問題送到 Tavily Web Search API，並把搜尋結果轉成 Spring AI Document。
     */
    @Bean("tavily-RA-Advisor")
    public RetrievalAugmentationAdvisor tavilyRetrievalAugmentationAdvisor(TavilyWebSearchDocumentRetriever tavilyWebSearchDocumentRetriever) {
        return RetrievalAugmentationAdvisor.builder()
                // 1. 設定 Tavily 文件檢索器；advisor 收到使用者問題後，會透過它呼叫 Tavily 搜尋並取得相關 Document。
                .documentRetriever(tavilyWebSearchDocumentRetriever).build();
    }

    /**
     * 完整 pipeline RAG advisor（給 /api/openai/preAndPostRAAdvisor 用）：Pre-retrieval query 翻譯 → 檢索 → Post-retrieval PII 遮罩 → 增強 → 生成。
     * 對比 pdfRetrievalAugmentationAdvisor：本 advisor 多加 pre-retrieval 翻譯與 post-retrieval PII 遮罩；pdfRAAdvisor 只做基本檢索與增強。
     */
    @Bean("preAndPost-RA-Advisor")
    public RetrievalAugmentationAdvisor preAndPostRetrievalAugmentationAdvisor(@Qualifier("pdfVectorStore") VectorStore vectorStore,
                                                                               @Qualifier("openaiBuilder") ChatClient.Builder chatClientBuilder,
                                                                               @Value("classpath:/promptTemplate/RagPdfPromptTemplate.st") Resource ragPdfPromptTemplate) {
        // chatClientBuilder 是 prototype scope（見 ChatClientBuilderConfig），每次注入都是新實例，直接使用不需要 clone
        // 1. 建立翻譯器；將使用者問題翻譯成英文，因為 pdf-collection 是英文文件，同語言 embedding 命中率較高。
        QueryTransformer translationTransformer = TranslationQueryTransformer.builder()
                .chatClientBuilder(chatClientBuilder)
                .targetLanguage("english")
                .build();

        // 2. 包裝 translationTransformer，額外記錄翻譯前後的 query，方便 debug retrieval 使用的實際查詢文字。
        QueryTransformer loggingTranslatedTransformer = query -> {
            Query transformedQuery = translationTransformer.transform(query);
            log.info("QueryTransformer 翻譯前 query = {}", query.text());
            log.info("QueryTransformer 翻譯後 query = {}", transformedQuery.text());
            return transformedQuery;
        };

        return RetrievalAugmentationAdvisor.builder()
                // 3.1 Pre-retrieval：query 翻譯成英文（因為 pdf-collection 是英文文件，同語言 embedding 命中率較高）
                .queryTransformers(loggingTranslatedTransformer)
                .documentRetriever(
                        VectorStoreDocumentRetriever.builder()
                                .vectorStore(vectorStore)
                                .topK(3)
                                .similarityThreshold(0.5)
                                .build())
                // 3.2 Post-retrieval：遮罩 email / phone 等 PII，避免敏感資訊送給 LLM
                .documentPostProcessors(MaskingDocumentPostProcessor.getInstance())
                .queryAugmenter(
                        ContextualQueryAugmenter.builder()
                                .promptTemplate(new PromptTemplate(ragPdfPromptTemplate))
                                .build())
                .order(-10)
                .build();
    }
}
