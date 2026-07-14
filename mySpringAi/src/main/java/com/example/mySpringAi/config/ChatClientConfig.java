package com.example.mySpringAi.config;

import com.example.mySpringAi.advisor.PrettyLoggerAdvisor;
import com.example.mySpringAi.advisor.TokenUsageAuditAdvisor;
import com.example.mySpringAi.tools.TimeTool;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.ai.chat.cache.semantic.SemanticCacheAdvisor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.ToolCallingAdvisor;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatClientConfig {

    // OpenAI 通用參數：所有 OpenAI ChatClient 共用同一份 Builder（temperature=0.5, maxTokens=500）
    private final ChatOptions.Builder<OpenAiChatOptions.Builder> openAiChatOptions = OpenAiChatOptions.builder().temperature(0.5).maxTokens(500);

    // Ollama 通用參數：所有 Ollama ChatClient 共用同一份 Builder（temperature=0.5, maxTokens=500）
    private final ChatOptions.Builder<OllamaChatOptions.Builder> ollamaChatOptions = OllamaChatOptions.builder().temperature(0.5).maxTokens(500);

    // 1. 使用 OpenAI 模型、沒有聊天記憶功能
    @Bean("openaiCCNoMem")
    public ChatClient openaiCCNoMem(OpenAiChatModel openAiChatModel, ObservationRegistry observationRegistry) {

        return ChatClient.builder(openAiChatModel, observationRegistry, null, null)
                .defaultOptions(openAiChatOptions)
                .defaultAdvisors(new TokenUsageAuditAdvisor(), new PrettyLoggerAdvisor())
                .defaultSystem("回答時請使用清楚、易理解且專業的繁體中文。").build();
    }

    // 2. 使用 OpenAI 模型、沒有聊天記憶功能，有 Redis Caching 功能
    @Bean("openaiCCNoMemRedisCache")
    public ChatClient openaiCCNoMemRedisCache(OpenAiChatModel openAiChatModel, @Qualifier("redisSemanticCacheAdvisor") SemanticCacheAdvisor redisSemanticCacheAdvisor, ObservationRegistry observationRegistry) {

        return ChatClient.builder(openAiChatModel, observationRegistry, null, null)
                .defaultOptions(openAiChatOptions)
                .defaultAdvisors(new TokenUsageAuditAdvisor(), new PrettyLoggerAdvisor(), redisSemanticCacheAdvisor)
                .defaultSystem("回答時請使用清楚、易理解且專業的繁體中文。").build();
    }

    // 3. 使用 OpenAI 模型、沒有聊天記憶功能，有 Qdrant Caching 功能
    @Bean("openaiCCNoMemQdrantCache")
    public ChatClient openaiCCNoMemQdrantCache(OpenAiChatModel openAiChatModel, @Qualifier("qdrantSemanticCacheAdvisor") SemanticCacheAdvisor qdrantSemanticCacheAdvisor, ObservationRegistry observationRegistry) {

        return ChatClient.builder(openAiChatModel, observationRegistry, null, null)
                .defaultOptions(openAiChatOptions)
                .defaultAdvisors(new TokenUsageAuditAdvisor(), new PrettyLoggerAdvisor(), qdrantSemanticCacheAdvisor)
                .defaultSystem("回答時請使用清楚、易理解且專業的繁體中文。").build();
    }

    // 4. 使用 OpenAI 模型，搭配 In-memory chat memory
    @Bean("openaiCCInMemory")
    public ChatClient openaiCCInMemory(OpenAiChatModel openAiChatModel, @Qualifier("inMemoryChatMemory") ChatMemory chatMemory, ObservationRegistry observationRegistry) {

        // 建立 MessageChatMemoryAdvisor，也就是「會話記憶攔截器」。使用 In-memory Chat Memory 作為記憶源
        Advisor inMemoryAdvisor = MessageChatMemoryAdvisor.builder(chatMemory).build();

        return ChatClient.builder(openAiChatModel, observationRegistry, null, null)
                .defaultOptions(openAiChatOptions)
                .defaultAdvisors(new TokenUsageAuditAdvisor(), new PrettyLoggerAdvisor(), inMemoryAdvisor)
                .defaultSystem("回答時請使用清楚、易理解且專業的繁體中文。").build();
    }


    // 5. 使用 OpenAI 模型，搭配 jdbc chat memory
    @Bean("openaiCCJdbcMemory")
    public ChatClient openaiCCJdbcMemory(OpenAiChatModel openAiChatModel, @Qualifier("jdbcChatMemory") ChatMemory chatMemory, ObservationRegistry observationRegistry) {

        // 建立 MessageChatMemoryAdvisor，也就是「會話記憶攔截器」。使用 Jdbc Chat Memory 作為記憶源
        Advisor jdbcChatMemoryAdvisor = MessageChatMemoryAdvisor.builder(chatMemory).build();

        return ChatClient.builder(openAiChatModel, observationRegistry, null, null)
                .defaultOptions(openAiChatOptions)
                .defaultAdvisors(new TokenUsageAuditAdvisor(), new PrettyLoggerAdvisor(), jdbcChatMemoryAdvisor)
                .defaultSystem("回答時請使用清楚、易理解且專業的繁體中文。").build();
    }

    // 6. 使用 Ollama 模型，搭配 jdbc chat memory
    @Bean("ollamaCCJdbcMemory")
    public ChatClient ollamaCCJdbcMemory(OllamaChatModel ollamaChatModel, @Qualifier("jdbcChatMemory") ChatMemory chatMemory, ObservationRegistry observationRegistry) {

        // 建立 MessageChatMemoryAdvisor，也就是「會話記憶攔截器」。使用 Jdbc Chat Memory 作為記憶源
        Advisor jdbcChatMemoryAdvisor = MessageChatMemoryAdvisor.builder(chatMemory).build();

        return ChatClient.builder(ollamaChatModel, observationRegistry, null, null)
                .defaultOptions(ollamaChatOptions)
                .defaultAdvisors(new TokenUsageAuditAdvisor(), new PrettyLoggerAdvisor(), jdbcChatMemoryAdvisor)
                .defaultSystem("回答時請使用清楚、易理解且專業的繁體中文。").build();
    }


    // 7. 使用 OpenAI 模型，搭配 jdbc chat memory，以及 Tool Calling 功能
    @Bean("openaiCCJdbcMemoryWithToolCalling")
    public ChatClient openaiCCJdbcMemoryWithToolCalling(OpenAiChatModel openAiChatModel, @Qualifier("jdbcChatMemory") ChatMemory chatMemory, TimeTool timeTool, ObservationRegistry observationRegistry, ToolCallingManager toolCallingManager) {

        // 1. 建立 MessageChatMemoryAdvisor，也就是「會話記憶攔截器」。使用 Jdbc Chat Memory 作為記憶源
        Advisor jdbcChatMemoryAdvisor = MessageChatMemoryAdvisor.builder(chatMemory).build();

        // 2. 建立 ToolCallingAdvisor 的 Builder，指定工具呼叫流程要使用的 ToolCallingManager。當模型回傳 tool call 時，ToolCallingAdvisor 會透過此 manager 執行對應工 - toolExecutionExceptionProcessor 用於處理工具執行過程中的異常
        ToolCallingAdvisor.Builder<?> toolCallingAdvisorBuilder = ToolCallingAdvisor.builder()
                .toolCallingManager(toolCallingManager);

        return ChatClient.builder(openAiChatModel, observationRegistry, null, null, toolCallingAdvisorBuilder)
                .defaultOptions(openAiChatOptions).defaultAdvisors(new TokenUsageAuditAdvisor(), new PrettyLoggerAdvisor(), jdbcChatMemoryAdvisor)
                .defaultTools(timeTool) // 增加 Tool 支援
                .defaultSystem("回答時請使用清楚、易理解且專業的繁體中文。").build();
    }
}
