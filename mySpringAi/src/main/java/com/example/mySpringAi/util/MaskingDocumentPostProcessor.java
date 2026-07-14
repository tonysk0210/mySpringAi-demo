package com.example.mySpringAi.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.rag.Query;
import org.springframework.ai.rag.postretrieval.document.DocumentPostProcessor;
import org.springframework.util.Assert;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.regex.Pattern;

/**
 * DocumentPostProcessor 實作：遮罩檢索到的 Document 內文中的 email / phone 等 PII。
 * 用於 preAndPostRetrievalAugmentationAdvisor 的 post-retrieval 階段，避免敏感資訊隨 context 送給 LLM。
 * <p>
 * 透過 getInstance() 建立實例（無共享狀態、執行緒安全）。
 */
@Slf4j
public class MaskingDocumentPostProcessor implements DocumentPostProcessor {

    // 允許無 TLD 的內部帳號格式，例如 tutor@eazybytes
    private static final Pattern EMAIL_PATTERN = Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+(?:\\.[A-Za-z]{2,})?\\b", Pattern.CASE_INSENSITIVE);
    // 支援 123-456-7890、(123) 456-7890、+1 123-456-7890 等常見格式
    private static final Pattern PHONE_PATTERN = Pattern.compile("\\b(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b", Pattern.CASE_INSENSITIVE);

    private static final String EMAIL_REPLACEMENT = "[機敏資訊遮罩_EMAIL]";
    private static final String PHONE_REPLACEMENT = "[機敏資訊遮罩_PHONE]";

    private MaskingDocumentPostProcessor() {
    }

    /**
     * process() 是 RetrievalAugmentationAdvisor 在 post-retrieval 階段自動呼叫你的實作，並把「當前 Query 物件」和「上一步 documentRetriever 檢索到的 List」當參數傳進來。你只需要在
     * RaAdvisorConfig 用 .documentPostProcessors(MaskingDocumentPostProcessor.getInstance()) 登記，之後就是框架的責任了
     */
    @Override
    public List<Document> process(Query query, List<Document> documents) {
        // 前置檢查
        Assert.notNull(query, "query 不可為 null");
        Assert.notNull(documents, "documents 不可為 null");
        if (CollectionUtils.isEmpty(documents)) {
            return documents;
        }
        Assert.noNullElements(documents, "documents 不可包含 null 元素");

        log.info("針對 {} 筆 documents 執行機敏資訊遮罩", documents.size());

        // 用 mutate() 建新 Document 而非原地修改，保留原 metadata 並額外標記 pii_masked=true
        return documents.stream().map(document -> {
            String text = document.getText() != null ? document.getText() : "";
            String maskedText = maskSensitiveInformation(text);
            return document.mutate()
                    .text(maskedText)
                    .metadata("pii_masked", true)
                    .build();
        }).toList();
    }

    private String maskSensitiveInformation(String text) {
        // 先遮 email 再遮 phone：email 內可能含類似電話樣式的數字，先處理避免誤傷
        String masked = EMAIL_PATTERN.matcher(text).replaceAll(EMAIL_REPLACEMENT);
        return PHONE_PATTERN.matcher(masked).replaceAll(PHONE_REPLACEMENT);
    }

    public static MaskingDocumentPostProcessor getInstance() {
        return new MaskingDocumentPostProcessor();
    }
}
