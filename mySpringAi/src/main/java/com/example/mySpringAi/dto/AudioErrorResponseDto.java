package com.example.mySpringAi.dto;

import java.time.Instant;

public record AudioErrorResponseDto(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {
}
