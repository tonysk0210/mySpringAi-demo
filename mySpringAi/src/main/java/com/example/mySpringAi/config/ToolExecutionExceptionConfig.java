package com.example.mySpringAi.config;

import io.micrometer.observation.ObservationRegistry;
import org.springframework.ai.model.tool.DefaultToolCallingManager;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.ai.tool.execution.DefaultToolExecutionExceptionProcessor;
import org.springframework.ai.tool.execution.ToolExecutionExceptionProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 設定 Tool Calling 發生錯誤時的處理方式。
 * <p>
 * 本設定會把例外往上拋，交給 Controller 或全域例外處理器處理，
 * 不讓 LLM 把錯誤訊息當成一般工具結果繼續回答。
 * {@link ToolCallingManager} 必須掛到 {@code ToolCallingAdvisor} 才會生效。
 * </p>
 */
@Configuration
public class ToolExecutionExceptionConfig {

    /**
     * {@code true} 表示工具執行失敗時直接拋出例外，
     * 而不是把錯誤訊息回傳給 LLM。
     */
    @Bean
    ToolExecutionExceptionProcessor toolExecutionExceptionProcessor() {
        return new DefaultToolExecutionExceptionProcessor(true);
    }

    /**
     * 建立 Tool Calling 管理器，掛載自訂例外處理器，
     * 並透過 ObservationRegistry 記錄 metrics 與 tracing。
     */
    @Bean
    ToolCallingManager toolCallingManager(
            ToolExecutionExceptionProcessor exceptionProcessor,
            ObservationRegistry observationRegistry) {

        return DefaultToolCallingManager.builder()
                .observationRegistry(observationRegistry)
                .toolExecutionExceptionProcessor(exceptionProcessor)
                .build();
    }
}
