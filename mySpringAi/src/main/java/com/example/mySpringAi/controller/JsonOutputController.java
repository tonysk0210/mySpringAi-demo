package com.example.mySpringAi.controller;

import com.example.mySpringAi.dto.CountryCitiesDto;
import com.example.mySpringAi.payload.MessageChatPayload;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.ListOutputConverter;
import org.springframework.ai.converter.MapOutputConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * openaiGenerateJsonDto 和 openaiGenerateListJsonDto 都有較明確的 DTO 結構約束。
 * openaiGenerateList 和 openaiGenerateMap 只有集合型別約束，不能保證固定業務欄位或語意格式。
 */
@RestController
@RequestMapping("/dto")
public class JsonOutputController {

    private final ChatClient openaiCCNoMem;

    @Autowired
    public JsonOutputController(@Qualifier("openaiCCNoMem") ChatClient openaiCCNoMem) {
        this.openaiCCNoMem = openaiCCNoMem;
    }

    /**
     * 讓 Spring AI 要求模型輸出符合 CountryCitiesDto 結構的內容，然後用 CountryCitiesDto.class 把模型回傳文字轉成 CountryCitiesDto 物件。
     */
    @PostMapping("/generateJsonDto")
    public ResponseEntity<CountryCitiesDto> openaiGenerateJsonDto(@RequestBody MessageChatPayload messageChatPayload) {

        // 呼叫 OpenAI 生成符合 CountryCitiesDto 結構的 JSON 數據
        CountryCitiesDto dto = openaiCCNoMem.prompt()
                .user(messageChatPayload.message())
                .call()
                .entity(CountryCitiesDto.class); // 要求 LLM 回傳符合 CountryCitiesDto 結構的物件
        return ResponseEntity.ok(dto);
    }

    /**
     * 讓 Spring AI 要求模型輸出符合 List<CountryCitiesDto> 結構的內容，然後用 ParameterizedTypeReference 把模型回傳文字轉成 List<CountryCitiesDto> 物件。
     */
    @PostMapping("/generateListJsonDto")
    public ResponseEntity<List<CountryCitiesDto>> openaiGenerateListJsonDto(@RequestBody MessageChatPayload messageChatPayload) {

        // 呼叫 OpenAI 生成符合 List<CountryCitiesDto> 結構的 JSON 數據
        List<CountryCitiesDto> listDto = openaiCCNoMem.prompt()
                .user(messageChatPayload.message())
                .call()
                .entity(new ParameterizedTypeReference<>() {
                }); // 要求 LLM 回傳符合 List<CountryCitiesDto> 結構的物件
        return ResponseEntity.ok(listDto);
    }

    /**
     * 讓 Spring AI 要求模型輸出符合 List<String> 結構的內容，然後用 ListOutputConverter 把模型回傳文字轉成 List<String> 物件。
     */
    @PostMapping("/generateList")
    public ResponseEntity<List<String>> openaiGenerateList(@RequestBody MessageChatPayload messageChatPayload) {

        // 呼叫 OpenAI 生成符合 List<String> 結構的 JSON 數據
        List<String> list = openaiCCNoMem.prompt()
                .user(messageChatPayload.message())
                .call()
                .entity(new ListOutputConverter()); // 要求 LLM 回傳符合 List<String> 結構的物件
        return ResponseEntity.ok(list);
    }

    /**
     * 讓 Spring AI 要求模型輸出符合 Map<String, Object> 結構的內容，然後用 MapOutputConverter 把模型回傳文字轉成 Map<String, Object> 物件。
     */
    @PostMapping("/generateMap")
    public ResponseEntity<Map<String, Object>> openaiGenerateMap(@RequestBody MessageChatPayload messageChatPayload) {

        // 呼叫 OpenAI 生成符合 Map<String, Object> 結構的 JSON 數據
        Map<String, Object> map = openaiCCNoMem.prompt()
                .user(messageChatPayload.message())
                .call()
                .entity(new MapOutputConverter()); // 要求 LLM 回傳符合 Map<String, Object> 結構的物件
        return ResponseEntity.ok(map);
    }
}
