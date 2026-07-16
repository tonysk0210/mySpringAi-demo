package com.example.mySpringAi.util.component.rag;

import io.qdrant.client.QdrantClient;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TextSplitter;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class RagDataLoader {

    private final VectorStore ragVectorStore;
    private final VectorStore pdfVectorStore;
    private final QdrantClient qdrantClient;

    @Value("classpath:/ApexTech_Solutions_HR_Policy_Manual.pdf")
    Resource pdfFile;

    @Autowired
    public RagDataLoader(@Qualifier("vectorStore") VectorStore ragVectorStore, // spring-ai 自動建立的 vectorStore
                         @Qualifier("pdfVectorStore") VectorStore pdfVectorStore,
                         QdrantClient qdrantClient) {
        this.ragVectorStore = ragVectorStore;
        this.pdfVectorStore = pdfVectorStore;
        this.qdrantClient = qdrantClient;
    }

    /**
     * 載入「手寫句子資料」到預設 rag-collection。
     */
    @PostConstruct
    public void loadSentenceIntoVectorStore() {
        if (hasData("rag-collection")) {
            log.info("rag-collection 已有資料，跳過載入");
            return;
        }

        // 虛構公司「星辰科技」的內部知識庫 —— 專門用於 RAG demo。
        // 這些內容 LLM 完全不會知道，能有效驗證 RAG 是否真正生效。
        List<String> sentences = List.of(
                // 公司基本資訊
                "星辰科技（Starcloud Tech）成立於 2018 年 3 月，總部位於新竹科學園區。",
                "星辰科技的創辦人兼 CEO 是張明華，畢業於清華大學資工系。",
                "星辰科技的 CTO 是林俊傑，曾任職於 Google 台灣研發中心。",
                "星辰科技目前員工人數約 320 人，其中研發部門佔 60%。",
                "星辰科技的營運據點包含新竹總部、台北辦公室、以及東京海外分公司。",
                "星辰科技於 2023 年在台灣證交所掛牌上市，股票代號為 8888。",
                "星辰科技的公司願景是「用 AI 讓每個企業都能加速成長」。",

                // 旗艦產品 Nova AI
                "星辰科技的旗艦產品 Nova AI 是一款企業級 AI 助理平台，於 2024 年 6 月正式推出。",
                "Nova AI 支援中英日三種語言介面，並針對繁體中文做特別優化。",
                "Nova AI 提供文件摘要、資料檢索、程式碼生成、翻譯等四大核心功能。",
                "Nova AI 使用自研的 StarLLM 模型，並可搭配 OpenAI 與 Anthropic 的模型。",
                "Nova AI 的資料儲存全部位於台灣，符合個資法規範。",
                "Nova AI 每月處理超過 5000 萬次 API 請求。",

                // 訂閱方案與計價
                "Nova AI 提供三種訂閱方案：Basic、Pro、Enterprise。",
                "Nova AI Basic 方案月費為 NT$299，包含每月 500 次查詢額度。",
                "Nova AI Pro 方案月費為 NT$999，包含每月 5000 次查詢與 API 存取權限。",
                "Nova AI Enterprise 方案採用客製報價，起價為每月 NT$30000。",
                "Enterprise 方案包含專屬客戶經理、SLA 99.9% 保證、以及地端部署選項。",
                "所有方案的年繳用戶皆可享有 15% 折扣。",
                "新客戶註冊 Nova AI 可獲得 14 天 Pro 方案免費試用。",

                // HR 與員工政策
                "星辰科技員工每年享有 14 天特休假，年資滿三年後增加至 20 天。",
                "星辰科技的遠端工作政策為「每週最多 3 天在家上班」，需事先與主管報備。",
                "星辰科技提供彈性上下班時間，核心工作時段為上午 10 點至下午 4 點。",
                "星辰科技每年 6 月與 12 月各發放一次績效獎金，最高可達 6 個月月薪。",
                "星辰科技提供每位員工每年 NT$20000 的教育訓練補助。",
                "星辰科技新進員工需完成為期兩週的訓練課程 (Onboarding Bootcamp)。",
                "星辰科技的員工餐廳位於總部一樓，早午餐由公司補助。",

                // 內部溝通與工具
                "星辰科技內部主要溝通工具為 Slack，禁止使用 LINE 群組討論公事。",
                "星辰科技的專案管理採用 Jira，所有工單皆需連結至對應的 Confluence 文件。",
                "星辰科技的原始碼版控使用 GitHub Enterprise，禁止上傳至公開 repo。",
                "星辰科技的 CI/CD 平台為 GitLab CI，每次 merge 需通過至少一位資深工程師 review。",
                "星辰科技的視訊會議統一使用 Google Meet，禁用 Zoom 以避免資安疑慮。",
                "星辰科技的文件協作平台為 Notion，重要決策需留下 Decision Log。",

                // 技術棧
                "Nova AI 後端主要以 Java 21 搭配 Spring Boot 3 開發，微服務化架構。",
                "Nova AI 前端使用 Next.js 14 搭配 TypeScript，UI 元件庫採用自研的 StarUI。",
                "Nova AI 的向量資料庫使用 Qdrant，主要儲存企業內部文件的 embedding。",
                "Nova AI 的關聯式資料庫使用 PostgreSQL 16，快取層使用 Redis 7。",
                "Nova AI 的訊息佇列使用 Apache Kafka，用於處理非同步任務。",
                "Nova AI 的部署環境為 AWS，主要區域為 ap-northeast-1 (東京)。",

                // 資安與合規
                "星辰科技通過 ISO 27001 與 SOC 2 Type II 資安認證。",
                "星辰科技禁止員工將客戶資料上傳至任何未經核准的 SaaS 服務。",
                "星辰科技每季執行一次全公司的滲透測試 (Penetration Test)。",
                "所有員工每年必須完成資安訓練，未完成者將暫停系統存取權限。",
                "星辰科技的資料備份採用 3-2-1 原則：3 份副本、2 種媒介、1 份異地。",

                // 客戶案例
                "台灣大型金融業客戶「玉山銀行」為 Nova AI Enterprise 方案的旗艦客戶。",
                "日本電商龍頭「樂天」使用 Nova AI 處理客服工單分類，減少 40% 處理時間。",
                "新加坡航空使用 Nova AI 生成多語系旅客通知信件。",
                "統一超商使用 Nova AI 分析門市補貨建議，庫存周轉率提升 25%。",

                // 客戶服務
                "Nova AI 客服支援時間為週一至週五上午 9 點至下午 6 點 (GMT+8)。",
                "Nova AI 的技術支援可透過官方網站的 chatbot、Email (support@starcloud.tech) 或電話聯絡。",
                "Nova AI Enterprise 客戶享有 24/7 專屬客服熱線。",
                "Nova AI 的服務等級協議 (SLA) 保證每月可用時間至少 99.9%。",

                // 其他
                "星辰科技每年 10 月舉辦「Starcloud DevDay」開發者大會，開放外部報名。",
                "星辰科技的技術部落格網址為 blog.starcloud.tech，每週固定發表兩篇文章。",
                "星辰科技的公司吉祥物是一隻名叫「Nova」的藍色貓咪。",
                "星辰科技的辦公室禁止吸菸，但戶外設有專屬吸菸區。",
                "星辰科技提供員工免費健身房會員（合作對象為 World Gym）。"
        );

        // 1. 把句子轉成 Document
        List<Document> documents = sentences.stream().map(Document::new).toList();

        // 2. 把 Document 送進 ragVectorStore，完成建立 rag-collection
        ragVectorStore.add(documents);
        log.info("rag-collection 載入完成，共 {} 筆 Documents.", documents.size());
    }

    /**
     * 載入「PDF 檔案資料」到自定義 pdf-collection。
     */
    @PostConstruct
    public void loadPdfIntoVectorStore() {
        if (hasData("pdf-collection")) {
            log.info("pdf-collection 已有資料，跳過載入");
            return;
        }

        // 1. 建立一個 Apache Tika TikaDocumentReader 讀取 pdfFile，並嘗試從 PDF 中抽出文字內容
        TikaDocumentReader reader = new TikaDocumentReader(pdfFile);

        // 2. 真正讀取 PDF，並把結果轉成 Spring AI 的 Document 清單
        List<Document> documents = reader.get();
        log.info("PDF 讀取完成，共 {} 份文件", documents.size());

        // 3. 使用 TokenTextSplitter，用 token 數量來切文件：每個 chunk 目標大小約為 250 tokens，最多切 400 個 chunk
        TextSplitter splitter = TokenTextSplitter.builder().withChunkSize(250).withMaxNumChunks(400).build();

        // 4. 把切好的 Document 清單送進 pdfVectorStore，完成建立 pdf-collection
        List<Document> splitDocuments = splitter.split(documents);

        // 5. 把切好的 Document 清單送進 pdfVectorStore，完成建立 pdf-collection
        pdfVectorStore.add(splitDocuments);
        log.info("pdf-collection 載入完成，共 {} 筆 Documents.", splitDocuments.size());
    }

    // 判斷某個 Qdrant collection 裡面是否已經有資料，避免每次 Spring Boot 啟動都重複把資料塞進向量資料庫
    private boolean hasData(String collectionName) {
        try {
            long count = qdrantClient.getCollectionInfoAsync(collectionName).get().getPointsCount();
            return count > 0;
        } catch (Exception e) {
            log.warn("無法查詢 {} 的資料量，視為空集合重新載入", collectionName);
            return false;
        }
    }
}
