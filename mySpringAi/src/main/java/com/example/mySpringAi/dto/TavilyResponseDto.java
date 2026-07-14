package com.example.mySpringAi.dto;

import java.util.List;

public record TavilyResponseDto(List<Hit> results) {
    public record Hit(String title, String url, String content, Double score) {
    }
}
/*
 Tavily 回傳大概長這樣：
    {
      "results": [
        {
          "title": "Spring AI Reference Documentation",
          "url": "https://docs.spring.io/spring-ai/reference/",
          "content": "Spring AI provides APIs for building AI applications...",
          "score": 0.92
        },
        {
          "title": "Spring AI GitHub",
          "url": "https://github.com/spring-projects/spring-ai",
          "content": "An application framework for AI engineering...",
          "score": 0.86
        }
      ]
    }
*/