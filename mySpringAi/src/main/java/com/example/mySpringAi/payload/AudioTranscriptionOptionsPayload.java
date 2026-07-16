package com.example.mySpringAi.payload;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record AudioTranscriptionOptionsPayload(
        String prompt,
        @Pattern(regexp = "^$|^[a-zA-Z]{2}$", message = "language 必須是兩碼 ISO-639-1 語言代碼") String language,
        @NotNull(message = "temperature 不得為空")
        @DecimalMin(value = "0.0", message = "temperature 不得小於 0")
        @DecimalMax(value = "1.0", message = "temperature 不得大於 1") Float temperature,
        @NotBlank(message = "responseFormat 不得為空") String responseFormat
) {
}
