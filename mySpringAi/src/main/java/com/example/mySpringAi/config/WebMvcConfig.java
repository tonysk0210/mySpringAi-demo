package com.example.mySpringAi.config;

import com.example.mySpringAi.advisor.PrettyLoggerAdvisor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Spring MVC 全域設定：註冊自訂 HandlerInterceptor。
 * <p>
 * 用途：在每次 HTTP 請求進入 Controller 之前，將 {@link PrettyLoggerAdvisor} 的 LLM 呼叫計數器歸零，
 * 讓每個 API request 的 log 都能從 "#1" 開始，方便對照「單次 API 請求 → 多次 LLM 呼叫」的關係
 * （例如 tool calling 場景下，一次 API 內會遞增為 #1、#2、#3…）。
 */
@Configuration
@RequiredArgsConstructor // Lombok：自動產生包含 final 欄位的建構子（等同於建構子注入 prettyLoggerAdvisor）
public class WebMvcConfig implements WebMvcConfigurer {

    // 注入單例 PrettyLoggerAdvisor Bean（所有 ChatClient 共用同一實例）
    private final PrettyLoggerAdvisor prettyLoggerAdvisor;

    /**
     * 註冊 Interceptor。Spring 會在 DispatcherServlet 分派到 Controller 前呼叫 preHandle()。
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            /**
             * preHandle 於 Controller 方法執行「之前」呼叫。
             * 這裡把計數器歸零，確保每個 HTTP 請求的 LLM log 都從 #1 開始。
             *
             * @return true 代表繼續交給 Controller 處理；false 代表中止請求。
             */
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
                prettyLoggerAdvisor.reset();
                return true;
            }
        }).addPathPatterns("/**"); // 攔截所有路徑；reset 只是把計數器歸零，對非 LLM 路徑（如 /h2-console、/actuator）不會產生副作用
    }
}
