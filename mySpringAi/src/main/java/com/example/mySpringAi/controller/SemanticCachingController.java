package com.example.mySpringAi.controller;

import com.example.mySpringAi.payload.MessageChatPayload;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.*;

/**
 * 提供 Redis 與 Qdrant 兩種 Semantic Cache 的聊天 API。
 * 語意相近的問題可直接重用快取回答，減少重複呼叫 LLM。
 */
@RestController
@RequestMapping("/cache")
public class SemanticCachingController {
    private final ChatClient redicChatClient;
    private final ChatClient qdrantChatClient;

    public SemanticCachingController(@Qualifier("openaiCCNoMemRedisCache") ChatClient redicChatClient,
                                     @Qualifier("openaiCCNoMemQdrantCache") ChatClient qdrantChatClient) {
        this.redicChatClient = redicChatClient;
        this.qdrantChatClient = qdrantChatClient;
    }

    /**
     * 使用 Redis Semantic Cache 處理聊天請求。
     */
    @PostMapping("/redisCaching-chat")
    public String redisChat(@RequestBody MessageChatPayload messageChatPayload) {
        return redicChatClient.prompt().user(messageChatPayload.message()).call().content();
    }

    /**
     * 使用 Qdrant Semantic Cache 處理聊天請求。
     */
    @PostMapping("/qdrantCaching-chat")
    public String qdrantChat(@RequestBody MessageChatPayload messageChatPayload) {
        return qdrantChatClient.prompt().user(messageChatPayload.message()).call().content();
    }
}
