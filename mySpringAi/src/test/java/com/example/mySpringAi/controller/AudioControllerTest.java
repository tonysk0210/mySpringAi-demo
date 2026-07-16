package com.example.mySpringAi.controller;

import com.example.mySpringAi.dto.AudioTranscriptionResponseDto;
import com.example.mySpringAi.payload.AudioSpeechOptionsPayload;
import com.example.mySpringAi.payload.AudioTranscriptionOptionsPayload;
import com.example.mySpringAi.payload.MessageChatPayload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.ai.audio.transcription.AudioTranscriptionPrompt;
import org.springframework.ai.audio.transcription.AudioTranscriptionResponse;
import org.springframework.ai.audio.transcription.TranscriptionModel;
import org.springframework.ai.audio.tts.TextToSpeechModel;
import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import org.springframework.ai.audio.tts.TextToSpeechResponse;
import org.springframework.ai.openai.OpenAiAudioSpeechOptions;
import org.springframework.ai.openai.OpenAiAudioTranscriptionOptions;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AudioControllerTest {

    private TranscriptionModel transcriptionModel;
    private TextToSpeechModel textToSpeechModel;
    private AudioController controller;

    @BeforeEach
    void setUp() {
        transcriptionModel = mock(TranscriptionModel.class);
        textToSpeechModel = mock(TextToSpeechModel.class);
        controller = new AudioController(transcriptionModel, textToSpeechModel);
    }

    @Test
    void transcribeReturnsWrappedTextAndSourceFileName() {
        AudioTranscriptionResponse modelResponse = mock(AudioTranscriptionResponse.class, org.mockito.Answers.RETURNS_DEEP_STUBS);
        when(modelResponse.getResult().getOutput()).thenReturn("hello");
        when(transcriptionModel.call(any(AudioTranscriptionPrompt.class))).thenReturn(modelResponse);
        MockMultipartFile file = new MockMultipartFile("file", "sample.mp3", "audio/mpeg", new byte[]{1});

        AudioTranscriptionResponseDto result = controller.transcribe(file);

        assertThat(result.text()).isEqualTo("hello");
        assertThat(result.format()).isEqualTo("text");
        assertThat(result.sourceFileName()).isEqualTo("sample.mp3");
    }

    @Test
    void transcribeOptionsPassesConfiguredOptionsToModel() {
        AudioTranscriptionResponse modelResponse = mock(AudioTranscriptionResponse.class, org.mockito.Answers.RETURNS_DEEP_STUBS);
        when(modelResponse.getResult().getOutput()).thenReturn("WEBVTT");
        when(transcriptionModel.call(any(AudioTranscriptionPrompt.class))).thenReturn(modelResponse);
        MockMultipartFile file = new MockMultipartFile("file", "sample.wav", "audio/wav", new byte[]{1});

        AudioTranscriptionResponseDto result = controller.transcribeWithOptions(
                file, new AudioTranscriptionOptionsPayload("Spring AI", "EN", 0.2f, "vtt"));

        ArgumentCaptor<AudioTranscriptionPrompt> captor = ArgumentCaptor.forClass(AudioTranscriptionPrompt.class);
        verify(transcriptionModel).call(captor.capture());
        OpenAiAudioTranscriptionOptions options = (OpenAiAudioTranscriptionOptions) captor.getValue().getOptions();
        assertThat(options.getPrompt()).isEqualTo("Spring AI");
        assertThat(options.getLanguage()).isEqualTo("en");
        assertThat(options.getTemperature()).isEqualTo(0.2f);
        assertThat(result.format()).isEqualTo("vtt");
    }

    @Test
    void textToSpeechReturnsInlineMp3Bytes() {
        byte[] bytes = {1, 2, 3};
        when(textToSpeechModel.call("hello")).thenReturn(bytes);

        ResponseEntity<byte[]> result = controller.speech(new MessageChatPayload(" hello "));

        assertThat(result.getBody()).isEqualTo(bytes);
        assertThat(result.getHeaders().getContentType().toString()).isEqualTo("audio/mpeg");
        assertThat(result.getHeaders().getContentDisposition().getFilename()).isEqualTo("speech.mp3");
    }

    @Test
    void textToSpeechOptionsPassesOptionsAndReturnsSelectedFormat() {
        byte[] bytes = {4, 5, 6};
        TextToSpeechResponse modelResponse = mock(TextToSpeechResponse.class, org.mockito.Answers.RETURNS_DEEP_STUBS);
        when(modelResponse.getResult().getOutput()).thenReturn(bytes);
        when(textToSpeechModel.call(any(TextToSpeechPrompt.class))).thenReturn(modelResponse);

        ResponseEntity<byte[]> result = controller.speechWithOptions(
                new AudioSpeechOptionsPayload("hello", "nova", 1.25, "wav"));

        ArgumentCaptor<TextToSpeechPrompt> captor = ArgumentCaptor.forClass(TextToSpeechPrompt.class);
        verify(textToSpeechModel).call(captor.capture());
        OpenAiAudioSpeechOptions options = (OpenAiAudioSpeechOptions) captor.getValue().getOptions();
        assertThat(options.getVoice()).isEqualTo("nova");
        assertThat(options.getSpeed()).isEqualTo(1.25);
        assertThat(options.getResponseFormat()).isEqualTo("wav");
        assertThat(result.getHeaders().getContentType().toString()).isEqualTo("audio/wav");
        assertThat(result.getHeaders().getContentDisposition().getFilename()).isEqualTo("speech.wav");
    }
}
