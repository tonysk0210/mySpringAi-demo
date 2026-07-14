package com.example.mySpringAi.controller;

import com.example.mySpringAi.payload.MessageChatPayload;
import com.openai.models.audio.AudioResponseFormat;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/audio")
public class AudioController {
    private final TranscriptionModel transcriptionModel;
    private final TextToSpeechModel textToSpeechModel; // OpenAiAudioSpeechModel implements TextToSpeechModel

    /**
     * 基本語音轉文字：丟音檔即可，其他全用 OpenAI Whisper 預設值（輸出純文字、自動偵測語言）。
     * 對比 /transcribe-options：本 endpoint 不帶 options，適合快速純文字轉錄。
     */
    @GetMapping("/transcribe")
    String transcribe(@Value("classpath:SpringAI.mp3") Resource audioFile) {
        log.info("Transcription 請求: {}", audioFile.getFilename());

        // 1. 呼叫 transcriptionModel 的 call 方法，傳入音檔
        AudioTranscriptionResponse response = transcriptionModel.call(new AudioTranscriptionPrompt(audioFile));
        String result = response.getResult().getOutput();

        log.info("Transcription 回應: {}", result);
        return result;
    }

    /**
     * 進階語音轉文字：帶 OpenAiAudioTranscriptionOptions 精細控制主題提示、語言、隨機性、輸出格式（此處為 VTT 字幕）。
     * 對比 /transcribe：本 endpoint 適合有專有名詞或需要字幕檔的情境；/transcribe 適合快速純文字轉錄。
     */
    @GetMapping("/transcribe-options")
    String transcribeWithOptions(@Value("classpath:SpringAI.mp3") Resource audioFile) {
        log.info("Transcription 請求 (options): {}", audioFile.getFilename());

        // 1. 呼叫 transcriptionModel 的 call 方法，傳入音檔和轉錄設定
        AudioTranscriptionResponse response = transcriptionModel.call(new AudioTranscriptionPrompt(
                audioFile,
                OpenAiAudioTranscriptionOptions.builder()
                        .prompt("Talking about Spring AI")       // 主題提示：幫模型正確辨識 "Spring AI" 這類專有名詞
                        .language("en")                          // 強制語言：跳過自動偵測（短音檔易誤判）
                        .temperature(0.5f)                       // 隨機性：0 = 最保守可重現、1 = 較有變化
                        .responseFormat(AudioResponseFormat.VTT) // WebVTT 字幕格式（含時間戳記，非純文字）
                        .build()));
        String result = response.getResult().getOutput();

        log.info("Transcription 回應 (options): {}", result);
        return result;
    }

    /**
     * 基本文字轉語音：丟文字即可，其他全用 OpenAI TTS 預設值（預設聲音、正常語速、MP3 格式）。
     * 對比 /text-to-speech-options：本 endpoint 不帶 options，適合快速產生語音檔。
     */
    @PostMapping("/text-to-speech")
    String speech(@RequestBody MessageChatPayload payload) throws IOException {
        log.info("TTS 請求: {}", payload.message());
        // 1. 呼叫 textToSpeechModel 的 call 方法，傳入要轉成音檔的文字
        byte[] audioBytes = textToSpeechModel.call(payload.message());

        // 2. 建立輸出檔案路徑
        Path path = Paths.get("audio-output", "speech.mp3");

        // 3. 寫入音檔
        Files.write(path, audioBytes);

        log.info("TTS 完成，檔案儲存至: {}", path.toAbsolutePath());
        // 4. 回應結果
        return "MP3 已成功儲存至：" + path.toAbsolutePath();
    }

    /**
     * 進階文字轉語音：帶 OpenAiAudioSpeechOptions 精細控制音色、語速、輸出格式（此處為 NOVA 聲音、1.0 語速、MP3）。
     * 對比 /text-to-speech：本 endpoint 適合需要特定音色或語速的情境；/text-to-speech 適合快速產生語音檔。
     */
    @PostMapping("/text-to-speech-options")
    String speechWithOptions(@RequestBody MessageChatPayload payload) throws IOException {
        log.info("TTS 請求 (options): {}", payload.message());
        // 1. 建立 TextToSpeechPrompt，把文字和語音合成 options 打包成請求
        TextToSpeechResponse speechResponse = textToSpeechModel.call(new TextToSpeechPrompt(payload.message(),
                OpenAiAudioSpeechOptions.builder()
                        .voice(OpenAiAudioSpeechOptions.Voice.NOVA) // 指定 TTS 使用 NOVA 聲音
                        .speed(1.0) // 語速倍率；1.0 代表正常速度
                        .responseFormat(OpenAiAudioSpeechOptions.AudioResponseFormat.MP3).build())); // 要求回傳 MP3 音訊格式

        // 2. 建立輸出檔案路徑
        Path path = Paths.get("audio-output", "speech-options.mp3");

        // 3. 寫入音檔
        Files.write(path, speechResponse.getResult().getOutput());

        log.info("TTS 完成 (options)，檔案儲存至: {}", path.toAbsolutePath());
        // 4. 回應結果
        return "MP3 已成功儲存至：" + path.toAbsolutePath();
    }
}
