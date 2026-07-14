package com.example.mySpringAi.controller;

import com.example.mySpringAi.payload.MessageChatPayload;
import com.example.mySpringAi.tools.HelpDeskTicketTool;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Map;

import static org.springframework.ai.chat.memory.ChatMemory.CONVERSATION_ID;

/**
 * 提供時間查詢與客服工單的 Tool Calling API。
 * 共用的 ChatClient 已包含 JDBC 對話記憶及預設時間工具。
 */
@Controller
@RequestMapping("/tool")
public class ToolCallingController {

    private final ChatClient chatClient;
    private final HelpDeskTicketTool helpDeskTicketTool;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("classpath:/promptTemplate/HelpDeskTicketPromptTemplate.st")
    Resource helpDeskTicketPromptTemplate;

    @Autowired
    public ToolCallingController(@Qualifier("openaiCCJdbcMemoryWithToolCalling") ChatClient openaiCCJdbcMemoryWithToolCalling,
                                 HelpDeskTicketTool helpDeskTicketTool) {
        this.chatClient = openaiCCJdbcMemoryWithToolCalling;
        this.helpDeskTicketTool = helpDeskTicketTool;
    }

    /**
     * 根據使用者訊息呼叫時間工具並回傳結果。
     */
    @PostMapping("/time")
    public ResponseEntity<String> time(@RequestBody MessageChatPayload payload, @RequestHeader("userName") String userName) {

        // 使用獨立的 conversation ID，避免與工單對話記憶混用。
        String response = chatClient.prompt()
                .advisors(aSpec -> aSpec.param(CONVERSATION_ID, "tool-" + userName))
                .user(payload.message())
                .call().content();
        return ResponseEntity.ok(response);
    }

    /**
     * 根據使用者訊息查詢工單狀態或建立新工單。
     */
    @PostMapping("/helpDeskTicket")
    public ResponseEntity<String> helpDeskTicket(@RequestBody MessageChatPayload payload, @RequestHeader("userName") String userName) {
        String response = chatClient.prompt()
                // 載入客服規則，讓 LLM 依流程查詢或建立工單。
                .system(helpDeskTicketPromptTemplate)
                // 加入本次請求專用的工單工具，並保留 ChatClient 的預設工具。
                .tools(helpDeskTicketTool)
                // 由後端傳入使用者名稱，避免交由 LLM 自行提供。
                .toolContext(Map.of("userName", userName))
                // 每位使用者使用獨立的工單對話記憶。
                .advisors(aSpec -> aSpec.param(CONVERSATION_ID, "toolHelpDeskTicket-" + userName))
                .user(payload.message())
                .call().content();

        // 將 returnDirect 工具可能回傳的 JSON 字串轉回純文字。
        String body = unwrapJsonString(response);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(body);
    }

    /**
     * 若回應是 JSON 字串則反序列化，讓跳脫字元（例如 \n）正常顯示；
     * 一般文字或無法解析的內容維持原值。
     */
    private String unwrapJsonString(String s) {
        if (s != null && s.startsWith("\"")) {
            try {
                return objectMapper.readValue(s, String.class);
            } catch (Exception ignored) {
            }
        }
        return s;
    }
}
