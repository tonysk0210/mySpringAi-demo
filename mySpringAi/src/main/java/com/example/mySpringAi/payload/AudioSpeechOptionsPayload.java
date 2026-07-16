package com.example.mySpringAi.payload;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AudioSpeechOptionsPayload(
        @NotBlank(message = "message 不得為空") String message,
        @NotBlank(message = "voice 不得為空") String voice,
        @NotNull(message = "speed 不得為空")
        @DecimalMin(value = "0.25", message = "speed 不得小於 0.25")
        @DecimalMax(value = "4.0", message = "speed 不得大於 4.0") Double speed,
        @NotBlank(message = "responseFormat 不得為空") String responseFormat
) {
}
