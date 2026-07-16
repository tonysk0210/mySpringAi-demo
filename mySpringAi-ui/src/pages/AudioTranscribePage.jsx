import AudioTranscriptionDemo from "../components/AudioTranscriptionDemo";

export default function AudioTranscribePage() {
  return <AudioTranscriptionDemo endpoint="/audio/transcribe" title="Audio Transcription" description="上傳音訊檔，使用預設模型設定轉成純文字。" />;
}
