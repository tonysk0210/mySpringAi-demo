package com.example.mySpringAi.controller;

import com.example.mySpringAi.dto.AudioTranscriptionResponseDto;
import com.example.mySpringAi.payload.AudioSpeechOptionsPayload;
import com.example.mySpringAi.payload.AudioTranscriptionOptionsPayload;
import com.example.mySpringAi.payload.MessageChatPayload;
import com.openai.models.audio.AudioResponseFormat;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.audio.transcription.AudioTranscriptionPrompt;
import org.springframework.ai.audio.transcription.AudioTranscriptionResponse;
import org.springframework.ai.audio.transcription.TranscriptionModel;
import org.springframework.ai.audio.tts.TextToSpeechModel;
import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import org.springframework.ai.audio.tts.TextToSpeechResponse;
import org.springframework.ai.openai.OpenAiAudioSpeechOptions;
import org.springframework.ai.openai.OpenAiAudioTranscriptionOptions;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/audio")
public class AudioController {

    private static final Map<String, MediaType> AUDIO_MEDIA_TYPES = Map.of(
            "mp3", MediaType.parseMediaType("audio/mpeg"),
            "opus", MediaType.parseMediaType("audio/ogg"),
            "aac", MediaType.parseMediaType("audio/aac"),
            "flac", MediaType.parseMediaType("audio/flac"),
            "wav", MediaType.parseMediaType("audio/wav"),
            "pcm", MediaType.APPLICATION_OCTET_STREAM
    );

    private final TranscriptionModel transcriptionModel;
    private final TextToSpeechModel textToSpeechModel;

    /**
     * 上傳音訊並使用預設設定轉錄為文字。
     */
    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    AudioTranscriptionResponseDto transcribe(
            @RequestPart("file") MultipartFile file) {
        // 1. 驗證上傳的音訊不是空檔案；驗證失敗時回傳 400 Bad Request
        validateAudioFile(file);
        log.info("Transcription 請求: file={}, size={}", file.getOriginalFilename(), file.getSize());

        // 2. 呼叫 transcriptionModel 的 call 方法，傳入 AudioTranscriptionPrompt
        AudioTranscriptionResponse response = transcriptionModel.call(
                new AudioTranscriptionPrompt(file.getResource()));

        // 3. 包裝前端回應
        return transcriptionResponse(response, "text", file);
    }

