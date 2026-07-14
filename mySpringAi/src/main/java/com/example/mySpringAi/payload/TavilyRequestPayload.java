package com.example.mySpringAi.payload;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

// Tavily API 使用 snake_case 欄位名稱: @JsonNaming 會將 Java 的 searchDepth/maxResults 對應成 JSON 的 search_depth/max_results。
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record
TavilyRequestPayload(String query, String searchDepth, int maxResults) {
}

/*
送往 Tavily API 的 request body 會被序列化成：
    {
      "query": "Spring AI 是什麼",
      "search_depth": "advanced",
      "max_results": 5
    }
*/
