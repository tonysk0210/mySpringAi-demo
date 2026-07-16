package com.example.mySpringAi.dto;

public record AudioTranscriptionResponseDto(
        String text,
        String format,
        String sourceFileName
) {
}
