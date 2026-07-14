package com.example.mySpringAi.tools;

import com.example.mySpringAi.entity.HelpDeskTicketEntity;
import com.example.mySpringAi.payload.HelpDeskTicketPayload;
import com.example.mySpringAi.service.HelpDeskTicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class HelpDeskTicketTool {

    private final HelpDeskTicketService service;

    // 內部 framework + reflection so Tool's methods still gets called even not declared as public

    /**
     * 建立「服務工單」Tool
     */
    @Tool(name = "createTicket", description = "建立「服務工單」", returnDirect = true)
    String createTicket(@ToolParam(description = "需要建立的「服務工單」的 payload") HelpDeskTicketPayload payload, ToolContext toolContext) {

        // 1. 從 ToolContext 拿出呼叫者 username，避免讓模型自由填寫，從 ChatClient 傳入
        String username = (String) toolContext.getContext().get("userName");

        log.info("協助 userName: {} 來建立「服務工單」；問題訴求: {}", username, payload.issue());

        // 2. 呼叫 Service 層建立「服務工單」
        HelpDeskTicketEntity savedTicket = service.createHelpDeskTicket(payload, username);
        log.info("成功建立「服務工單」 id#: {}, userName: {}", savedTicket.getId(), savedTicket.getUsername());

        // 3. 回傳建立「服務工單」的結果 returnDirect=true：模型會直接回傳此字串給使用者，不再追加其他回答
        return String.format("""
                        工單建立成功！
                        - 工單編號：#%d
                        - 使用者：%s
                        - 問題描述：%s
                        - 狀態：%s
                        - 建立時間：%s
                        - 預計處理時間：%s
                        """,
                savedTicket.getId(),
                savedTicket.getUsername(),
                savedTicket.getIssue(),
                savedTicket.getStatus(),
                savedTicket.getCreatedAt(),
                savedTicket.getEta());
    }

    @Tool(name = "getTicketStatus", description = "取得所有「服務工單」並提供工單相關細節，包括工單編號、問題描述、狀態、建立時間及預計完成時間")
    List<HelpDeskTicketEntity> getTicketStatus(ToolContext toolContext) {
        // 1. 從 ToolContext 拿出呼叫者 username，避免讓模型自由填寫，從 ChatClient 傳入
        String username = (String) toolContext.getContext().get("userName");
        log.info("取得 {} 的所有「服務工單」: ", username);

        // 2. 查詢該使用者所有「服務工單」並回傳；模型可用此結果回答進度
        List<HelpDeskTicketEntity> tickets = service.getHelpDeskTicketsByUser(username);
        log.info("共 {} 張「服務工單」 for userName: {}", tickets.size(), username);

        return tickets;
        // throw new RuntimeException("系統發生錯誤-請聯繫人工客服"); // 用來測試 Tool calling 發生錯誤情境
    }
}
