package com.example.mySpringAi.config;

import org.springframework.ai.chat.cache.semantic.SemanticCache;
import org.springframework.ai.chat.cache.semantic.SemanticCacheAdvisor;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.redis.cache.semantic.DefaultSemanticCache;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import redis.clients.jedis.RedisClient;

/**
 * 建立 Redis 與 Qdrant 兩套 Semantic Cache，並提供對應的 ChatClient Advisor。
 */
@Configuration
public class SemanticCacheAdvisorConfig {

    /**
     * 建立 Jedis Client，使用 spring.data.redis.* 設定連線至 Redis Server。
     */
    @Bean
    RedisClient redisClient(
            @Value("${spring.data.redis.host:localhost}") String host,
            @Value("${spring.data.redis.port:6379}") int port) {
        return RedisClient.builder().hostAndPort(host, port).build();
    }

    /**
     * 建立 Redis Semantic Cache，儲存問題向量與 ChatResponse，
     * 並透過向量相似度搜尋可重用的回答。
     */
    @Bean("redisSemanticCache")
    public SemanticCache redisSemanticCache(RedisClient redisClient, EmbeddingModel embeddingModel) {
        return DefaultSemanticCache.builder()
                .jedisClient(redisClient)
                .embeddingModel(embeddingModel)
                .similarityThreshold(0.9) // 快取命中的最低相似度
                .indexName("redis-semantic-cache-index") // Redis Search 索引名稱
                .prefix("cache:") // 快取資料的 key 前綴
                .build();
    }

    /**
     * 建立 Redis Semantic Cache Advisor；掛到 ChatClient 後才會攔截請求並使用快取。
     */
    @Bean("redisSemanticCacheAdvisor")
    public SemanticCacheAdvisor redisSemanticCacheAdvisor(@Qualifier("redisSemanticCache") SemanticCache semanticCache) {
        return SemanticCacheAdvisor.builder().cache(semanticCache).build();
    }

    // Qdrant Semantic Cache

    /**
     * 使用 cachingVectorStore 建立 Qdrant Semantic Cache。
     */
    @Bean("qdrantSemanticCache")
    SemanticCache qdrantSemanticCache(@Qualifier("cachingVectorStore") VectorStore vectorStore) {
        return DefaultSemanticCache.builder()
                .vectorStore(vectorStore)
                .similarityThreshold(0.8)
                .build();
    }

    /**
     * 建立 Qdrant Semantic Cache Advisor；掛到 ChatClient 後才會攔截請求並使用快取。
     */
    @Bean("qdrantSemanticCacheAdvisor")
    public SemanticCacheAdvisor qdrantSemanticCacheAdvisor(@Qualifier("qdrantSemanticCache") SemanticCache semanticCache) {
        return SemanticCacheAdvisor.builder().cache(semanticCache).build();
    }

}
