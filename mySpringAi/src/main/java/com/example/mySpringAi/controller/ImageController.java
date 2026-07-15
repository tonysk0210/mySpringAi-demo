package com.example.mySpringAi.controller;

import com.example.mySpringAi.dto.ImageGenerationResponseDto;
import com.example.mySpringAi.payload.ImageOptionsPayload;
import com.example.mySpringAi.payload.MessageChatPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.image.ImageModel;
import org.springframework.ai.image.ImagePrompt;
import org.springframework.ai.image.ImageResponse;
import org.springframework.ai.openai.OpenAiImageOptions;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/image")
public class ImageController {

    private static final String DEFAULT_MODEL = "gpt-image-2";
    private static final String DEFAULT_QUALITY = "low";
    private static final String DEFAULT_SIZE = "1024x1024";

    private final ImageModel imageModel;

    /**
     * 基本圖片生成：丟提示文字即可，其他全用 OpenAI Image 預設值（預設模型、尺寸、品質）。
     * 對比 /image-options：本 endpoint 不帶 options，適合快速產生單張圖片；回傳 b64Json 讓前端內嵌顯示，同時保留寫檔到 ./image-output/image.png。
     */
    @PostMapping("/image")
    ImageGenerationResponseDto generateImage(@RequestBody MessageChatPayload payload) throws IOException {
        log.info("圖片生成請求: {}", payload.message());

        // 1. 呼叫 imageModel 的 call 方法，傳入 ImagePrompt
        ImageResponse imageResponse = imageModel.call(new ImagePrompt(payload.message()));

        // 2. 從 imageResponse 中取得圖片的 B64 字串
        String b64Json = imageResponse.getResults().get(0).getOutput().getB64Json();

        // 3. 將 B64 字串解碼為 byte[]，並儲存至 ./image-output/image.png
        Path path = writeImage(b64Json, "image.png");

        log.info("圖片已儲存至: {}", path.toAbsolutePath());
        return new ImageGenerationResponseDto(b64Json, path.toAbsolutePath().toString());
    }

    /**
     * 進階圖片生成：帶 OpenAiImageOptions 精細控制品質、尺寸、模型。
     * 前端可透過 payload 覆寫 model / quality / size；null 或空字串則 fallback 至內建預設值（gpt-image-2 / low / 1024x1024）。
     * n 固定為 1，前端一次只顯示一張。
     */
    @PostMapping("/image-options")
    ImageGenerationResponseDto generateImageWithOptions(@RequestBody ImageOptionsPayload payload) throws IOException {
        String model = orDefault(payload.model(), DEFAULT_MODEL);
        String quality = orDefault(payload.quality(), DEFAULT_QUALITY);
        String size = orDefault(payload.size(), DEFAULT_SIZE);
        
        log.info("圖片生成請求 (options): message={}, model={}, quality={}, size={}",
                payload.message(), model, quality, size);

        // 1. 呼叫 imageModel 的 call 方法，傳入 ImagePrompt + OpenAiImageOptions
        ImageResponse imageResponse = imageModel.call(new ImagePrompt(payload.message(),
                OpenAiImageOptions.builder()
                        .n(1)
                        .quality(quality)
                        .size(size)
                        .model(model)
                        .build()));

        // 2. 從 imageResponse 中取得圖片的 B64 字串
        String b64Json = imageResponse.getResult().getOutput().getB64Json();

        // 3. 將 B64 字串解碼為 byte[]，並儲存至 ./image-output/image-options.png
        Path path = writeImage(b64Json, "image-options.png");

        log.info("圖片已儲存至: {}", path.toAbsolutePath());
        return new ImageGenerationResponseDto(b64Json, path.toAbsolutePath().toString());
    }

    /**
     * 把 OpenAI 回傳的 base64 字串解碼後寫入 ./image-output/{fileName}，回傳寫檔路徑。
     * 兩個 endpoint 都共用這段流程，抽出來避免重複；順便補上 createDirectories 讓第一次跑不會失敗。
     */
    private static Path writeImage(String b64Json, String fileName) throws IOException {
        // 1. base64 字串 → 原始 PNG bytes
        byte[] imageBytes = Base64.getDecoder().decode(b64Json);
        // 2. 組相對路徑；實際落點取決於 JVM 啟動時的 working directory（Spring Boot 從 module root 跑則為 mySpringAi/image-output/）
        Path path = Paths.get("image-output", fileName);
        // 3. 確保 image-output/ 目錄存在；createDirectories 是 idempotent，已存在則 no-op
        Files.createDirectories(path.getParent());
        // 4. 寫入 PNG bytes；同名檔會被直接覆蓋（每個 endpoint 固定用同一個檔名）
        Files.write(path, imageBytes);
        return path;
    }

    // 小工具：null 或空白字串時 fallback 到預設值；讓前端可以只傳關心的欄位，其他用預設。
    private static String orDefault(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }
}
