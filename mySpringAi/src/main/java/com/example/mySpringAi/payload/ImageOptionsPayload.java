package com.example.mySpringAi.payload;

public record ImageOptionsPayload(
        String message,
        String model,
        String quality,
        String size
) {
}