    /**
     * 上傳音訊，並依據前端傳入的進階設定進行轉錄。接收音訊檔案和轉錄選項。
     */
    @PostMapping(value = "/transcribe-options", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    AudioTranscriptionResponseDto transcribeWithOptions(
            @RequestPart("file") MultipartFile file,
            @Valid @RequestPart("options") AudioTranscriptionOptionsPayload payload) {
        // 1. 驗證上傳的音訊不是空檔案；驗證失敗時回傳 400 Bad Request
        validateAudioFile(file);

        // 2. 轉換並建立轉錄 options
        AudioResponseFormat responseFormat = transcriptionFormat(payload.responseFormat());
        log.info("Transcription 請求 (options): file={}, size={}, format={}",
                file.getOriginalFilename(), file.getSize(), payload.responseFormat());

        OpenAiAudioTranscriptionOptions options = OpenAiAudioTranscriptionOptions.builder()
                .prompt(blankToNull(payload.prompt())) // 主題提示：幫模型正確辨識 "Spring AI" 這類專有名詞
                .language(lowercaseOrNull(payload.language())) // 語言設定
                .temperature(payload.temperature()) // 隨機性：0 = 最保守可重現、1 = 較有變化
                .responseFormat(responseFormat) // 轉錄格式
                .build();

        // 3. 呼叫 transcriptionModel 的 call 方法，傳入 AudioTranscriptionPrompt
        AudioTranscriptionResponse response = transcriptionModel.call(
                new AudioTranscriptionPrompt(file.getResource(), options));

        // 4. 包裝前端回應
        return transcriptionResponse(response, payload.responseFormat(), file);
    }

    /**
     * 將文字以預設設定轉換為 MP3 音訊。
     */
    @PostMapping("/text-to-speech")
    ResponseEntity<byte[]> speech(@Valid @RequestBody MessageChatPayload payload) {
        // 1. 整理輸入文字
        String message = payload.message().trim();
        log.info("TTS 請求: characters={}", message.length());

        // 2. 呼叫語音合成模型
        byte[] audioBytes = textToSpeechModel.call(message);

        // 3. 包裝 MP3 binary 回應
        return audioResponse(audioBytes, "mp3");
    }

    /** 依據前端傳入的聲音、語速與格式將文字轉換為音訊。 */
    @PostMapping("/text-to-speech-options")
    ResponseEntity<byte[]> speechWithOptions(@Valid @RequestBody AudioSpeechOptionsPayload payload) {
        // 1. 轉換前端傳入的 options
        OpenAiAudioSpeechOptions.Voice voice = speechVoice(payload.voice());
        OpenAiAudioSpeechOptions.AudioResponseFormat responseFormat = speechFormat(payload.responseFormat());

        // 2. 整理輸入文字
        String message = payload.message().trim();
        log.info("TTS 請求 (options): characters={}, voice={}, speed={}, format={}",
                message.length(), payload.voice(), payload.speed(), payload.responseFormat());

        // 3. 建立 Spring AI 語音合成 options
        OpenAiAudioSpeechOptions options = OpenAiAudioSpeechOptions.builder()
                .voice(voice)
                .speed(payload.speed())
                .responseFormat(responseFormat)
                .build();
        // 4. 呼叫語音合成模型
        TextToSpeechResponse response = textToSpeechModel.call(
                new TextToSpeechPrompt(message, options));

        // 5. 以指定格式包裝 binary 回應
        return audioResponse(response.getResult().getOutput(), payload.responseFormat());
    }

    // ///////////////////////////////////////////////////////////////////
    // Helper method starts here  使用 static method 是無狀態的純工具操作，不依賴目前的 Controller 物件
    // ///////////////////////////////////////////////////////////////////

    /**
     * 取出 Spring AI 轉錄文字，並與格式、原始檔名一起包裝成前端回應 DTO。
     */
    private static AudioTranscriptionResponseDto transcriptionResponse(
            AudioTranscriptionResponse response, String format, MultipartFile file) {
        return new AudioTranscriptionResponseDto(
                response.getResult().getOutput(),
                format.toLowerCase(Locale.ROOT),
                file.getOriginalFilename());
    }

    /**
     * 依音訊格式設定 MIME type 與檔名，並將音訊 bytes 包裝成 HTTP response。
     */
    private static ResponseEntity<byte[]> audioResponse(byte[] bytes, String format) {
        // 1. 取得格式對應的 MIME type
        String normalizedFormat = format.toLowerCase(Locale.ROOT);
        MediaType mediaType = AUDIO_MEDIA_TYPES.get(normalizedFormat);
        if (mediaType == null) {
            throw new ResponseStatusException(BAD_REQUEST, "不支援的語音格式：" + format);
        }

        // 2. 設定瀏覽器使用的音訊檔名
        ContentDisposition disposition = ContentDisposition.inline()
                .filename("speech." + normalizedFormat)
                .build();

        // 3. 回傳音訊 binary 與 HTTP headers
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(bytes.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(bytes);
    }

    /**
     * 驗證上傳的音訊不是空檔案；驗證失敗時回傳 400 Bad Request。
     */
    private static void validateAudioFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "請選擇非空白的音訊檔案。");
        }
    }

    /** 將前端轉錄格式轉為 OpenAI enum；不支援時回傳 400。 */
    private static AudioResponseFormat transcriptionFormat(String format) {
        return switch (format.toLowerCase(Locale.ROOT)) {
            case "text" -> AudioResponseFormat.TEXT;
            case "srt" -> AudioResponseFormat.SRT;
            case "vtt" -> AudioResponseFormat.VTT;
            default -> throw new ResponseStatusException(BAD_REQUEST, "不支援的轉錄格式：" + format);
        };
    }

    /** 將前端聲音名稱轉為 Spring AI Voice enum；不支援時回傳 400。 */
    private static OpenAiAudioSpeechOptions.Voice speechVoice(String voice) {
        try {
            return OpenAiAudioSpeechOptions.Voice.valueOf(voice.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, "不支援的聲音：" + voice, exception);
        }
    }

    /** 將前端音訊格式轉為 Spring AI AudioResponseFormat enum；不支援時回傳 400。 */
    private static OpenAiAudioSpeechOptions.AudioResponseFormat speechFormat(String format) {
        try {
            return OpenAiAudioSpeechOptions.AudioResponseFormat.valueOf(format.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(BAD_REQUEST, "不支援的語音格式：" + format, exception);
        }
    }

    /** 將 null 或空白字串轉為 null，其餘內容移除頭尾空白。 */
    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** 將非空白字串正規化為小寫；null 或空白則回傳 null。 */
    private static String lowercaseOrNull(String value) {
        String normalized = blankToNull(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }
}
