package com.example.mySpringAi.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.ZoneId;

@Slf4j
@Component
public class TimeTool {

    /**
     * 取得伺服器本地時間。
     * {@code returnDirect=true} 會直接把工具結果作為最終回應，
     * 不再交由 LLM 整理或改寫。
     */
    @Tool(name = "getCurrentLocalTime", description = "取得當前本地時間", returnDirect = true)
    public String getCurrentLocalTime() {
        log.info("呼叫 Tool - getCurrentLocalTime");
        return "現在時間是: " + LocalTime.now().toString();
    }

    /**
     * 取得指定 IANA 時區的目前時間。
     * 此工具未設定 {@code returnDirect}，結果會交回 LLM 整理成最終回答。
     *
     * @param timeZone IANA 時區名稱，例如 {@code Asia/Taipei} 或 {@code UTC}
     */
    @Tool(name = "getCurrentTime", description = "取得指定時區的當前時間")
    public String getCurrentTime(@ToolParam(description = "IANA time zone, e.g. Asia/Taipei, UTC, Europe/London") String timeZone) {
        log.info("呼叫 Tool - getCurrentTime: {}", timeZone);
        return LocalTime.now(ZoneId.of(timeZone)).toString();
    }
}
