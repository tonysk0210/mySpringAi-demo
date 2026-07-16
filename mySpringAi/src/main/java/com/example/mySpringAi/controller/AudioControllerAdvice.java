package com.example.mySpringAi.controller;

import com.example.mySpringAi.dto.AudioErrorResponseDto;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

/**
 * AudioController 專用例外處理器，將常見錯誤統一轉成 AudioErrorResponseDto JSON response。
 */
@Slf4j
@RestControllerAdvice(assignableTypes = AudioController.class)
public class AudioControllerAdvice {

    /**
     * 處理 @Valid 驗證失敗，回傳第一個欄位錯誤與 400。
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<AudioErrorResponseDto> validation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("請求內容驗證失敗。");
        return error(HttpStatus.BAD_REQUEST, message, request);
    }

    /**
     * 處理 multipart 缺少 file 或 options 等必要欄位。
     */
    @ExceptionHandler(MissingServletRequestPartException.class)
    ResponseEntity<AudioErrorResponseDto> missingPart(MissingServletRequestPartException exception, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "缺少 multipart 欄位：" + exception.getRequestPartName(), request);
    }

    /**
     * 處理上傳超過 25 MB 限制，回傳 413。
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<AudioErrorResponseDto> uploadTooLarge(MaxUploadSizeExceededException exception, HttpServletRequest request) {
        return error(HttpStatus.PAYLOAD_TOO_LARGE, "音訊檔案超過 25 MB 上限。", request);
    }

    /**
     * 保留 Controller 主動指定的 HTTP status 與錯誤訊息。
     */
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<AudioErrorResponseDto> responseStatus(ResponseStatusException exception, HttpServletRequest request) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        return error(status, exception.getReason(), request);
    }

    /**
     * 處理未預期或模型錯誤：記錄細節，前端只回傳安全訊息。
     */
    @ExceptionHandler(Exception.class)
    ResponseEntity<AudioErrorResponseDto> modelFailure(Exception exception, HttpServletRequest request) {
        log.error("Audio API 處理失敗", exception);
        return error(HttpStatus.BAD_GATEWAY, "音訊模型服務目前無法完成請求。", request);
    }

    /**
     * 建立統一的 Audio API 錯誤 response body。
     */
    private static ResponseEntity<AudioErrorResponseDto> error(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(new AudioErrorResponseDto(
                Instant.now(), status.value(), status.getReasonPhrase(), message, request.getRequestURI()));
    }
}
