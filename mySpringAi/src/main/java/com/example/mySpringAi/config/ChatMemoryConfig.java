package com.example.mySpringAi.config;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 聊天記憶體配置
 */
@Configuration
public class ChatMemoryConfig {

    @Bean("inMemoryChatMemory")
    public ChatMemory inMemoryChatMemory() {
        return MessageWindowChatMemory.builder()
                .maxMessages(50)
                .build();
    }

    // JdbcChatMemoryRepository 來自 pom.xml 所引入的 spring-ai-starter-model-chat-memory-repository-jdbc 自動注入
    @Bean("jdbcChatMemory")
    public ChatMemory jdbcChatMemory(JdbcChatMemoryRepository jdbcChatMemoryRepo) {
        return MessageWindowChatMemory.builder()
                .chatMemoryRepository(jdbcChatMemoryRepo)
                .maxMessages(50)  // 每個 conversationId 的聊天記錄最多保留 20 則
                .build();
    }
}
