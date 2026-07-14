package com.example.mySpringAi.controller;

import com.example.mySpringAi.payload.AutoEmailResponsePayload;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/email")
public class AutoEmailResponseController {

    private final ChatClient openaiCCNoMem;

    // 指定 PromptTemplate 的位置，Spring 會自動讀取這個檔案並注入 Resource 物件。這裡的 promptTemplateText 是一個 Resource，可以透過 getInputStream() 來讀取檔案內容。
    @Value("classpath:promptTemplate/AutoEmailResponsePromptTemplate.st")
    private Resource autoEmailResponsePromptTemplate;

    @Autowired
    public AutoEmailResponseController(@Qualifier("openaiCCNoMem") ChatClient openaiCCNoMem) {
        this.openaiCCNoMem = openaiCCNoMem;
    }

    /**
     * 使用 OpenAI 的 ChatGPT 來生成電子郵件回應。這個 API 接收一個 AutoEmailResponsePayload 物件，包含客戶名稱和客戶訊息，然後使用預先定義的 PromptTemplate 來生成回應。
     */
    @PostMapping("/emailResponse")
    public String openaiEmailResponse(@RequestBody AutoEmailResponsePayload autoEmailResponsePayload) {
        return openaiCCNoMem.prompt()

                // 使用預先定義的 PromptTemplate 來生成 Prompt，並將客戶名稱和訊息作為參數傳入。這裡的 promptUserSpec.text() 方法會將 PromptTemplate 的內容與參數結合，生成最終的 Prompt。
                .user(promptUserSpec -> promptUserSpec.text(autoEmailResponsePromptTemplate)
                        .param("customerName", autoEmailResponsePayload.customerName())
                        .param("customerMessage", autoEmailResponsePayload.customerMessage()))
                .call().content();
    }
}
