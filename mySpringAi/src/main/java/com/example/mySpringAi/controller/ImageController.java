package com.example.mySpringAi.controller;

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

    private final ImageModel imageModel;

    /**
     * 基本圖片生成：丟提示文字即可，其他全用 OpenAI Image 預設值（預設模型、尺寸、品質）。
     * 對比 /image-options：本 endpoint 不帶 options，適合快速產生單張圖片；回傳 B64 解碼後存至 ./image-output/image.png。
     */
    @PostMapping("/image")
    String generateImage(@RequestBody MessageChatPayload payload) throws IOException {
        log.info("圖片生成請求: {}", payload.message());

        // 1. 呼叫 imageModel 的 call 方法，傳入 ImagePrompt
        ImageResponse imageResponse = imageModel.call(new ImagePrompt(payload.message()));

        // 2. 從 imageResponse 中取得圖片的 B64 字串
        String b64Json = imageResponse.getResults().get(0).getOutput().getB64Json();

        // 3. 將 B64 字串解碼為 byte[]，並儲存至 ./image-output/image.png
        byte[] imageBytes = Base64.getDecoder().decode(b64Json);
        Path path = Paths.get("image-output", "image.png");
        Files.write(path, imageBytes);

        log.info("圖片已儲存至: {}", path.toAbsolutePath());
        return "圖片已成功儲存至：" + path.toAbsolutePath();
    }

    /**
     * 進階圖片生成：帶 OpenAiImageOptions 精細控制張數、品質、尺寸、模型（此處為 gpt-image-2、low 品質、1024x1024）。
     * 對比 /image：本 endpoint 適合需要指定模型或品質的情境；回傳 B64 解碼後存至 ./image-output/image-options.png。
     */
    @PostMapping("/image-options")
    String generateImageWithOptions(@RequestBody MessageChatPayload payload) throws IOException {
        log.info("圖片生成請求 (options): {}", payload.message());

        // 1. 呼叫 imageModel 的 call 方法，傳入 ImagePrompt + OpenAiImageOptions
        ImageResponse imageResponse = imageModel.call(new ImagePrompt(payload.message(),
                OpenAiImageOptions.builder()
                        .n(1)                        // 生成張數：1 張
                        .quality("low")          // 品質：gpt-image-2 支援 low / medium / high，不支援 hd
                        .size("1024x1024")         // 尺寸：gpt-image-2 用 size 字串，不用 height/width 分開設
                        .model("gpt-image-2")    // 指定生圖模型
                        .build()));

        // 2. 從 imageResponse 中取得圖片的 B64 字串
        String b64Json = imageResponse.getResult().getOutput().getB64Json();

        // 3. 將 B64 字串解碼為 byte[]，並儲存至 ./image-output/image-options.png
        byte[] imageBytes = Base64.getDecoder().decode(b64Json);
        Path path = Paths.get("image-output", "image-options.png");
        Files.write(path, imageBytes);

        log.info("圖片已儲存至: {}", path.toAbsolutePath());
        return "圖片已成功儲存至：" + path.toAbsolutePath();
    }
}
