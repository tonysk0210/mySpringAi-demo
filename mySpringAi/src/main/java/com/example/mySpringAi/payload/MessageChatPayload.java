package com.example.mySpringAi.payload;

import jakarta.validation.constraints.NotBlank;

public record MessageChatPayload(
        @NotBlank(message = "message 不得為空") String message
) {
}
