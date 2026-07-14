package com.example.mySpringAi.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.ollama.OllamaEmbeddingModel;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class EmbeddingModelConfig {

    @Primary
    @Bean("openaiEmbedding")
    public EmbeddingModel openaiEmbedding(OpenAiEmbeddingModel openai) {
        return openai;
    }

    @Bean("ollamaEmbedding")
    public EmbeddingModel ollamaEmbedding(OllamaEmbeddingModel ollama) {
        return ollama;
    }
}
