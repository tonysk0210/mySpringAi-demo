package com.example.mySpringAi.util.component.rag;

import com.example.mySpringAi.dto.TavilyResponseDto;
import com.example.mySpringAi.payload.TavilyRequestPayload;
import com.google.common.net.HttpHeaders;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.rag.Query;
import org.springframework.ai.rag.retrieval.search.DocumentRetriever;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;
import org.springframework.util.CollectionUtils;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * 自定義 DocumentRetriever：query → 打 Tavily Web Search API → 轉成 List<Document>。
 * 相對於 VectorStoreDocumentRetriever（查本地向量庫），本 retriever 走網路即時搜尋。
 */
@Slf4j
@Component
public class TavilyWebSearchDocumentRetriever implements DocumentRetriever {

    private static final String TAVILY_BASE_URL = "https://api.tavily.com/search";
    private final int resultLimit = 5;
    private final RestClient restClient;

    public TavilyWebSearchDocumentRetriever(RestClient.Builder restClientBuilder,
                                            @Value("${tavily.apiKey:}") String apiKey) {
        // 前置檢查
        Assert.notNull(restClientBuilder, "restClientBuilder 不可為 null");
        Assert.hasText(apiKey, "tavily.apiKey 設定不可為空");

        // 預設帶上 Authorization header，後續 restClient.post() 就自動使用
        this.restClient = restClientBuilder
                .baseUrl(TAVILY_BASE_URL)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }

    /**
     * 你只要在 RetrievalAugmentationAdvisor.builder().documentRetriever(tavilyRetriever) 註冊進去，advisor 就會在 before() 階段自動幫你呼叫 retrieve(query)——這是策略模式 +
     * 控制反轉的典型應用：你實作介面，框架呼叫你（Don't call us, we'll call you）。除非你完全不用 advisor、走手動 RAG，才需要自己 tavilyRetriever.retrieve(...)。
     */
    @Override
    public List<Document> retrieve(Query query) {
        Assert.notNull(query, "query 不可為 null");
        String q = query.text();
        Assert.hasText(q, "query 不可為空");
        log.info("TavilyWebSearchDocumentRetriever: user 下的 query = {}", q);

        // 1. 呼叫 Tavily Web Search API: search_depth=advanced 走深度搜尋（較慢但相關性較高）
        TavilyResponseDto responseDto = restClient.post()
                .body(new TavilyRequestPayload(q, "advanced", resultLimit))
                .retrieve()
                .body(TavilyResponseDto.class);

        if (responseDto == null || CollectionUtils.isEmpty(responseDto.results())) {
            return List.of();
        }

        // 2. 將 Tavily API 回傳的結果轉成 List<Document>
        List<Document> docs = new ArrayList<>(responseDto.results().size());
        for (TavilyResponseDto.Hit hit : responseDto.results()) {
            docs.add(Document.builder()
                    .text(hit.content())       // 給 LLM 看的搜尋內容（Document 唯一必填欄位）
                    .metadata("title", hit.title()) // 來源標題（追來源用）
                    .metadata("url", hit.url())     // 來源網址（追來源用）
                    .score(hit.score())             // Tavily 計算的相關性分數
                    .build());
        }
        return docs;
    }
}
