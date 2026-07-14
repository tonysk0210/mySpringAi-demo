package com.example.mySpringAi.controller;

import com.example.mySpringAi.payload.MessageChatPayload;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.*;

@RestController
public class GenericChatController {

    private final ChatClient openaiCCInMemory;
    private final ChatClient openaiCCJdbcMemory;
    private final ChatClient ollamaCCJdbcMemory;

    @Autowired
    public GenericChatController(
            @Qualifier("openaiCCInMemory") ChatClient openaiCCInMemory,
            @Qualifier("openaiCCJdbcMemory") ChatClient openaiCCJdbcMemory,
            @Qualifier("ollamaCCJdbcMemory") ChatClient ollamaCCJdbcMemory
    ) {
        this.openaiCCInMemory = openaiCCInMemory;
        this.openaiCCJdbcMemory = openaiCCJdbcMemory;
        this.ollamaCCJdbcMemory = ollamaCCJdbcMemory;
    }

    // 1. 使用 OpenAI 模型，搭配 In-memory chat memory
    @PostMapping("/openai/chat-inMemory")
    public String openaiChatInMemory(@RequestBody MessageChatPayload messageChatPayload, @RequestHeader("userName") String userName) {

        return openaiCCInMemory.prompt(messageChatPayload.message())
                // 將 userName 設為 conversationId，讓 MessageChatMemoryAdvisor 讀寫該使用者的聊天記憶
                .advisors(advisorSpec ->
                        advisorSpec.param(ChatMemory.CONVERSATION_ID, userName))
                .call().content();
    }

    // 2. 使用 OpenAI 模型，搭配 JDBC chat memory @1
    @PostMapping("/openai/chat-jdbc")
    public String openaiChat(@RequestBody MessageChatPayload messageChatPayload, @RequestHeader("userName") String userName) {

        return openaiCCJdbcMemory.prompt(messageChatPayload.message())
                // 將 OpenAI 對話的 conversationId 設為 openai-{userName}，讓 MessageChatMemoryAdvisor 只讀寫這組 JDBC 聊天記憶
                .advisors(advisorSpec ->
                        advisorSpec.param(ChatMemory.CONVERSATION_ID, "openai-" + userName))
                .call().content();
    }

    // 3. 使用 Ollama 模型，搭配 JDBC chat memory @2
    @PostMapping("/ollama/chat-jdbc")
    public String ollamaChat(@RequestBody MessageChatPayload messageChatPayload, @RequestHeader("userName") String userName) {
        return ollamaCCJdbcMemory.prompt(messageChatPayload.message())
                .advisors(advisorSpec ->
                        advisorSpec.param(ChatMemory.CONVERSATION_ID, "ollama-" + userName))
                .call().content();
    }
}
