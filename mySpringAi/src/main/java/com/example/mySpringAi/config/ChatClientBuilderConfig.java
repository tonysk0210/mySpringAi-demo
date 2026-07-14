package com.example.mySpringAi.config;

import io.micrometer.observation.ObservationRegistry;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Scope;

/**
 * 手寫 ChatClient.Builder Bean 覆蓋 Spring AI auto-config
 * （因為本專案有兩個 ChatModel: OpenAI + Ollama，auto-config 會因為歧義啟動失敗）。
 * <p>
 * 對齊 Spring AI 官方 {@code ChatClientAutoConfiguration} 的設計：使用 prototype scope，
 * 每個注入點各自拿到獨立實例，避免 builder 被下游修改（例如 {@code defaultSystem}、{@code defaultAdvisors}）汙染到其他使用者。
 */
@Configuration
public class ChatClientBuilderConfig {

    @Primary
    @Bean("openaiBuilder")
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public ChatClient.Builder openaiBuilder(OpenAiChatModel model, ObservationRegistry observationRegistry) {
        return ChatClient.builder(model, observationRegistry, null, null);
    }

    @Bean("ollamaBuilder")
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public ChatClient.Builder ollamaBuilder(OllamaChatModel model, ObservationRegistry observationRegistry) {
        return ChatClient.builder(model, observationRegistry, null, null);
    }
}
